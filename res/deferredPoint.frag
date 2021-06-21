#version 130

in vec2 vs_out_tex;

out vec4 fs_out_col;

uniform sampler2D diffuseTexture;
uniform sampler2D normalTexture;
uniform sampler2D positionTexture;

uniform vec3 lightPos = vec3(0,-1,0);
uniform vec4 Ld = vec4(0.5,0.5,0.5,1);
uniform vec4 Ls = vec4(2);

uniform vec3 cameraPosition;

void main()
{
	vec3 pos = texture(positionTexture, vs_out_tex).xyz;
	float specular_power = texture(diffuseTexture, vs_out_tex).w*256.0;

	vec3 lightDir = normalize(lightPos - pos);
	float lightDist = distance(lightPos, pos);

	vec4 Kd = texture( diffuseTexture, vs_out_tex );
	vec3 n = normalize( texture( normalTexture, vs_out_tex ).rgb );

	float di = clamp(dot(n, lightDir), 0, 1);

	vec4 specular = vec4(0);

	if(di > 0)
	{
		vec3 toEye = normalize(cameraPosition-pos);
		vec3 h = normalize(toEye + lightDir);
		float si = pow(clamp(dot(h,n),0,1),specular_power);
		specular = vec4(si,si,si,1);
	}

	//todo specular brdf model

	fs_out_col = (di*Kd*Ld + specular*Ls)/lightDist;
}