#include "MyApp.h"
#include "GLUtils.hpp"

#include <GL/GLU.h>
#include <math.h>

#include "ObjParser_OGL3.h"
#include "imgui/imgui.h"


CMyApp::CMyApp(void)
{
	m_textureID = 0;
	m_mesh = 0;
}


CMyApp::~CMyApp(void)
{
}


GLuint CMyApp::GenTexture()
{
    unsigned char tex[256][256][3];
 
    for (int i=0; i<256; ++i)
        for (int j=0; j<256; ++j)
        {
			tex[i][j][0] = rand()%256;
			tex[i][j][1] = rand()%256;
			tex[i][j][2] = rand()%256;
        }
 
	GLuint tmpID;

	// gener�ljunk egy text�ra er�forr�s nevet
    glGenTextures(1, &tmpID);
	// aktiv�ljuk a most gener�lt nev� text�r�t
    glBindTexture(GL_TEXTURE_2D, tmpID);
	// t�lts�k fel adatokkal az...
    gluBuild2DMipmaps(  GL_TEXTURE_2D,	// akt�v 2D text�r�t
						GL_RGB8,		// a v�r�s, z�ld �s k�k csatorn�kat 8-8 biten t�rolja a text�ra
						256, 256,		// 256x256 m�ret� legyen
						GL_RGB,				// a text�ra forr�sa RGB �rt�keket t�rol, ilyen sorrendben
						GL_UNSIGNED_BYTE,	// egy-egy sz�nkopmonenst egy unsigned byte-r�l kell olvasni
						tex);				// �s a text�ra adatait a rendszermem�ria ezen szeglet�b�l t�lts�k fel
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);	// biline�ris sz�r�s kicsiny�t�skor
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);	// �s nagy�t�skor is
	glBindTexture(GL_TEXTURE_2D, 0);

	return tmpID;
}

bool CMyApp::Init()
{
	glClearColor(0.2, 0.4, 0.7, 1);	// Clear color is bluish
	// glEnable(GL_CULL_FACE);			// Drop faces looking backwards
	// glEnable(GL_DEPTH_TEST);		// Enable depth test

	// talaj
	m_vb.AddAttribute(0, 3);
	m_vb.AddAttribute(1, 3);
	m_vb.AddAttribute(2, 2);

	m_vb.AddData(0, -10,  0, -10);
	m_vb.AddData(0,  10,  0, -10);
	m_vb.AddData(0, -10,  0,  10);
	m_vb.AddData(0,  10,  0,  10);

	m_vb.AddData(1, 0, 1, 0);
	m_vb.AddData(1, 0, 1, 0);
	m_vb.AddData(1, 0, 1, 0);
	m_vb.AddData(1, 0, 1, 0);

	m_vb.AddData(2, 0, 0);
	m_vb.AddData(2, 1, 0);
	m_vb.AddData(2, 0, 1);
	m_vb.AddData(2, 1, 1);

	m_vb.AddIndex(1, 0, 2);
	m_vb.AddIndex(1, 2, 3);

	m_vb.InitBuffers();

	// QUAD FOR WHOLE SCREEN
	m_quad_vb.AddAttribute(0, 3);
	
	m_quad_vb.AddData( 0, -1, -1, 0 );
	m_quad_vb.AddData( 0,  1, -1, 0 );
	m_quad_vb.AddData( 0, -1,  1, 0 );
	m_quad_vb.AddData( 0,  1,  1, 0 );

	m_quad_vb.InitBuffers();

	//
	// Load shaders
	//
	m_program.AttachShader(GL_VERTEX_SHADER, "../res/rt/dirLight.vert");
	m_program.AttachShader(GL_FRAGMENT_SHADER, "../res/rt/dirLight.frag");

	m_program.BindAttribLoc(0, "vs_in_pos");
	m_program.BindAttribLoc(1, "vs_in_normal");
	m_program.BindAttribLoc(2, "vs_in_tex0");

	if ( !m_program.LinkProgram() )
	{
		return false;
	}

	// gombshader
	m_sphere_program.AttachShader(GL_VERTEX_SHADER,		"../res/rt/sphere_a.vert");
	m_sphere_program.AttachShader(GL_FRAGMENT_SHADER,	"../res/rt/sphere_a.frag");

	m_sphere_program.BindAttribLoc(0, "vs_in_pos");

	if ( !m_sphere_program.LinkProgram() )
	{
		return false;
	}

	// Camera
	m_camera.SetProj(45.0f, 640.0f/480.0f, 0.01f, 1000.0f);

	// Loading texture
	m_textureID = TextureFromFile("../res/texture.png");

	// Loading mesh
	m_mesh = ObjParser::parse("../res/suzanne.obj");



	m_mesh->initUBO();
	// m_mesh->initBuffers();

	return true;
}

void CMyApp::Clean()
{
	glDeleteTextures(1, &m_textureID);

	m_program.Clean();
	m_sphere_program.Clean();

	m_vb.Clean();
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
	// t�r�lj�k a frampuffert (GL_COLOR_BUFFER_BIT) �s a m�lys�gi Z puffert (GL_DEPTH_BUFFER_BIT)
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

	// m_program.On();

	// 	glm::mat4 matWorld = glm::mat4(1.0f);
	// 	glm::mat4 matWorldIT = glm::transpose( glm::inverse( matWorld ) );
	// 	glm::mat4 mvp = m_camera.GetViewProj() *matWorld;

	// 	m_program.SetUniform( "Kd", glm::vec4(1,0.5f,0.5f,1) );
	// 	m_program.SetUniform( "world", matWorld );
	// 	m_program.SetUniform( "worldIT", matWorldIT );
	// 	m_program.SetUniform( "MVP", mvp );
	// 	m_program.SetUniform( "eye_pos", m_camera.GetEye() );

	// 	m_program.SetTexture("texImage", 0, m_textureID);

	// 	// kapcsoljuk be a VAO-t (a VBO j�n vele egy�tt)
	// 	m_vb.On();

	// 		m_vb.DrawIndexed(GL_TRIANGLES, 0, 6, 0);

	// 	m_vb.Off();

	// // shader kikapcsolasa
	// m_program.Off();

	// // 2. program
	// m_program.On();

	// 	matWorld = glm::translate( glm::vec3(0, 1, 0) );
	// 	matWorldIT = glm::transpose( glm::inverse( matWorld ) );
	// 	mvp = m_camera.GetViewProj() *matWorld;

	// 	m_program.SetUniform( "Kd", glm::vec4(1,1,1,1) );
	// 	m_program.SetUniform( "world", matWorld );
	// 	m_program.SetUniform( "worldIT", matWorldIT );
	// 	m_program.SetUniform( "MVP", mvp );
	// 	m_program.SetUniform( "eye_pos", m_camera.GetEye() );

	// 	m_program.SetTexture("texture", 0, m_textureID);

	// 	m_mesh->draw();

	// m_program.Off();


	// Ray trace shader
	m_sphere_program.On();

		m_quad_vb.On();

			glm::mat4 sphere_world = glm::translate( glm::vec3(0,0,0) );

			m_sphere_program.SetUniform("viewProj",		m_camera.GetViewProj() );
			m_sphere_program.SetUniform("viewIprojI",	glm::inverse( m_camera.GetProj() * m_camera.GetViewMatrix() ) );
			m_sphere_program.SetUniform("view",			m_camera.GetViewMatrix() );
			m_sphere_program.SetUniform("modelI",		glm::inverse(sphere_world) );
			m_sphere_program.SetUniform("model",		sphere_world );
			m_sphere_program.SetUniform("lightPos",		lightPos );

			m_quad_vb.Draw(GL_TRIANGLE_STRIP, 0, 4);

		m_quad_vb.Off();

	m_sphere_program.Off();

	ImGui::SetNextWindowPos(ImVec2(300, 400), ImGuiCond_FirstUseEver);
	if(ImGui::Begin("Tools")) // Note that ImGui returns false when window is collapsed so we can early-out
	{
		ImGui::SliderFloat3("light_pos", &lightPos.x, -10.f, 10.f);
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