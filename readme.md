# React WebRTC WebGL Metadata Decoder

[![Build Status](https://github.com/giovannicalo/react-wrtc-decoder-webgl/actions/workflows/build.yml/badge.svg)](https://github.com/giovannicalo/react-wrtc-decoder-webgl/actions/workflows/build.yml)

## Installation

```bash
npm install giovannicalo/react-wrtc-decoder-webgl
```

> Not yet published to NPM. This will install it from GitHub.

## Usage

```javascript
import { Stream } from "react-wrtc";
import Decoder from "react-wrtc-decoder-webgl";
import Parser from "react-wrtc-parser-regions";

const stream = new Stream("ws://localhost:8080", {}, new Decoder(new Parser()));

export default stream;
```

## API

### `new Decoder(parser: Parser)`

Creates a decoder which will use the given `parser` to interpret the decoded binary data.

#### `close(): void`

Stops the decoding loop and releases the resources acquired upon creation.

#### `data: any`

The decoded metadata for the current frame.

#### `decode(stream: Stream): void`

Starts the decoding loop on the given `stream`.

## Encoding

The data is encoded as colored 8x8-pixel squares drawn in a reserved area at the top of the video frame.

Each color encodes a different sequence of 2 bits, as follows.

| Color | R   | G   | B   | Bits |
| ----- | --- | --- | --- | ---- |
| White | 255 | 255 | 255 | 00   |
| Red   | 255 | 0   | 0   | 01   |
| Green | 0   | 255 | 0   | 10   |
| Black | 0   | 0   | 0   | 11   |

The size of the reserved area is `parser.byteSize / 2` squares long, arranged over multiple contiguous rows if needed.

If the width of the frame is not a multiple of 8, any additional pixels at the end of each row will be ignored.
