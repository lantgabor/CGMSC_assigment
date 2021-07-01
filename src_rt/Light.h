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

struct Light {
	glm::vec3 position;
	glm::vec3 Le;
	Light(glm::vec3 _position, glm::vec3 _Le) {
		position = normalize(_position);
		Le = _Le;
	}
};