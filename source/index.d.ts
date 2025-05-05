declare class Parser {
	constructor();
	get byteSize(): number;
	parse(buffer: Uint8Array): Promise<any>;
	get pixelSize(): number;
}

declare class Decoder {
	constructor(parser: Parser);
	close(): void;
	get data(): any;
	decode(stream: Stream): void;
}

declare class Stream {
	cancelFrameCallback(handle: number): void;
	requestFrameCallback(callback: FrameRequestCallback): number;
	get video(): HTMLVideoElement;
}

export = Decoder;
