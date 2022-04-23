// get first position of a boundary
export default function firstBoundaryPosition(data, boundary, offset = 0) {
  if (offset > data.length + boundary.length + 2) {
    return -1
  }

  for (let i = offset; i < data.length; i++) {
    if (data[i] === 45 && data[i+1] === 45) {
      let fullMatch, k
      for (k = 0; k < boundary.length; k++) {
        fullMatch = true
        if (data[k+i+2] !== boundary[k]) {
          fullMatch = false
          break
        }
      }
      if (fullMatch) return i
    }
  }

  return -1
}
