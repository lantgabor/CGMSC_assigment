#include "MyApp.h"
#include "GLUtils.hpp"

#include <GL/glu.h>
#include <math.h>

#include "ObjParser_OGL3.h"
#include "imgui/imgui.h"

float rand_FloatRange(float a, float b)
{
    return ((b - a) * ((float)rand() / RAND_MAX)) + a;
}

CMyApp::CMyApp(void)
{
	// m_textureID = 0;
	m_skyboxID = 0;
	m_mesh = 0;
}


CMyApp::~CMyApp(void)
{
}

bool CMyApp::Init()
{
	glClearColor(0.2, 0.4, 0.7, 1);	// Clear color is bluish
	// glEnable(GL_CULL_FACE);			// Drop faces looking backwards
	// glEnable(GL_DEPTH_TEST);		// Enable depth test


	// screen quad
	m_quad_vb.AddAttribute(0, 3);

	m_quad_vb.AddData( 0, -1, -1, 0 );
	m_quad_vb.AddData( 0,  1, -1, 0 );
	m_quad_vb.AddData( 0, -1,  1, 0 );
	m_quad_vb.AddData( 0,  1,  1, 0 );

	m_quad_vb.InitBuffers();

	m_sphere_program.AttachShader(GL_VERTEX_SHADER,		"../res/rt/rt.vert");
	m_sphere_program.AttachShader(GL_FRAGMENT_SHADER,	"../res/rt/rt.frag");

	m_sphere_program.BindAttribLoc(0, "vs_in_pos");

	if ( !m_sphere_program.LinkProgram() )
	{
		return false;
	}

	// Camera
	m_camera.SetProj(45.0f, 640.0f/480.0f, 0.01f, 1000.0f);

	//Materials http://www.it.hiof.no/~borres/j3d/explain/light/p-materials.html
	materials.push_back(new Rough(glm::vec3(0.1, 0.2, 0.3), glm::vec3(10, 10, 10), 155 ));
	materials.push_back(new Glass(glm::vec3(0.1, 0.13, 0.15), 1.2 ));
	materials.push_back(new Metal(glm::vec3(0.797357, 0.623991, 0.308006)));
	materials.push_back(new Rough(glm::vec3(0.1, 0.1, 0.1), glm::vec3(2, 2, 2), 124 ));
	materials.push_back(new Rough(glm::vec3(0.3, 0.2, 0.1), glm::vec3(5, 5, 2), 77 ));
	materials.push_back(new Metal(glm::vec3(0.46621, 0.43152, 0.45414)));
	materials.push_back(new Glass(glm::vec3(0.1, 0.33, 0.15), 2.2 ));
	materials.push_back(new Glass(glm::vec3(0.3, 0.13, 0.15), 1.7 ));
	materials.push_back(new Rough(glm::vec3(0.4, 0.2, 0.4), glm::vec3(2, 5, 3), 32 ));

	//Lights
	lights.push_back(new Light(lightPos, glm::vec3(1.1,1.2,1.3)));
	lights.push_back(new Light(glm::vec3(-5,5,5), glm::vec3(1.5,1.2,1.2)));

	//Spheres
	spheres.push_back(new Sphere(glm::vec3(-4,2,-3), 2));
	spheres.push_back(new Sphere(glm::vec3(4,2,3), 2));
	float r = 0;
	r = rand_FloatRange(0.5,2.2);
	spheres.push_back(new Sphere(glm::vec3(rand_FloatRange(-25,25) + 2, r, rand_FloatRange(-25,25) + 2), r));
	r = rand_FloatRange(0.5,2.2);
	spheres.push_back(new Sphere(glm::vec3(rand_FloatRange(-25,25) - 2, r, rand_FloatRange(-25,25) - 2), r));
	r = rand_FloatRange(0.5,2.2);
	spheres.push_back(new Sphere(glm::vec3(rand_FloatRange(-25,25) + 2, r, rand_FloatRange(-25,25) - 2), r));
	r = rand_FloatRange(0.5,2.2);
	spheres.push_back(new Sphere(glm::vec3(rand_FloatRange(-25,25) - 2, r, rand_FloatRange(-25,25) - 2), r));
	r = rand_FloatRange(0.5,2.2);
	spheres.push_back(new Sphere(glm::vec3(rand_FloatRange(-25,25) - 2, r, rand_FloatRange(-25,25) + 2), r));
	r = rand_FloatRange(0.5,2.2);
	spheres.push_back(new Sphere(glm::vec3(rand_FloatRange(-25,25) - 2, r, rand_FloatRange(-25,25) - 2), r));
	r = rand_FloatRange(0.5,2.2);
	spheres.push_back(new Sphere(glm::vec3(rand_FloatRange(-25,25) + 2, r, rand_FloatRange(-25,25) + 2), r));
	r = rand_FloatRange(0.5,2.2);
	spheres.push_back(new Sphere(glm::vec3(rand_FloatRange(-25,25) - 2, r, rand_FloatRange(-25,25) - 2), r));
	r = rand_FloatRange(0.5,2.2);
	spheres.push_back(new Sphere(glm::vec3(rand_FloatRange(-25,25) + 2, r, rand_FloatRange(-25,25) - 2), r));
	r = rand_FloatRange(0.5,2.2);
	spheres.push_back(new Sphere(glm::vec3(rand_FloatRange(-25,25) - 2, r, rand_FloatRange(-25,25) - 2), r));
	r = rand_FloatRange(0.5,2.2);
	spheres.push_back(new Sphere(glm::vec3(rand_FloatRange(-25,25) - 2, r, rand_FloatRange(-25,25) + 2), r));
	r = rand_FloatRange(0.5,2.2);
	spheres.push_back(new Sphere(glm::vec3(rand_FloatRange(-25,25) + 2, r, rand_FloatRange(-25,25) - 2), r));

	// Loading texture
	//m_textureID = TextureFromFile("../res/texture.png");

	m_skyboxID = AttachSkyboxCube();

	// Loading mesh
	m_mesh = ObjParser::parse("../res/cube.obj", new Mesh());

	m_mesh->initSSBO();
	// grid.addMesh(m_mesh);
	// m_mesh->initBuffers();

	return true;
}

void CMyApp::Clean()
{
	// glDeleteTextures(1, &m_textureID);
	glDeleteTextures(1, &m_skyboxID);

	m_sphere_program.Clean();

	m_quad_vb.Clean();
}

void CMyApp::Update()
{
	static Uint32 last_time = SDL_GetTicks();
	float delta_time = (SDL_GetTicks() - last_time)/1000.0f;

	m_camera.Update(delta_time);

	last_time = SDL_GetTicks();
}


void CMyApp::Render()
{
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

	m_sphere_program.On();

		m_quad_vb.On();

			glm::mat4 sphere_world = glm::translate(  glm::vec3(0,0,0) );

            auto _Proj =  m_camera.GetViewProj();
            auto _IProjI = glm::inverse( m_camera.GetProj() * m_camera.GetViewMatrix() );
            auto _view = m_camera.GetViewMatrix();
            auto _modelI = glm::inverse(sphere_world);

			m_sphere_program.SetCubeTexture("cubemap", 0 , m_skyboxID);

			m_sphere_program.SetUniform("viewProj",		_Proj );
			m_sphere_program.SetUniform("viewIprojI",	_IProjI );
			m_sphere_program.SetUniform("view",			_view );
			m_sphere_program.SetUniform("modelI",		_modelI );
			m_sphere_program.SetUniform("model",		sphere_world );
			m_sphere_program.SetUniform("La",    		La );


			m_sphere_program.SetUniformLights(lights);
			m_sphere_program.SetUniformMaterials(materials);
			m_sphere_program.SetUniformSpheres(spheres);

			m_sphere_program.SetUniform("lights[0].position",		lightPos );
			m_sphere_program.SetUniform("materials[0].shininess", 	shininess );

			m_quad_vb.Draw(GL_TRIANGLE_STRIP, 0, 4);

		m_quad_vb.Off();

	m_sphere_program.Off();

	ImGui::SetNextWindowPos(ImVec2(300, 400), ImGuiCond_FirstUseEver);
	if(ImGui::Begin("Tools")) // Note that ImGui returns false when window is collapsed so we can early-out
	{
		ImGui::SliderFloat3("light_pos", &lightPos.x, -1.f, 1.f);
		ImGui::SliderFloat("shininess", &shininess, 0.1f, 155.f);
	}
	ImGui::End(); // In either case, ImGui::End() needs to be called for ImGui::Begin().
		// Note that other commands may work differently and may not need an End* if Begin* returned false.


}

void CMyApp::KeyboardDown(SDL_KeyboardEvent& key)
{
	m_camera.KeyboardDown(key);
}

void CMyApp::KeyboardUp(SDL_KeyboardEvent& key)
{
	m_camera.KeyboardUp(key);
}

void CMyApp::MouseMove(SDL_MouseMotionEvent& mouse)
{
	m_camera.MouseMove(mouse);
}

void CMyApp::MouseDown(SDL_MouseButtonEvent& mouse)
{
}

void CMyApp::MouseUp(SDL_MouseButtonEvent& mouse)
{
}

void CMyApp::MouseWheel(SDL_MouseWheelEvent& wheel)
{
}

void CMyApp::Resize(int _w, int _h)
{
	glViewport(0, 0, _w, _h);

	m_camera.Resize(_w, _h);
}
