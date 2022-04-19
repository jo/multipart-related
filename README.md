# Multipart Unpacker
Parses `multipart/related` response in the browser as sent from CouchDB. Operate on raw bytes, in a streaming manner.

This avoids some methods like `pipeThrough` or `pipeTo` as they lack support on FF Android. Instead, we only rely on [ReadableStream.getReader()](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/getReader) here, which is widely supported. No Internet Explorer, though.

For Decoding Gzip bodies, we use a WASM implementation: [Wasm-Gzip](https://github.com/ColinTimBarndt/wasm-gzip). Maybe later we can switch to `DecompressionStream` once its implemented in most browsers.

This is a research project and not meant to be production ready (yet).

## Example

```js
import MultipartUnpacker from './multipart-unpacker.js'

// fetch the multipart response
const response = await fetch(url)

// get Content-Type header
const contentType = response.headers.get('Content-Type')

// initialize the multipart parser
const unpacker = new MultipartUnpacker(contentType, updateDom)

await unpacker.init()

// get the response body stream
const reader = response.body.getReader()

// tie together the process stream
const process = ({ value, done }) => {
  unpacker.read(value)

  if (!done) {
    return reader.read().then(process)
  }
}
// and kick off processing
reader.read().then(process)
```

(c) 2022 Johannes J. Schmidt
