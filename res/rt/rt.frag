#version 460 core

#define MAX_LIGHTHS 2
#define DEPTH 2

in vec3 vs_out_pos;

out vec4 fs_out_col;

struct Vertex{
    vec4 position; // 16
    vec4 normal; // 32
    vec4 texcoord; // 48
};

struct Light{
    vec3 Le, La;
    vec3 position;
};

struct Ray{
    vec3 orig, dir;
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
uniform vec3 translate;

uniform Light lights[MAX_LIGHTHS];

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
    float eps = 0.0001;
    float t; float u; float v;
    vec3 edge1 = v1 - v0; // edge 1
    vec3 edge2 = v2 - v0; // edge 2
    vec3 pvec = cross(ray.dir, edge2); // h
    float det = dot(edge1, pvec); // a


    if (abs(det) < eps){ //parallel
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
    hit.normal=  N; // normal // cross(edge1, edge2); //
    hit.mat = 0;
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
    hit.mat = 1;

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
        hit.mat = 0;

		return hit;
}

Hit box(const vec3 minP, const vec3 maxP, const Ray ray)
{
    Hit hit;
    hit.t = -1;
	vec3 diffMin = minP - ray.orig;
	vec3 diffMax = maxP - ray.orig;
	vec3 t0 = diffMin / ray.dir;
	vec3 t1 = diffMax / ray.dir;
	vec3 n = min(t0, t1);
	vec3 f = max(t0, t1);
	float enter = max(n.x, max(n.y, n.z));
	float exit = min(f.x, min(f.y, f.z));
	if(enter > exit) return hit;
	if (0.0 < enter) hit.t = enter;
	hit.t= exit;
    hit.mat = 0;

    return hit;
}

Hit firstIntersect(Ray ray){
    Sphere sp;
    sp.radius = 2;
    sp.center = vec3(4,2,3);

    Hit besthit;
    besthit.t=-1;
    for (int i =0; i< indices.length(); i+=3){

        vec3 A=vertices[indices[i]].position.xyz;
        vec3 B=vertices[indices[i+1]].position.xyz;
        vec3 C=vertices[indices[i+2]].position.xyz;
        vec3 N = vertices[indices[i]].normal.xyz;
        Hit hit=rayTriangleIntersect(ray, A, B, C, N);

        if (hit.t > 0 && (besthit.t < 0 || hit.t < besthit.t)){
            besthit=hit;
        }
        if (dot(ray.dir, besthit.normal) > 0) besthit.normal = besthit.normal * (-1);

    }
    Hit hit = plane(vec3(0,1,0), 0, ray);

    if (hit.t > 0 && (besthit.t < 0 || hit.t < besthit.t)){
            besthit=hit;
    }
    if (dot(ray.dir, besthit.normal) > 0) besthit.normal = besthit.normal * (-1);

    hit = sphereInt(sp, ray);
    // Hit hit = box(vec3(3,3,3),vec3(4,4,4), ray);

    if (hit.t > 0 && (besthit.t < 0 || hit.t < besthit.t)){
            besthit=hit;
    }
    if (dot(ray.dir, besthit.normal) > 0) besthit.normal = besthit.normal * (-1);

    return besthit;
}

vec3 Fresnel(vec3 F0, float cosTheta) { 
		return F0 + (vec3(1, 1, 1) - F0) * pow(cosTheta, 5);
}

vec3 trace(Ray ray){


    vec3 outRadiance= vec3(0,0,0);
    vec3 weight=vec3(1,1,1);

    vec3 ka= vec3(0.135, 0.2225, 0.1575); // material
    vec3 kd= vec3(0.54, 0.89, 0.63); // material
    vec3 ks= vec3(0.7, 0.89, 0.93); // material


    for(int d = 0; d < DEPTH; d++) {
        Hit hit = firstIntersect(ray);
        if (hit.t < 0) return weight * lights[0].La;
        if (hit.mat == 0) {
            outRadiance += weight * ka * lights[0].La;
            Ray shadowRay;
            shadowRay.orig = hit.orig + hit.normal * 0.0001;
            shadowRay.dir = lights[0].position;
            float cosTheta = dot(hit.normal, lights[0].position);
            if (cosTheta > 0 && !(firstIntersect(shadowRay).t > 0)) {
                outRadiance += weight * lights[0].Le * kd * cosTheta;
                vec3 halfway = normalize(-ray.dir + lights[0].position);
                float cosDelta = dot(hit.normal, halfway);
                if (cosDelta > 0) outRadiance += weight * lights[0].Le * ks * pow(cosDelta, shininess);
            }
        }

        if (hit.mat == 1) {
            weight *= Fresnel(vec3(0.8,0.9,0.77), dot(-ray.dir, hit.normal));
            ray.orig = hit.orig + hit.normal * 0.0001;
            ray.dir = reflect(ray.dir, hit.normal);
        } else return outRadiance;
    }
}


void main()
{
	
    Ray ray;

	vec3 rayOrig, rayDir;

	getRay(vs_out_pos, rayOrig, rayDir);

    ray.orig = rayOrig;
    ray.dir = rayDir;
    fs_out_col = vec4(trace(ray), 1);
}

// void main()
// {
// 	vec3 rayOrig, rayDir;

// 	getRay(vs_out_pos, rayOrig, rayDir);

// 	rayOrig = (modelI * vec4(rayOrig, 1) ).xyz;
// 	rayDir  = (modelI * vec4(rayDir,  0) ).xyz;

// 	// masodfoku egyenlet eh-i
// 	float A = dot(rayDir,rayDir); // kell ez?
// 	float B = 2*dot(rayDir, rayOrig - center);
// 	float C = dot( rayOrig - center, rayOrig - center) - r*r;

// 	// oldjuk is meg
// 	float discr = B*B - 4*A*C;

// 	if ( discr < 0)
// 	{
// 		// nincs mp
// 		discard;
// 	}

// 	// gyokok
// 	float t1 = (-B - sqrt(discr))/(2*A);
// 	float t2 = (-B + sqrt(discr))/(2*A);

// 	float t = t1;

// 	if ( t1 < 0 )
// 		t = t2;

// 	// ha mogottunk van a metszespont, akkor dobjuk el a fragmentet
// 	if ( t < 0 )
// 		discard;

// 	// k�l�nben sz�m�tsuk ki a metsz�spontot
// 	vec3 intersectionPoint = rayOrig + t*rayDir;
// 	vec3 surfaceNormal = normalize(intersectionPoint - center);

// 	intersectionPoint = (model * vec4(intersectionPoint, 1) ).xyz;
// 	surfaceNormal = normalize( ( model * vec4(surfaceNormal, 0) ).xyz);

// 	// egyszeru diffuz szin
// 	vec3 toLight = normalize(lights[0]Pos - intersectionPoint);
// 	vec4 diffuseColor = vec4(clamp( dot(surfaceNormal, toLight), 0, 1 ));

// 	fs_out_col = diffuseColor + vec4(0.2f);

// 	// viewport transzform�ci�: http://www.songho.ca/opengl/gl_transform.html 
// 	// gl_DepthRange: http://www.opengl.org/registry/doc/GLSLangSpec.4.30.6.pdf , 130.o. 
// 	vec4 clipPos = viewProj * vec4( intersectionPoint, 1 );

// 	float zndc = clipPos.z / clipPos.w; 

// 	float n = gl_DepthRange.near;
// 	float f = gl_DepthRange.far;

// 	gl_FragDepth = (f-n)/2 * zndc + (f+n)/2;
// }