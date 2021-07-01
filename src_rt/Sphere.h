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

struct Sphere {
	glm::vec3 center;
    float radius;
    Sphere(glm::vec3 _center, float _radius) {
		center = _center;
		radius = _radius;
	}    
};