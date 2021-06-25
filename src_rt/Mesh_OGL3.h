#pragma once

#include <GL/glew.h>

#include <vector>
#include <glm/glm.hpp>

class Mesh
{
public:
	struct Vertex
	{
		glm::vec3 position;
		glm::vec3 normal;
		glm::vec2 texcoord;
	};

	Mesh(void);
	~Mesh(void);

	void initBuffers();
	void initUBO();
	void draw();

	void addVertex(const Vertex& vertex) {
		vertices.push_back(vertex);
	}
	void addIndex(unsigned int index) {
		indices.push_back(index);
	}
private:
	GLuint vertexArrayObject;
	GLuint vertexBuffer;
	GLuint indexBuffer;

	GLuint ubo_Mesh;

	std::vector<Vertex> vertices;
	std::vector<unsigned int> indices;
};
