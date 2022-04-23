// returns true if data starts with matcher
export default function startsWithBoundaryEnd(data, boundary, offset = 0) {
  if (offset > data.length + boundary.length + 4) {
    return false
  }

  if (data[offset] !== 45) return false
  if (data[offset + 1] !== 45) return false
  if (data[offset + boundary.length + 2] !== 45) return false
  if (data[offset + boundary.length + 3] !== 45) return false

  for (let i = 0; i < boundary.length; i++) {
    if (data[i + offset + 2] !== boundary[i]) {
      return false
    }
  }

  return true
}
