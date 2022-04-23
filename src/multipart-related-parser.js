import firstBoundaryPosition from './first-boundary-position.js'
import firstHeaderSeparatorPosition from './first-header-separator-position.js'
import startsWithBoundaryEnd from './starts-with-boundary-end.js'

export default class MultipartRelatedParser {
  constructor (contentType) {
    this.encoder = new TextEncoder()
    this.decoder = new TextDecoder()

    this.boundaries = [
      this.parseContentType(contentType)
    ]
  }

  parseContentType (contentType) {
    const [_, type, boundaryString] = contentType.match(/^([^;]+);\s*boundary="?([^="]+)"?/) || []
    if (type !== 'multipart/related') return

    const boundary = this.encoder.encode(boundaryString)
    
    return {
      id: boundaryString,
      boundary
    }
  }

  // TODO: seems not to work for non-related docs
  parsePart (data) {
    if (this.boundaries.length === 0) return null

    const { id, boundary } = this.boundaries[this.boundaries.length - 1]

    // each part starts with the boundary marker
    const startPosition = firstBoundaryPosition(data, boundary)
    if (startPosition === -1) return null

    // find the end of the header, which is the start of the content
    const contentPosition = firstHeaderSeparatorPosition(data, startPosition)
    if (contentPosition === -1) return null

    // parse the header
    const headerData = data.slice(boundary.length + 4, contentPosition)
    const header = this.decoder.decode(headerData)
    const headers = header.split('\r\n').reduce((memo, line) => {
      const [name, value] = line.split(/:\s*/)
      memo[name] = name === 'Content-Length'
        ? parseInt(value, 10)
        : value
      return memo
    }, {})

    // content type is mandatory
    const { 'Content-Type': contentType } = headers
    if (!contentType) return null

    // check whether this starts a related part
    const childBoundary = this.parseContentType(contentType)
    if (childBoundary) {
      this.boundaries.push(childBoundary)
      return this.parsePart(data.slice(contentPosition + 4))
    }

    // check for content length, otherwise search for next boundary
    const { 'Content-Length': contentLength } = headers
    const contentEndPosition = contentLength
      ? firstBoundaryPosition(data, boundary, contentLength + contentPosition + 6)
      : firstBoundaryPosition(data, boundary, contentPosition + 4)
    if (contentEndPosition === -1) return null

    // part not completely present yet
    if (data.length < contentEndPosition - 2) return null

    // check for boundary end marker
    const isBoundaryEnd = startsWithBoundaryEnd(data, boundary, contentEndPosition)
    const endPosition = isBoundaryEnd
      ? contentEndPosition + boundary.length + 6
      : contentEndPosition

    const related = this.boundaries.length > 1 ? id : null
    if (isBoundaryEnd) this.boundaries.pop()
  
    // extract the part data
    const partData = data.slice(contentPosition + 4, contentEndPosition - 2)
    const rest = data.slice(endPosition)

    return {
      related,
      headers,
      data: partData,
      rest
    }
  }
}
