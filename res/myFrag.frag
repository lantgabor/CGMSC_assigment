#version 400

// per-fragment attributes coming from the pipeline
in vec3 vs_out_pos;
in vec3 vs_out_normal;
in vec2 vs_out_tex0;

// multiple outputs are directed into different color textures by the FBO
layout(location=0) out vec4 fs_out_diffuse;
layout(location=1) out vec3 fs_out_normal;
layout(location=2) out vec4 fs_out_position;

// Different geometries may be drawn with different textures attached
uniform sampler2D texImage;
uniform float specular_power = 100;

void main(void) {
	fs_out_position = vec4(vs_out_pos,1);
	fs_out_diffuse = vec4(texture(texImage, vs_out_tex0).rgb, specular_power/256.0);
	fs_out_normal = normalize(vs_out_normal);
}