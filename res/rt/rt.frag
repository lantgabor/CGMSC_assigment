#version 460 core

#define MAX_LIGHTHS 2

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
    hit.normal= N; // normal
    return hit;
}


Hit firstIntersect(Ray ray){
    Hit besthit;
    besthit.t=-1;
    for (int i =0; i< indices.length(); i+=3){

        vec3 A=vertices[indices[i]].position.xyz;
        vec3 B=vertices[indices[i+1]].position.xyz;
        vec3 C=vertices[indices[i+2]].position.xyz;
        vec3 N = vertices[indices[i]].normal.xyz;
        Hit hit=rayTriangleIntersect(ray, A, B, C, N);

        if (hit.t>0 && (besthit.t>hit.t || besthit.t<0)){
            besthit=hit;
        }

    }
    return besthit;
}

bool shadowIntersect(Ray ray){
    for (int i =0; i< indices.length(); i+=3){
        vec3 A=vertices[indices[i]].position.xyz;
        vec3 B=vertices[indices[i+1]].position.xyz;
        vec3 C=vertices[indices[i+2]].position.xyz;
        vec3 N = vertices[indices[i]].normal.xyz;
        Hit hit=rayTriangleIntersect(ray, A, B, C, N);

        if (hit.t>0 ){
            return true;
        }
    }
    return false;
}

vec3 trace(Ray ray){
    vec3 color= vec3(0.);
    vec3 weight=vec3(1.);

    vec3 ka= vec3(0.135, 0.2225, 0.1575); // material
    vec3 kd= vec3(0.54, 0.89, 0.63); // material
    vec3 ks= vec3(0.7, 0.89, 0.93); // material



    for (int l=0; l<MAX_LIGHTHS; ++l)
    {
        Hit hit=firstIntersect(ray);
        if (hit.t==-1){ return weight * lights[0].La; }


        color += weight * lights[0].La * ka;
        float cosTheta = dot(hit.normal, lights[0].position)/(length(hit.normal)*length(lights[0].position));

        Ray shadowRay;
        shadowRay.orig=hit.orig+hit.normal*0.0001f; //epsilon
        shadowRay.dir=lights[0].position;

        if (cosTheta > 0 && shadowIntersect(shadowRay)){
            color += lights[0].Le * cosTheta * kd;
            float cosDelta = dot(hit.normal, normalize(-ray.dir + lights[0].position));

            if (cosDelta>0){
                color=color+lights[0].Le*ks*pow(cosDelta, shininess);
            }
        }
        return color;
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
// 	vec3 toLight = normalize(lightPos - intersectionPoint);
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