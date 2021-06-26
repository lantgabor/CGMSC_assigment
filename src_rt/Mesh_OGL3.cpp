#include "Mesh_OGL3.h"

Mesh::Mesh(void)
{
}

Mesh::~Mesh(void)
{
}

void Mesh::initBuffers()
{
	glGenVertexArrays(1, &vertexArrayObject);
	glGenBuffers(1, &vertexBuffer);
	glGenBuffers(1, &indexBuffer);

	glBindVertexArray(vertexArrayObject);

	glBindBuffer(GL_ARRAY_BUFFER, vertexBuffer);
	glBufferData(GL_ARRAY_BUFFER, sizeof(Vertex)*vertices.size(), (void*)&vertices[0], GL_STREAM_DRAW);

	glEnableVertexAttribArray(0);
	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), 0);
	glEnableVertexAttribArray(1);
	glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)(sizeof(glm::vec3)));
	glEnableVertexAttribArray(2);
	glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)(sizeof(glm::vec3)*2));

	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, indexBuffer);
	glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(unsigned int)*indices.size(), (void*)&indices[0], GL_STREAM_DRAW);

	glBindVertexArray(0);
}


void Mesh::initUBO()
{
	printf("%d %d DEBUG", vertices.size(), indices.size());
	glGenBuffers(1, &ubo_Mesh);
	glBindBuffer(GL_UNIFORM_BUFFER, ubo_Mesh);
	glBufferData(GL_UNIFORM_BUFFER, 16 * 3 * 500 + 16* 500, NULL, GL_STATIC_DRAW); // vec3 * 3 aligned to 16
	
	for (int i=0; i<vertices.size(); ++i)
	{
		Vertex v = vertices[i];
		glBufferSubData(GL_UNIFORM_BUFFER, 16 * 3 * i, 16 + 16 + 8, &v);
	}

	for (int j=0; j<indices.size(); ++j)
	{
		int idx = indices[j];
		glBufferSubData(GL_UNIFORM_BUFFER, 16 * 3 * 500 + (16 * j), 4, &idx);
	}

	glBindBuffer(GL_UNIFORM_BUFFER, 0);
	glBindBufferBase(GL_UNIFORM_BUFFER, 0, ubo_Mesh);

}

void Mesh::draw()
{
	glBindVertexArray(vertexArrayObject);

	glDrawElements(GL_TRIANGLES, indices.size(), GL_UNSIGNED_INT, 0);

	glBindVertexArray(0);
}