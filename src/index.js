// Unpacking a multipart response

import MultipartRelatedParser from './multipart-related-parser.js'

// Parse a binary multipart/related stream
export default class MultipartRelated {
  constructor (contentType) {
    this.parser = new MultipartRelatedParser(contentType)
    this.data = new Uint8Array(0)
  }

  read (chunk) {
    if (chunk) {
      // add current chunk to data
      const newData = new Uint8Array(this.data.length + chunk.length)
      newData.set(this.data, 0)
      newData.set(chunk, this.data.length)
      this.data = newData
    }

    const parts = []

    // parse buffer
    let part
    do {
      part = this.parser.parsePart(this.data)
      if (part) {
        const { boundary, headers, data, rest } = part
        this.data = rest
        parts.push({
          boundary,
          headers,
          data
        })
      }
    } while (part)

    // return parsed parts
    return parts
  }
}
