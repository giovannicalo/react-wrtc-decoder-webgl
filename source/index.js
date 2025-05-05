import { fragmentShaderSource, vertexShaderSource } from "./shaders";

class Decoder {

	#canvas = document.createElement("canvas");

	#context = this.#canvas.getContext("2d");

	#decodedData = null;

	#encodedData = null;

	#glCanvas = document.createElement("canvas");

	#glContext = this.#glCanvas.getContext("webgl2");

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
		this.#encodedData = new Uint8Array(parser.byteSize);
		this.#glCanvas.height = 1;
		this.#glCanvas.width = this.#parser.pixelSize;
		this.#program = this.#glContext.createProgram();
		this.#glContext.attachShader(this.#program, fragmentShader);
		this.#glContext.attachShader(this.#program, vertexShader);
		this.#glContext.linkProgram(this.#program);
		this.#glContext.detachShader(this.#program, fragmentShader);
		this.#glContext.detachShader(this.#program, vertexShader);
		this.#glContext.deleteShader(fragmentShader);
		this.#glContext.deleteShader(vertexShader);
		if (!this.#glContext.getProgramParameter(this.#program, this.#glContext.LINK_STATUS)) {
			throw new Error(`Failed to compile shader:\n${this.#glContext.getProgramInfoLog(this.#program)}`);
		}
		this.#glContext.useProgram(this.#program);
		this.#glContext.bindBuffer(this.#glContext.ARRAY_BUFFER, this.#glContext.createBuffer());
		this.#glContext.bufferData(
			this.#glContext.ARRAY_BUFFER,
			new Float32Array([-1, 1, 1, 1, -1, -1, 1, -1]),
			this.#glContext.STATIC_DRAW
		);
		const vertexLocation = this.#glContext.getAttribLocation(this.#program, "vertex");
		this.#glContext.vertexAttribPointer(vertexLocation, 2, this.#glContext.FLOAT, false, 0, 0);
		this.#glContext.enableVertexAttribArray(vertexLocation);
		this.#glContext.viewport(0, 0, this.#parser.pixelSize, 1);
		this.#glContext.clearColor(0, 0, 0, 0);
		this.#glContext.clear(this.#glContext.COLOR_BUFFER_BIT);
	}

	close = () => {
		this.#stream.cancelFrameCallback(this.#loop);
		this.#canvas?.remove();
		this.#glCanvas?.remove();
		this.#glContext?.deleteProgram(this.#program);
		this.#glContext?.deleteTexture(this.#texture);
	};

	#createShader = (type, source) => {
		const shader = this.#glContext.createShader(this.#glContext[type]);
		this.#glContext.shaderSource(shader, source);
		this.#glContext.compileShader(shader);
		if (!this.#glContext.getShaderParameter(shader, this.#glContext.COMPILE_STATUS)) {
			throw new Error(`Failed to compile shader:\n${this.#glContext.getShaderInfoLog(shader)}`);
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
			this.#canvas.height = height;
			this.#canvas.width = width;
			this.#context.clearRect(0, 0, width, height);
			this.#glContext.deleteTexture(this.#texture);
			this.#texture = this.#glContext.createTexture();
			this.#glContext.bindTexture(this.#glContext.TEXTURE_2D, this.#texture);
			this.#glContext.texStorage2D(this.#glContext.TEXTURE_2D, 1, this.#glContext.RGBA8, width, height);
		}
		this.#context.drawImage(this.#stream.video, 0, 0, width, height);
		if (this.#texture) {
			this.#glContext.texSubImage2D(
				this.#glContext.TEXTURE_2D,
				0,
				0,
				0,
				this.#glContext.RGBA,
				this.#glContext.UNSIGNED_BYTE,
				this.#canvas
			);
			this.#glContext.drawArrays(this.#glContext.TRIANGLE_STRIP, 0, 4);
			this.#glContext.readPixels(
				0,
				0,
				this.#parser.pixelSize,
				1,
				this.#glContext.RGBA,
				this.#glContext.UNSIGNED_BYTE,
				this.#encodedData
			);
			this.#decodedData = await this.#parser.parse(this.#encodedData);
		}
		this.#loop = this.#stream.requestFrameCallback(this.#render);
		this.statistics?.end();
	};

}

export default Decoder;
