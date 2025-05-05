import { fragmentShaderSource, vertexShaderSource } from "./shaders";

class Decoder {

	#decodedData = null;

	#encodedData = null;

	#canvas = new OffscreenCanvas(1, 1);

	#context = this.#canvas.getContext("webgl2");

	#height = 0;

	#loop = null;

	#parser = null;

	#program = null;

	#stream = null;

	#texture = null;

	#width = 0;

	constructor(parser) {
		const fragmentShader = this.#createShader("FRAGMENT_SHADER", fragmentShaderSource);
		const vertexShader = this.#createShader("VERTEX_SHADER", vertexShaderSource);
		this.#parser = parser;
		this.#canvas.width = parser.pixelSize;
		this.#encodedData = new Uint8Array(parser.byteSize);
		this.#program = this.#context.createProgram();
		this.#context.attachShader(this.#program, fragmentShader);
		this.#context.attachShader(this.#program, vertexShader);
		this.#context.linkProgram(this.#program);
		this.#context.detachShader(this.#program, fragmentShader);
		this.#context.detachShader(this.#program, vertexShader);
		this.#context.deleteShader(fragmentShader);
		this.#context.deleteShader(vertexShader);
		if (!this.#context.getProgramParameter(this.#program, this.#context.LINK_STATUS)) {
			throw new Error(`Failed to compile shader:\n${this.#context.getProgramInfoLog(this.#program)}`);
		}
		this.#context.useProgram(this.#program);
		this.#context.bindBuffer(this.#context.ARRAY_BUFFER, this.#context.createBuffer());
		this.#context.bufferData(
			this.#context.ARRAY_BUFFER,
			new Float32Array([-1, 1, 1, 1, -1, -1, 1, -1]),
			this.#context.STATIC_DRAW
		);
		const vertexLocation = this.#context.getAttribLocation(this.#program, "vertex");
		this.#context.vertexAttribPointer(vertexLocation, 2, this.#context.FLOAT, false, 0, 0);
		this.#context.enableVertexAttribArray(vertexLocation);
		this.#context.viewport(0, 0, this.#parser.pixelSize, 1);
		this.#context.clearColor(0, 0, 0, 0);
		this.#context.clear(this.#context.COLOR_BUFFER_BIT);
	}

	close = () => {
		this.#stream.cancelFrameCallback(this.#loop);
		this.#context?.deleteProgram(this.#program);
		this.#context?.deleteTexture(this.#texture);
	};

	#createShader = (type, source) => {
		const shader = this.#context.createShader(this.#context[type]);
		this.#context.shaderSource(shader, source);
		this.#context.compileShader(shader);
		if (!this.#context.getShaderParameter(shader, this.#context.COMPILE_STATUS)) {
			throw new Error(`Failed to compile shader:\n${this.#context.getShaderInfoLog(shader)}`);
		}
		return shader;
	};

	get data() {
		return this.#decodedData;
	}

	decode(stream) {
		this.#stream = stream;
		this.#loop = this.#stream.requestFrameCallback(this.#render);
	}

	#render = async () => {
		this.statistics?.start();
		const { videoHeight: height, videoWidth: width } = this.#stream.video;
		if (this.#height !== height || this.#width !== width) {
			this.#height = height;
			this.#width = width;
			this.#context.deleteTexture(this.#texture);
			this.#texture = this.#context.createTexture();
			this.#context.bindTexture(this.#context.TEXTURE_2D, this.#texture);
			this.#context.texStorage2D(this.#context.TEXTURE_2D, 1, this.#context.RGBA8, width, height);
		}
		if (this.#texture) {
			this.#context.texSubImage2D(
				this.#context.TEXTURE_2D,
				0,
				0,
				0,
				this.#context.RGBA,
				this.#context.UNSIGNED_BYTE,
				this.#stream.video
			);
			this.#context.drawArrays(this.#context.TRIANGLE_STRIP, 0, 4);
			this.#context.readPixels(
				0,
				0,
				this.#parser.pixelSize,
				1,
				this.#context.RGBA,
				this.#context.UNSIGNED_BYTE,
				this.#encodedData
			);
			this.#decodedData = await this.#parser.parse(this.#encodedData);
		}
		this.#loop = this.#stream.requestFrameCallback(this.#render);
		this.statistics?.end();
	};

}

export default Decoder;
