#version 460 core

#define MAX_LIGHTS 1
#define DEPTH 5
const float epsilon = 0.0001; // TODO move to top

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

uniform mat4 viewProj;
uniform mat4 viewIprojI;
uniform mat4 modelI;
uniform mat4 model;
uniform mat4 view;

uniform vec3 lightPos;
uniform float shininess;
uniform vec3 La;
uniform vec3 translate;

uniform Light lights[MAX_LIGHTS];
uniform Material materials[4];

layout (std430, binding=2) buffer ssbo_Vertices
{
    Vertex vertices[];
};

layout (std430, binding=3) buffer ssbo_Indices
{
    int indices[];
};

struct Sphere {
    vec3 center;
    float radius;
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

    if (det < epsilon){ //parallel
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
   
    Hit hit = plane(vec3(0,1,0), 0.2, ray);

    if (hit.t > 0 && (besthit.t < 0 || hit.t < besthit.t)){
            hit.mat = 3;
            besthit=hit;
    }
    if (dot(ray.dir, besthit.normal) > 0) besthit.normal = besthit.normal * (-1);

    hit = sphereInt(sp, ray);

    if (hit.t > 0 && (besthit.t < 0 || hit.t < besthit.t)){
            hit.mat = 0;
            besthit=hit;
    }
    if (dot(ray.dir, besthit.normal) > 0) besthit.normal = besthit.normal * (-1);

    sp.center = vec3(-6,2,-4);

    hit = sphereInt(sp, ray);

    if (hit.t > 0 && (besthit.t < 0 || hit.t < besthit.t)){
            hit.mat = 2;
            besthit=hit;
    }
    if (dot(ray.dir, besthit.normal) > 0) besthit.normal = besthit.normal * (-1);

    for (int i =0; i< indices.length(); i+=3){

        vec3 A=vertices[indices[i]].position.xyz;
        vec3 B=vertices[indices[i+1]].position.xyz;
        vec3 C=vertices[indices[i+2]].position.xyz;
        vec3 N = vertices[indices[i]].normal.xyz;
        Hit hit=rayTriangleIntersect(ray, A, B, C, N);

        if (hit.t > 0 && (besthit.t < 0 || hit.t < besthit.t)){
            hit.mat = 2;
            besthit=hit;
        }
        // if (dot(ray.dir, besthit.normal) > 0) besthit.normal = besthit.normal * (-1);

    }

    return besthit;
}

vec3 Fresnel(vec3 F0, float cosTheta) { 
		return F0 + (vec3(1, 1, 1) - F0) * pow(cosTheta, 5);
}

const int maxdepth = 5;
const int stackSize = 5; // TODO remove bit shift

struct Stack {
    Ray rays[stackSize];
    int sp;
};

vec3 refr(vec3 incomingRayDirection, vec3 normal) {
    float ior = 1/5;
    float cosa = (dot(normal, incomingRayDirection)) * -1.0;
    if (cosa < 0) {
         cosa = -cosa; 
         normal = normal*-1.0;
          ior = 1/5; 
          }
    float disc = 1 - (1 - cosa * cosa)/ior/ior;
    if (disc < 0) return reflect(incomingRayDirection, normal);
    return incomingRayDirection/ior + normal * (cosa/ior - sqrt(disc));
}

vec3 trace(Ray ray){
    vec3 outRadiance= vec3(0,0,0);

    Stack stack;
    stack.sp = 0;
    stack.rays[stack.sp++] = ray; // TODO move PUSH to function

   		// while( stack.sp > 0 ) {
		for(int e = 0; e < stackSize; e++) {
	        if ( stack.sp == 0 ) return outRadiance;
			ray = stack.rays[--stack.sp];
			
			// while(ray.depth < maxdepth) {
			for(int d = 0; d < maxdepth; d++) {
				if (ray.depth >= maxdepth) break;

				Hit hit = firstIntersect(ray);
				if (hit.t <= 0) {
					outRadiance += ray.weight * La; 
					break;
				}

				// rough surface, direct illumination
				if (materials[hit.mat].type == 0) {
					outRadiance += ray.weight * materials[hit.mat].ka * La;

					for(int l=0; l < MAX_LIGHTS; l++) {
						Ray shadowRay;
						shadowRay.orig = hit.orig + hit.normal * epsilon;
						shadowRay.dir = lights[l].position;
						float cosTheta = dot(hit.normal, lights[l].position);
						if (cosTheta > 0 && !(firstIntersect(shadowRay).t > 0)) {
							outRadiance += ray.weight * lights[l].Le * materials[hit.mat].kd * cosTheta;
							vec3 halfway = normalize(-ray.dir + lights[l].position);
							float cosDelta = dot(hit.normal, halfway);
							if (cosDelta > 0) outRadiance += ray.weight * lights[l].Le * materials[hit.mat].ks * pow(cosDelta, materials[hit.mat].shininess);
						}
					}
					break;
				}

				// refraction, postpone it // TODO remove 
				if (materials[hit.mat].type == 1) {
					Ray refractRay;
					refractRay.orig = hit.orig - hit.normal * epsilon;
					refractRay.dir = refract(ray.dir, hit.normal, (ray.outside) ? materials[hit.mat].n : 1.0f / materials[hit.mat].n);
					refractRay.depth = ray.depth + 1;
					if (refractRay.depth < maxdepth && length(refractRay.dir) > 0) {
						refractRay.weight = ray.weight * (vec3(1, 1, 1) - Fresnel(  materials[hit.mat].F0 , dot(-ray.dir, hit.normal)));
						refractRay.outside = !ray.outside;
						stack.rays[stack.sp++] = refractRay;	// push
					}
				}

				// reflection
				ray.weight *= Fresnel( materials[hit.mat].F0, dot(-ray.dir, hit.normal));
				ray.orig = hit.orig + hit.normal * epsilon;
				ray.dir = reflect(ray.dir, hit.normal);
				ray.depth++;
			}
		}
		return outRadiance;


    // for(int d = 0; d < DEPTH; d++) {
    //     Hit hit = firstIntersect(ray);

    //     if (hit.t < 0) return weight * lights[0].La;
    //     if (hit.mat == 0) {
    //         outRadiance += weight * ka * lights[0].La;
    //         Ray shadowRay;
    //         shadowRay.orig = hit.orig + hit.normal * 0.0001;
    //         shadowRay.dir = lights[0].position;
    //         float cosTheta = dot(hit.normal, lights[0].position);
    //         if (cosTheta > 0 && !(shadowIntersect(shadowRay)) ) {
    //             outRadiance += weight * lights[0].Le * kd * cosTheta;
    //             vec3 halfway = normalize(-ray.dir + lights[0].position);
    //             float cosDelta = dot(hit.normal, halfway);
    //             if (cosDelta > 0) outRadiance += weight * lights[0].Le * ks * pow(cosDelta, shininess);
    //         }
    //     }

    //     if (hit.mat == 1) {
    //         // weight *= Fresnel(vec3(0.8,0.9,0.77), dot(-ray.dir, hit.normal));
    //         // ray.orig = hit.orig + hit.normal * 0.0001;
    //         // ray.dir = reflect(ray.dir, hit.normal);
    //         weight *= vec3(1,1,1) - Fresnel(vec3(0.4,0.44,0.37), dot(-ray.dir, hit.normal));
    //         ray.orig = hit.orig - hit.normal * 0.0001;
    //         ray.dir = refr(normalize(ray.dir), hit.normal);
    //     } else return outRadiance;
    // }
}

void main()
{
	
    Ray ray;

	vec3 rayOrig, rayDir;

	getRay(vs_out_pos, rayOrig, rayDir);

    ray.orig = rayOrig;
    ray.dir = rayDir;
    ray.weight = vec3(1, 1, 1);
    ray.outside = false;
    ray.depth = 0;

    fs_out_col = vec4(trace(ray), 1);
}