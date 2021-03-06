#pragma once

#include <GL/glew.h>

#include <vector>
#include <glm/glm.hpp>

class Mesh
{
public:
	struct Vertex
	{
		glm::vec4 position;
		glm::vec4 normal;
		glm::vec4 texcoord;
	};

	Mesh(void);
	~Mesh(void);

	void initBuffers();
	void initSSBO();
	void draw();

	void addVertex(const Vertex& vertex) {
		vertices.push_back(vertex);
	}
	void addIndex(unsigned int index) {
		indices.push_back(index);
	}
	std::vector<Vertex> vertices;
	std::vector<unsigned int> indices;
private:
	GLuint vertexArrayObject;
	GLuint vertexBuffer;
	GLuint indexBuffer;

	GLuint ssbo_Vertices;
	GLuint ssbo_Indices;

};
