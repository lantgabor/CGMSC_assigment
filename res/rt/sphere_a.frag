#version 460 core


struct Vertex{
    vec4 position;
    vec4 normal;
    vec4 texcoord;
};

layout (std430, binding=2) buffer ssbo_Vertices
{
    Vertex vertices[];
};

layout (std430, binding=3) buffer ssbo_Indices
{
    int indices[];
};

in vec3 vs_out_pos;

out vec4 fs_out_col;

uniform mat4 viewProj;
uniform mat4 viewIprojI;
uniform mat4 modelI;
uniform mat4 model;
uniform mat4 view;


uniform vec3 lightPos = vec3(0,20,0);

void getRay(in vec3 inVec, out vec3 rayOrig, out vec3 rayDir)
{
	// a vil�gKR-ben a kattint�snak a k�zeli v�g�s�kon megfeleltetett pont koordin�t�i
	vec4 nearPt = viewIprojI * vec4(inVec.xy,-1, 1);
	// a vil�gKR-ben a kattint�snak a t�voli v�g�s�kon megfeleltetett pont koordin�t�i
	vec4 farPt  = viewIprojI * vec4(inVec.xy, 1, 1);

	// induljon a sug�r a k�zeli v�gos�kr�
	rayOrig = nearPt.xyz/nearPt.w;

	// a sug�r ir�nya innen trivi
	vec3 rayEnd = farPt.xyz/farPt.w;
	rayDir  = normalize( rayEnd - rayOrig  );
}

struct Light{
    vec3 Le, La;
    vec3 direction;
    vec3 position;

};

struct Ray{
    vec3 orig, dir;
};

struct Hit{
    vec3 orig, dir, normal;
    float t;
};

struct IntersectionPoint{
    float t;

};

vec3 outIntersectionPoint;

Hit rayTriangleIntersect(Ray ray, vec3 v0, vec3 v1, vec3 v2, vec3 N){

    Hit hit;
    float t; float u; float v;
    vec3 v0v1 = v1 - v0;
    vec3 v0v2 = v2 - v0;
    vec3 pvec = cross(ray.dir, v0v2);
    float det = dot(v0v1, pvec);


    if (abs(det) < 0.008){
        hit.t=-1;
        return hit;// Culling is off
    }
    float invDet = 1 / det;

    vec3 tvec = ray.orig - v0;
    u = dot(tvec, pvec) * invDet;
    if (u < 0 || u > 1){
        hit.t=-1;
        return hit;
    }

    vec3 qvec = cross(tvec, v0v1);
    v = dot(ray.dir, qvec) * invDet;
    if (v < 0 || u + v > 1) {
        hit.t=-1;
        return hit;
    }

    hit.t = dot(v0v2, qvec) * invDet;
    hit.normal= cross(v0v1, v0v2);
    return hit;
}


Hit firstIntersect(Ray ray){
    Hit besthit;
    besthit.t=-1;
    for (int i =0; i< vertices.length()-10; ++i){

        vec3 A=vertices[indices[3*i]].position.xyz;
        vec3 B=vertices[indices[3*i+1]].position.xyz;
        vec3 C=vertices[indices[3*i+2]].position.xyz;
        vec3 N = vertices[indices[3*i]].normal.xyz;
        Hit hit=rayTriangleIntersect(ray, A, B, C, N);

        if (hit.t>0 && (besthit.t>hit.t || besthit.t<0)){
            besthit=hit;
        }

    }
    return besthit;
}

vec3 trace(Ray ray){
    vec3 color= vec3(0, 0, 0);
    vec3 ka= vec3(0.135, 0.2225, 0.1575);
    vec3 kd= vec3(0.54, 0.89, 0.63);

    Light light;
	light.Le = vec3(0.3,0.5,0.4);
	light.La = vec3(0.2,0.2,0.5);
    light.direction = lightPos;

    Hit hit=firstIntersect(ray);

    if (hit.t==-1){ return light.La; }

    color=light.La*ka;

// The below part is under contruction, but functions well.
        Ray shadowRay;
        shadowRay.orig=hit.orig+hit.normal*0.001f;
        shadowRay.dir=light.direction;
        float cosTheta = dot(hit.normal, light.direction)/(length(hit.normal)*length(light.direction));
        if (cosTheta > 0){
            color+=light.Le*cosTheta*kd;
            float cosDelta=dot(hit.normal, normalize(-ray.dir + light.direction));
            if (cosDelta>0){
                color=color+light.Le*vec3(0.316228, 0.316228, 0.316228)*pow(0.1, cosDelta);
            }
        }
        return color;
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