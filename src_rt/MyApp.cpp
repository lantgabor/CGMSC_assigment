#include "MyApp.h"
#include "GLUtils.hpp"

#include <GL/glu.h>
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

	// Loading texture
	// m_textureID = TextureFromFile("../res/texture.png");

	// Loading mesh
	m_mesh = ObjParser::parse("../res/teapot.obj", new Mesh());

	m_mesh->initUBO();
	grid.addMesh(m_mesh);
	// m_mesh->initBuffers();

	return true;
}

void CMyApp::Clean()
{
	glDeleteTextures(1, &m_textureID);

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

			glm::mat4 sphere_world = glm::translate( world );

			m_sphere_program.SetUniform("viewProj",		m_camera.GetViewProj() );
			m_sphere_program.SetUniform("viewIprojI",	glm::inverse( m_camera.GetProj() * m_camera.GetViewMatrix() ) );
			m_sphere_program.SetUniform("view",			m_camera.GetViewMatrix() );
			m_sphere_program.SetUniform("modelI",		glm::inverse(sphere_world) );
			m_sphere_program.SetUniform("model",		sphere_world );
			m_sphere_program.SetUniform("lights[0].position",		lightPos );
			m_sphere_program.SetUniform("lights[0].Le",		Le );
			m_sphere_program.SetUniform("translate", 	translate );

			m_quad_vb.Draw(GL_TRIANGLE_STRIP, 0, 4);

		m_quad_vb.Off();

	m_sphere_program.Off();

	ImGui::SetNextWindowPos(ImVec2(300, 400), ImGuiCond_FirstUseEver);
	if(ImGui::Begin("Tools")) // Note that ImGui returns false when window is collapsed so we can early-out
	{
		ImGui::SliderFloat3("light_pos", &lightPos.x, -50.f, 50.f);
		ImGui::SliderFloat3("Le", &Le.x, 0.f, 1.f);
		// ImGui::SliderFloat3("translate", &translate.x, -10.f, 10.f);
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