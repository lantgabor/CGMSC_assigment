#pragma once

// GLEW
#include <GL/glew.h>

// SDL
#include <SDL2/SDL.h>
#include <SDL2/SDL_opengl.h>

// GLM
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtx/transform2.hpp>

#include "gShaderProgram.h"
#include "gVertexBuffer.h"

#include "Mesh_OGL3.h"
#include "gCamera.h"
#include "Grid.h"

#include "Material.h"
#include "Light.h"
#include "Sphere.h"

class CMyApp
{
public:
	CMyApp(void);
	~CMyApp(void);

	bool Init();
	void Clean();

	void Update();
	void Render();

	void KeyboardDown(SDL_KeyboardEvent&);
	void KeyboardUp(SDL_KeyboardEvent&);
	void MouseMove(SDL_MouseMotionEvent&);
	void MouseDown(SDL_MouseButtonEvent&);
	void MouseUp(SDL_MouseButtonEvent&);
	void MouseWheel(SDL_MouseWheelEvent&);
	void Resize(int, int);
protected:
	GLuint GenTexture();

	// OpenGL-es dolgok
	GLuint m_textureID; // text�ra er�forr�s azonos�t�

	GLuint m_skyboxID;

	gCamera			m_camera;

	gShaderProgram	m_sphere_program;
	gVertexBuffer	m_quad_vb;

	Mesh			*m_mesh;
	Grid			grid = Grid();

	glm::vec3 lightPos = glm::vec3(1,1,-1);
	glm::vec3 La = glm::vec3(0.5,0.43,0.41);
	float shininess = 15;

	std::vector<Material*> materials;
	std::vector<Light*> lights;
	std::vector<Sphere*> spheres;
};

