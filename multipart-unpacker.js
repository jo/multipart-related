// Unpacking a multipart response

// use a WASM implementation for decompression: https://github.com/ColinTimBarndt/wasm-gzip
// until DecompressionStream is implemented widely
import init, { decompressGzip } from "./wasm_gzip.js"

// Separator between part header and its content: "\r\n\r\n"
const HEADER_SEPARATOR = new Uint8Array([13, 10, 13, 10])

// get first position of a binary match
const firstMatch = (matcher, data, offset = 0) => {
  if (offset > data.length) {
    return -1
  }

  for (var i = offset; i < data.length; i++) {
    if (data[i] === matcher[0]) {
      for (var j = i + 1, k = 1; j < i + matcher.length; j++, k++) {
        var fullMatch = true
        if (data[j] !== matcher[k]) {
          fullMatch = false
          break
        }
      }
      if (fullMatch) return j - matcher.length
    }
  }

  return -1
}

// Parse a binary multipart/related stream, eg:
// ```
// --7c5ea2d65831734b433c74aab52ab62e
// Content-Type: application/json
// 
// {"_id":"multipart","_rev":"4-5a99a8faccb6b0a8d6fd48cf1383ecee","_attachments":{"three.txt":{"content_type":"text/plain","revpos":4,"digest":"md5-E+kO+eF6BqbZs7CA3w0x4w==","length":52,"follows":true,"encoding":"gzip","encoded_length":69},"two.txt":{"content_type":"text/plain","revpos":3,"digest":"md5-MpEhbPHIFLQQJrX86NPA1Q==","length":39,"follows":true,"encoding":"gzip","encoded_length":59},"one.txt":{"content_type":"text/plain","revpos":2,"digest":"md5-mIz2XUNuIuC6D2VKfPc2YA==","length":30,"follows":true,"encoding":"gzip","encoded_length":50}}}
// --7c5ea2d65831734b433c74aab52ab62e
// Content-Disposition: attachment; filename="three.txt"
// Content-Type: text/plain
// Content-Length: 69
// Content-Encoding: gzip
// 
// <binary data>
// --7c5ea2d65831734b433c74aab52ab62e
// Content-Disposition: attachment; filename="two.txt"
// Content-Type: text/plain
// Content-Length: 59
// Content-Encoding: gzip
// 
// <binary data>
// --7c5ea2d65831734b433c74aab52ab62e
// Content-Disposition: attachment; filename="one.txt"
// Content-Type: text/plain
// Content-Length: 50
// Content-Encoding: gzip
// 
// <binary data>
// --7c5ea2d65831734b433c74aab52ab62e--
// ```
export default class MultipartUnpacker {
  constructor (contentType, onPart) {
    // parse boundary from content type header
    const [_, boundary] = contentType.match(/boundary="([^"]+)"/)
    const enc = new TextEncoder()
    this.boundary = enc.encode(`--${boundary}`)

    this.onPart = onPart

    this.decoder = new TextDecoder()

    this.data = new Uint8Array(0)
  }

  init () {
    return init()
  }

  read (chunk) {
    if (chunk) {
      // add current chunk to data
      const newData = new Uint8Array(this.data.length + chunk.length)
      newData.set(this.data, 0)
      newData.set(chunk, this.data.length)
      this.data = newData
    }
    
    // and parse what we already have
    this.parseParts()
  }

  // parse parts out of our data and store the rest
  parseParts () {
    while (true) {
      // get position of first boundary
      const startPosition = firstMatch(this.boundary, this.data)
      if (startPosition === -1) break
      
      // get position of the next boundary
      const endPosition = firstMatch(this.boundary, this.data, startPosition + this.boundary.length - 1)
      if (endPosition === -1) break
      
      // extract the data in between the boundaries
      const partData = this.data.slice(startPosition + this.boundary.length, endPosition)
      
      // parse that part
      this.parsePart(partData)
      
      // store the rest
      this.data = this.data.slice(endPosition)
    }
  }

  // parse one part. Can be either a doc eg:
  // ```
  // Content-Type: application/json
  // 
  // {"_id":"multipart","_rev":"4-5a99a8faccb6b0a8d6fd48cf1383ecee","_attachments":{"three.txt":{"content_type":"text/plain","revpos":4,"digest":"md5-E+kO+eF6BqbZs7CA3w0x4w==","length":52,"follows":true,"encoding":"gzip","encoded_length":69},"two.txt":{"content_type":"text/plain","revpos":3,"digest":"md5-MpEhbPHIFLQQJrX86NPA1Q==","length":39,"follows":true,"encoding":"gzip","encoded_length":59},"one.txt":{"content_type":"text/plain","revpos":2,"digest":"md5-mIz2XUNuIuC6D2VKfPc2YA==","length":30,"follows":true,"encoding":"gzip","encoded_length":50}}}
  // ```
  // or an attachment:
  // ```
  // Content-Disposition: attachment; filename="three.txt"
  // Content-Type: text/plain
  // Content-Length: 69
  // Content-Encoding: gzip
  // 
  // <binary data>
  // ```
  parsePart (data) {
    // get the position of the content after the header
    // header is separated by two blank lines
    const contentPosition = firstMatch(HEADER_SEPARATOR, data)
    if (contentPosition === -1) throw new Error('Wrong content position')

    // parse the header
    const headerData = data.slice(2, contentPosition)
    const header = this.decoder.decode(headerData)
    const headers = header.split('\r\n').reduce((memo, line) => {
      const [name, value] = line.split(/:\s*/)
      memo[name] = value
      return memo
    }, {})

    // content type is required
    const contentType = headers['Content-Type']
    if (!contentType) throw new Error('Missing Content-Type header')
    
    // extract the actual data
    let contentData = data.slice(contentPosition + HEADER_SEPARATOR.length, data.length - 2)

    const contentDisposition = headers['Content-Disposition']
    if (!contentDisposition && contentType === 'application/json') {
      // if there is no content disposition header and its a json, decode it
      const text = this.decoder.decode(contentData)
      const json = JSON.parse(text)
      this.onPart({
        json
      })
    } else {
      // if there is a content disposition, its an attachment
      // parse content disposition attributes
      const [type, attributesString] = contentDisposition.split(/;\s*/, 2)
      const attributes = attributesString.split(/;\s*/).reduce((memo, pair) => {
        const [name, value] = pair.split('=')
        memo[name] = JSON.parse(value)
        return memo
      }, {})

      const contentEncoding = headers['Content-Encoding']
      if (contentEncoding) {
        contentData = decompressGzip(contentData)
      }
      // construct a blob out of the binary data
      const blob = new Blob([contentData], { type: contentType })
      this.onPart({
        ...attributes,
        blob
      })
    }
  }
}
