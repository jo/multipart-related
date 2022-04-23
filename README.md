# Multipart Related
Parses `multipart/related` response in the browser. Operate on raw bytes, in a streaming manner.

This avoids some methods like `pipeThrough` or `pipeTo` as they lack support on FF Android. Instead, we only rely on [ReadableStream.getReader()](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/getReader) here, which is widely supported. No Internet Explorer, though.

This is a research project and not meant to be production ready (yet).

## Example
```js
import MultipartRelated from 'multipart-related'

// fetch the multipart response
const response = await fetch(url)

// get Content-Type header
const contentType = response.headers.get('Content-Type')

// initialize the multipart parser
const multipart = new MultipartRelated(contentType)

// get the response body stream
const reader = response.body.getReader()

// tie together the process stream
const process = ({ value, done }) => {
  const parts = multipart.read(value)
  // do something with the parts as they arrive
  console.log(parts)

  if (!done) {
    return reader.read().then(process)
  }
}
// ... and kick-off processing
reader.read().then(process)
```

(c) 2022 Johannes J. Schmidt
