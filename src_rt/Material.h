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

struct Material {
    glm::vec3 ka, kd, ks, F0;
    float shininess;
    float n;
    int type; // 0 1 2
};

struct Rough : Material {
    Rough(glm::vec3 _kd, glm::vec3 _ks,  float _shininess) {
        ka = _kd * glm::vec3(3.14);
        kd = _kd;
        ks = _ks;
        shininess = _shininess;
        type = 0;
    }
};

struct Glass : Material {
    Glass(glm::vec3 _F0, float _n) {
		F0 = _F0;
		n = _n; // ior
		type = 1;
	}
};

struct Metal : Material {   
    Metal(glm::vec3 _F0) {
		F0 = _F0;
		n = 1.0;
		type = 2;
    }
    
};
