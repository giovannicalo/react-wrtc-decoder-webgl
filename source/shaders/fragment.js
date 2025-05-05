const fragmentShaderSource = `
	#version 300 es

	precision highp float;

	uniform sampler2D frame;

	out vec4 pixel;

	vec4 getSquareColor(int squareIndex, int squaresWidth) {
		int pixelIndex = squareIndex * 8;
		return texelFetch(frame, ivec2(
			pixelIndex % squaresWidth + 4,
			pixelIndex / squaresWidth * 8 + 4
		), 0);
	}

	int getByte(int byteIndex, int squaresWidth) {
		int byte = 0;
		int squareIndex = byteIndex * 4;
		for (int i = squareIndex; i < squareIndex + 4; i++) {
			vec4 color = getSquareColor(i, squaresWidth);
			if (color.r > 0.5 && color.g > 0.5 && color.b > 0.5) {
				byte |= 0;
			} else if (color.r > 0.5) {
				byte |= 1;
			} else if (color.g > 0.5) {
				byte |= 2;
			} else {
				byte |= 3;
			}
			if (i < squareIndex + 3) {
				byte <<= 2;
			}
		}
		return byte;
	}

	vec4 getPixel(int pixelIndex, int squaresWidth) {
		vec4 pixel;
		int byteIndex = pixelIndex * 4;
		for (int i = byteIndex; i < byteIndex + 4; i++) {
			pixel[i - byteIndex] = float(getByte(i, squaresWidth)) / 255.0;
		}
		return pixel;
	}

	void main() {
		pixel = getPixel(int(gl_FragCoord.x), textureSize(frame, 0).x & ~7);
	}
`.trimStart();

export default fragmentShaderSource;
