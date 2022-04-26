# Multipart Related
Fast parsing `multipart/related` responses in the browser or node. Operates on raw bytes, in a streaming manner. Zero dependencies.

This is a research project and not meant to be production ready (yet).

Multipart construction is planned for the future, too, therefore the generic name.


## API
The package exports a `MultipartRelated` constructor:

### `MultipartRelated(contentType)`
`contentType` must be a `multipart/related` Content-Type string including the boundary, as usually sent by the servers.
Eg `'multipart/related; boundary="865f3b787e6623728e6aa49fec037303"` or `'multipart/related; boundary=865f3b787e6623728e6aa49fec037303`.

This class provides a `read(chunk)` function, which inteded to be used in conjunction with [ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream), as you can see in the example above. It returns an array containing the parsed parts, which are already present.

A part is an object containing
* `boundary`: if the content is grouped together, aka _related_, this includes the individual boundary. If the part is a sole one, `boundary` is `null`. Can be used to group together parts.
* `headers`: the headers of each individual parts, usually eg `Content-Type`, `Content-Disposition`, `Content-Length` or `Content-Encoding` but not limited to those.
* `data`: an `Uint8Array` containing the raw part data.


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


## Tests
Run the tests with `npm test` or pick individual files via eg `node test/multipart-related-parser-test.js`.


(c) 2022 Johannes J. Schmidt
