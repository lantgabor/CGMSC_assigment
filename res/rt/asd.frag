#version 330 core

 

//layout (std140)

 

// input from the vertex shader
//in vec3 vs_out_pos;

 

// uniform parameters
uniform vec3 eye;
uniform vec3 up;
uniform vec3 at;
// uniform vec3 w;
// uniform vec3 u;
// uniform vec3 v;
uniform vec2 resolution;

 

// the final output color for the fragment's pixel
out vec4 fs_out_col;

 

// global parameters
vec2 tan_xy = vec2(1., 1.); // tan(fovx / 2), tan(fovy / 2) fovx,y = pi / 2
vec3 sample_triangle[3] = vec3[3] (
  vec3(0.5, 0.5, 0),
  vec3(0.5, 0, 0),
  vec3(0, 0, 0)
);

 

vec3 sample_triangle2[3] = vec3[3] (
  vec3(-1, -1, -1),
  vec3(-1, -1, 1),
  vec3(1, -1, 1)
);

 


struct Vertex {
  vec3 position; // 16
  vec3 normal; // 16
  vec2 textcoord; // 8
};

 

// struct Mesh {
//   int startIndex;
//   int endIndex;
// };

 

#define MAX_NUM_TOTAL_VERTICES 100
#define MAX_NUM_TOTAL_INDICES 100
layout (std140) uniform Meshes {
  Vertex vertices[MAX_NUM_TOTAL_VERTICES];
//  int vertexCount;
//  int indices[MAX_NUM_TOTAL_INDICES];
//  int indexCount;
};

 

struct Ray {
  vec3 p0;
  vec3 v;
};

 

Ray createRay(vec2 fragCoord) {

 

  // vec3 eye = vec3(0, 0, -2);
  // vec3 at = vec3(0, 0, 0);
  // vec3 up = vec3(0, 1, 0);

 

  vec3 w = normalize(eye - at);
  vec3 u = normalize(cross(up, w));
  vec3 v = cross(w, u);
 
  // Remark: it can be simplified, but remain for the understanding
  vec2 alpha_beta = tan_xy * (fragCoord - resolution / 2.) / (resolution / 2.); // clap between -1 and 1
  vec2 alpha_beta_with_aspect = alpha_beta * normalize(resolution); // fix aspect ratio

 

  //vec3 p0 = normalize(w + alpha_beta_with_aspect.x * u + alpha_beta_with_aspect.y * v);

 

  vec2 px = (fragCoord/resolution.xy*2.-1.)*1.*normalize(resolution.xy);
  vec3 p0 = normalize(w+px.x*u+px.y*v);

 

  vec3 rv = normalize(p0 - eye);
  
  return Ray(p0, rv);
}

 

float triangleIntersection(Ray ray, vec3 a, vec3 b, vec3 c, out float out_u, out float out_v) {
  vec3 p0 = ray.p0;
  vec3 v = ray.v;
  vec3 ab = b - a;
  vec3 ac = c - a;
  vec3 ap = p0 - a;
  vec3 f = cross(v, ac);
  vec3 g = cross(ap, ab);

 

  if (dot(f, ab) < 1e-8 || abs(dot(f, ab)) < 1e-8) {
    return -1;
  }
  
  vec3 params = (1. / dot(f, ab)) * vec3(dot(g, ac), dot(f, ap), dot(g, v));
  if (params.y < 0 || params.y > 1) { return -1; }
//  if (params.z < 0 || params.z > 1) { return 0.; }
  if (params.z < 0 || (params.y + params.z) > 1) { return -1; }
  if (params.x < 0) { return -1; }
//  if (params.x > 0.8) { return 0; }
//  if ((params.x + params.y + params.z) > 1) { return 0; } // WHY IS IT NEEDED?
  
//  if (params.y >= 0 && params.y <= 1 && params.z >= 0 && params.z <= 1) {
    // intersection depends on the t
//    return params.x;
//  }
  if (abs(params.x) <= 1e-3) {
    return -1;
  }

 

  out_u = params.y;
  out_v = params.z;
  return params.x;

 

  // no intersection
//  return 0.;
}

 

void main() {

 

  vec2 fragCoord = gl_FragCoord.xy;
  Ray ray = createRay(fragCoord);

 

  // fs_out_col = vec4(0, 0, 0, 1);
  // for (int i = 0; i < 9; i+=3) {
  //   Vertex a = vertices[i];
  //   Vertex b = vertices[i+1];
  //   Vertex c = vertices[i+2];
  //   float t_intersect = triangleIntersection(ray, a.position, b.position, c.position);
  //   if (t_intersect > 0) {
  //     fs_out_col = vec4(0, 1, 0, 1);
  //   }
  // }

 

  float intersect_u;
  float intersect_v;
 float t_intersect = triangleIntersection(ray, sample_triangle2[0], sample_triangle2[1], sample_triangle2[2],
                                          intersect_u, intersect_v);
  
  //vec3 rescaled = (vs_out_pos + 1) / 2;

 

 if (t_intersect > 0.001 && t_intersect < 100) {
    fs_out_col = vec4(intersect_u, intersect_v, 0, 1);
  } else {
    fs_out_col = vec4(0, 0, 0, 1);
  }

 

}