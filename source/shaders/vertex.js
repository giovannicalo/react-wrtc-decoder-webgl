const vertexShaderSource = `
	#version 300 es

	in vec2 vertex;

	void main() {
		gl_Position = vec4(vertex, 1.0, 1.0);
	}
`.trimStart();

export default vertexShaderSource;
