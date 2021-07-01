#pragma once

#include <GL/glew.h>

#include <vector>
#include <glm/glm.hpp>

#include "Mesh_OGL3.h"

class Grid
{
public:

    struct Triangle
    {
        glm::vec3 A;
        glm::vec3 B;
        glm::vec3 C;
        glm::vec3 N;
    };

    struct AABB {
        glm::vec3 c;
        glm::vec3 pos;

        std::vector <Grid::Triangle> triangles;
    };

	Grid(void);
	~Grid(void);
    void addMesh(Mesh* m);

private:
    Mesh* mesh;
    std::vector<AABB> grid;
};
