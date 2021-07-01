#version 460 core

#define MAX_LIGHTS 2
#define DEPTH 5
#define MAX_MATERIALS 9
const float epsilon = 0.0001;

in vec3 vs_out_pos;

out vec4 fs_out_col;

struct Vertex{
    vec4 position; // 16
    vec4 normal; // 32
    vec4 texcoord; // 48 
};

struct Material{
    vec3 ka, kd, ks;
    float shininess;
    vec3 F0;
    float n; // IOR
    int type;
};

struct Light{
    vec3 Le, La;
    vec3 position;
};

struct Ray{
    vec3 orig, dir;
    vec3 weight;
    bool outside;
    int depth;
};

struct Hit{
    vec3 orig, normal;
    float t;
    int mat;
};

struct Sphere {
    vec3 center;
    float radius;
};

uniform Sphere spheres[13];
uniform Light lights[MAX_LIGHTS];
uniform Material materials[MAX_MATERIALS];

uniform samplerCube cubemap; // skybox texture sampler

uniform mat4 viewProj;
uniform mat4 viewIprojI;
uniform mat4 modelI;
uniform mat4 model;
uniform mat4 view;

uniform vec3 lightPos;
uniform vec3 La;

layout (std430, binding=2) buffer ssbo_Vertices
{
    Vertex vertices[];
};

layout (std430, binding=3) buffer ssbo_Indices
{
    int indices[];
};



void getRay(in vec3 inVec, out vec3 rayOrig, out vec3 rayDir)
{
	// points on the close plane
	vec4 nearPt = viewIprojI * vec4(inVec.xy,-1, 1);
	// points on the far plane
	vec4 farPt  = viewIprojI * vec4(inVec.xy, 1, 1);

	// start ray from the close plane
	rayOrig = nearPt.xyz/nearPt.w;

	// raydir
	vec3 rayEnd = farPt.xyz/farPt.w;
	rayDir  = normalize( rayEnd - rayOrig  );
}

Hit rayTriangleIntersect(Ray ray, vec3 v0, vec3 v1, vec3 v2, vec3 N){
    Hit hit;
    float t; float u; float v;
    vec3 edge1 = v1 - v0; // edge 1
    vec3 edge2 = v2 - v0; // edge 2
    vec3 pvec = cross(ray.dir, edge2); // h
    float det = dot(edge1, pvec); // a

    // if the determinant is negative the triangle is backfacing
    // if the determinant is close to 0, the ray misses the triangle
    if (det < epsilon){
        hit.t=-1;
        return hit;
    }

    float invDet = 1 / det; // f
    vec3 s = ray.orig - v0; // s
    u = dot(s, pvec) * invDet; // u
    if (u < 0 || u > 1){
        hit.t=-1;
        return hit;
    }

    vec3 q = cross(s, edge1); // q
    v = dot(ray.dir, q) * invDet; // v
    if (v < 0 || u + v > 1) {
        hit.t=-1;
        return hit;
    }

    hit.t = dot(edge2, q) * invDet; // t
    vec3 edge3 = v2-v1;
    hit.normal= normalize(cross(edge1, edge2)); //  N; // normal // cross(edge1, edge2); //
    return hit;
}

Hit plane(const vec3 n, const float d, const Ray ray)
{
    Hit hit;
    hit.t = -1;
	float denominator = dot(n, ray.dir);
	if(abs(denominator) < 0.001)
	{
		//no intersection
		return hit;
	}
	hit.t = (-d-dot(n, ray.orig)) / denominator;
    hit.orig = ray.orig + ray.dir * hit.t;
    hit.normal = n;
    return hit;
}

Hit sphereInt(Sphere object, Ray ray) {
		Hit hit;
		hit.t = -1;
		vec3 dist = ray.orig - object.center;
		float a = dot(ray.dir, ray.dir);
		float b = dot(dist, ray.dir) * 2.0f;
		float c = dot(dist, dist) - object.radius * object.radius;
		float discr = b * b - 4.0f * a * c;
		if (discr < 0) return hit;
		float sqrt_discr = sqrt(discr);
		float t1 = (-b + sqrt_discr) / 2.0f / a;	// t1 >= t2 for sure
		float t2 = (-b - sqrt_discr) / 2.0f / a;
		if (t1 <= 0) return hit;
		hit.t = (t2 > 0) ? t2 : t1;
		hit.orig = ray.orig + ray.dir * hit.t;
		hit.normal = (hit.orig - object.center) / object.radius;
		return hit;
}

Hit firstIntersect(Ray ray){
    Sphere sp;
    sp.radius = 2;
    sp.center = vec3(4,2,3);

    Hit besthit;
    besthit.t=-1;
   
    Hit hit = plane(vec3(0,1,0), 0, ray);

    if (hit.t > 0 && (besthit.t < 0 || hit.t < besthit.t)){
            hit.mat = 3;
            besthit=hit;
    }
    if (dot(ray.dir, besthit.normal) > 0) besthit.normal = besthit.normal * (-1);

    hit = sphereInt(sp, ray);

    if (hit.t > 0 && (besthit.t < 0 || hit.t < besthit.t)){
            hit.mat = 1;
            besthit=hit;
    }
    if (dot(ray.dir, besthit.normal) > 0) besthit.normal = besthit.normal * (-1);

    for (int i=0; i<spheres.length(); ++i){
        hit = sphereInt(spheres[i], ray);
        if (hit.t > 0 && (besthit.t < 0 || hit.t < besthit.t)){
            hit.mat = i % MAX_MATERIALS;
            besthit=hit;
        }
        if (dot(ray.dir, besthit.normal) > 0) besthit.normal = besthit.normal * (-1);
    }

    for (int i =0; i< indices.length(); i+=3){

        vec3 A=vertices[indices[i]].position.xyz;
        vec3 B=vertices[indices[i+1]].position.xyz;
        vec3 C=vertices[indices[i+2]].position.xyz;
        vec3 N = vertices[indices[i]].normal.xyz;
        Hit hit=rayTriangleIntersect(ray, A, B, C, N);

        if (hit.t > 0 && (besthit.t < 0 || hit.t < besthit.t)){
            hit.mat = 0;
            besthit=hit;
        }
        // if (dot(ray.dir, besthit.normal) > 0) besthit.normal = besthit.normal * (-1);

    }

    return besthit;
}

// Schlick approx
vec3 Fresnel(vec3 F0, float cosTheta) { 
		return F0 + (vec3(1, 1, 1) - F0) * pow(cosTheta, 5);
}

struct Stack {
    Ray rays[DEPTH];
    int siz;
};

vec3 trace(Ray ray){
    vec3 outRadiance= vec3(0,0,0);

    Stack stack;
    stack.siz = 0;
    stack.rays[stack.siz++] = ray; // move first ray to stack

   		while( stack.siz > 0 ) { // while the stack is not empty
	        if ( stack.siz == 0 ) return outRadiance; // if empty return with radiance
			ray = stack.rays[--stack.siz]; // pop ray from stack
			
			while(ray.depth < DEPTH) { // recursion loop
				if (ray.depth >= DEPTH) break;

				Hit hit = firstIntersect(ray);
				if (hit.t <= 0) { // return sky
					outRadiance += ray.weight * vec3(texture(cubemap, ray.dir).xyz); 
					break;
				}

                /* ROUGH MATERIAL */
				if (materials[hit.mat].type == 0) {
					outRadiance += ray.weight * materials[hit.mat].ka * La;

					for(int l=0; l < MAX_LIGHTS; l++) {
						float cosTheta = dot(hit.normal, lights[l].position);

						Ray shadowRay;
						shadowRay.orig = hit.orig + hit.normal * epsilon;
						shadowRay.dir = lights[l].position;
                        /* SHADOW RAY */
						if (cosTheta > 0 && !(firstIntersect(shadowRay).t > 0)) {
							outRadiance += ray.weight * lights[l].Le * materials[hit.mat].kd * cosTheta;
							vec3 halfway = normalize(-ray.dir + lights[l].position);
							float cosDelta = dot(hit.normal, halfway);
                            /* SPECULAR */
                            if (cosDelta > 0) {
                                outRadiance += ray.weight * lights[l].Le * materials[hit.mat].ks * pow(cosDelta, materials[hit.mat].shininess);
                            } 
						}
					}
					break; // return no reflection
				}

				/* REFRACTIVE MATERIAL */
				if (materials[hit.mat].type == 1) {
					Ray rRay;
					rRay.orig = hit.orig - hit.normal * epsilon;
					rRay.dir = refract(ray.dir, hit.normal, ray.outside ? materials[hit.mat].n : 1.0f / materials[hit.mat].n);
					rRay.depth = ray.depth + 1;
					if (rRay.depth < DEPTH && length(rRay.dir) > 0) {
						rRay.weight = ray.weight * (vec3(1, 1, 1) - Fresnel(  materials[hit.mat].F0 , dot(-ray.dir, hit.normal)));
						rRay.outside = !ray.outside;
						stack.rays[stack.siz++] = rRay;	// push
					}
				}

				/* REFLECTIVE MATERIAL */
				ray.weight *= Fresnel( materials[hit.mat].F0, dot(-ray.dir, hit.normal));
				ray.orig = hit.orig + hit.normal * epsilon;
				ray.dir = reflect(ray.dir, hit.normal);
                
				ray.depth++;
			}
		}
		return outRadiance;
}

void main()
{
	
    Ray ray;
	getRay(vs_out_pos, ray.orig, ray.dir);

    ray.weight = vec3(1, 1, 1);
    ray.outside = false;
    ray.depth = 0;

    fs_out_col = vec4(trace(ray), 1);
}