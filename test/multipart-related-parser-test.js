import tap from 'tap'

import MultipartRelatedParser from '../src/multipart-related-parser.js'

const encoder = new TextEncoder()

tap.test('single part', t => {
  const parser = new MultipartRelatedParser('multipart/related; boundary=boundary')

  const text = `--boundary\r
Content-Type: text/plain\r
\r
text one\r
--boundary--`
  const data = encoder.encode(text)

  const part = parser.parsePart(data)
  t.same(part, {
    related: null,
    headers: {
      'Content-Type': 'text/plain'
    },
    data: encoder.encode('text one'),
    rest: new Uint8Array(0)
  })

  t.end()
})


tap.test('two parts', t => {
  const parser = new MultipartRelatedParser('multipart/related; boundary=boundary')

  const text = `--boundary\r
Content-Type: text/plain\r
\r
text one\r
--boundary\r
Content-Type: text/plain\r
\r
text number two\r
--boundary--`
  const data = encoder.encode(text)

  const one = parser.parsePart(data)
  t.equal(one.related, null, 'related not set')
  t.same(one.headers, {
    'Content-Type': 'text/plain'
  }, 'correct headers parsed')
  t.same(one.data, encoder.encode('text one'), 'correct part data extracted')
  t.same(one.rest, encoder.encode(`--boundary\r
Content-Type: text/plain\r
\r
text number two\r
--boundary--`), 'correct data rest present')

  const two = parser.parsePart(one.rest)
  t.equal(two.related, null, 'related not set')
  t.same(two.headers, {
    'Content-Type': 'text/plain'
  }, 'correct headers parsed')
  t.same(two.data, encoder.encode('text number two'), 'correct part data extracted')
  t.same(two.rest, new Uint8Array(0), 'empty data rest present')

  t.end()
})

tap.test('using content length', t => {
  const parser = new MultipartRelatedParser('multipart/related; boundary=boundary')

  const text = `--boundary\r
Content-Type: text/plain\r
Content-Length: 12\r
\r
text one and a half\r
--boundary--`
  const data = encoder.encode(text)

  const part = parser.parsePart(data)
  t.equal(part.related, null, 'related not set')
  t.same(part.headers, {
    'Content-Type': 'text/plain',
    'Content-Length': 12
  }, 'correct headers parsed')
  t.same(part.data, encoder.encode('text one and a half'), 'correct part data extracted, regardless of content length')
  t.same(part.rest, new Uint8Array(0), 'empty data rest present')

  t.end()
})

tap.test('two parts using wrong content length', t => {
  const parser = new MultipartRelatedParser('multipart/related; boundary=boundary')

  const text = `--boundary\r
Content-Type: text/plain\r
Content-Length: 32\r
\r
text one\r
--boundary\r
Content-Type: text/plain\r
\r
text number two\r
--boundary--`
  const data = encoder.encode(text)

  const one = parser.parsePart(data)
  t.equal(one.related, null, 'related not set')
  t.same(one.headers, {
    'Content-Type': 'text/plain',
    'Content-Length': 32
  }, 'correct headers parsed')
  t.same(one.data, encoder.encode(`text one\r
--boundary\r
Content-Type: text/plain\r
\r
text number two`), 'correct part data extracted due to content length')
  t.same(one.rest, new Uint8Array(0), 'empty data rest present')

  const two = parser.parsePart(one.rest)
  t.notOk(two, 'There is no part two')

  t.end()
})

tap.test('test related content', t => {
  const parser = new MultipartRelatedParser('multipart/related; boundary=boundary')

  const text = `--boundary\r
Content-Type: multipart/related; boundary=child-boundary\r
\r
--child-boundary\r
Content-Type: text/plain\r
\r
text one\r
--child-boundary--\r
--boundary\r
Content-Type: text/plain\r
\r
text number two\r
--boundary--`
  const data = encoder.encode(text)

  const one = parser.parsePart(data)
  t.equal(one.related, 'child-boundary', 'related is set')
  t.same(one.headers, {
    'Content-Type': 'text/plain'
  }, 'correct headers parsed')
  t.same(one.data, encoder.encode('text one'), 'correct part data extracted')
  t.same(one.rest, encoder.encode(`--boundary\r
Content-Type: text/plain\r
\r
text number two\r
--boundary--`), 'correct data rest present')

  const two = parser.parsePart(one.rest)
  t.equal(two.related, null, 'related is not set')
  t.same(two.headers, {
    'Content-Type': 'text/plain'
  }, 'correct headers parsed')
  t.same(two.data, encoder.encode('text number two'), 'correct part data extracted')
  t.same(two.rest, new Uint8Array(0), 'empty data rest present')

  t.end()
})
