#include "Grid.h"
#include "AABBtri.h"

Grid::Grid()
{
}

Grid::~Grid(void)
{
}

void Grid::addMesh(Mesh* m)
{
    mesh = m;
    for(int i=0; i<mesh->indices.size(); i+=3)
    {
        glm::vec3 A = mesh->vertices[mesh->indices[i]].position;
        glm::vec3 B = mesh->vertices[mesh->indices[i+1]].position;
        glm::vec3 C = mesh->vertices[mesh->indices[i+2]].position;
        printf("%d \n", triBoxOverlap(glm::vec3(1,1,0), glm::vec3(0.5,0.5,0.5), A, B, C));
    }
}
