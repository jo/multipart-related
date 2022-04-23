# Multipart Related
Parses `multipart/related` response in the browser or node. Operate on raw bytes, in a streaming manner.

This is a research project and not meant to be production ready (yet).

Multipart construction is planned for the future, too.

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
