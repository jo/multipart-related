// get first position of header separator
export default function firstHeaderSeparatorPosition(data, offset = 0) {
  if (offset > data.length + 4) {
    return -1
  }

  for (let i = offset; i < data.length; i++) {
    if (data[i] === 13 && data[i+1] === 10 && data[i+2] === 13 && data[i+3] === 10) {
      return i
    }
  }

  return -1
}
