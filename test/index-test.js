import tap from 'tap'
import fs from 'fs'
import path from 'path'

import MultipartRelated from '../src/index.js'

tap.test('doc', t => {
  t.plan(8)

  const contentType = 'multipart/related; boundary="865f3b787e6623728e6aa49fec037303"'
  const unpacker = new MultipartRelated(contentType)

  const filename = path.join(process.cwd(), 'test/fixtures/doc.multipart')

  return fs.readFile(filename, (error, data) => {
    // read in two chunks
    const parts = unpacker.read(data.slice(0, 1000))
      .concat(unpacker.read(data.slice(1000)))
    
    t.equal(parts.length, 4, 'correct number of parts parsed')

    const [doc, three, two, one] = parts
    
    t.same(doc.headers, {
      'Content-Type': 'application/json'
    }, 'correct headers parsed for doc')

    t.same(three.headers, {
      'Content-Disposition': 'attachment; filename="three.txt"',
      'Content-Type': 'text/plain',
      'Content-Length': 69,
      'Content-Encoding': 'gzip'
    }, 'correct headers parsed for three')
    t.equal(three.data.length, 69, 'correct length of data returned')

    t.same(two.headers, {
      'Content-Disposition': 'attachment; filename="two.txt"',
      'Content-Type': 'text/plain',
      'Content-Length': 59,
      'Content-Encoding': 'gzip'
    }, 'correct headers parsed for two')
    t.equal(two.data.length, 59, 'correct length of data returned')

    t.same(one.headers, {
      'Content-Disposition': 'attachment; filename="one.txt"',
      'Content-Type': 'text/plain',
      'Content-Length': 50,
      'Content-Encoding': 'gzip'
    }, 'correct headers parsed for one')
    t.equal(one.data.length, 50, 'correct length of data returned')
  })
})

tap.test('bulk get', t => {
  t.plan(12)

  const contentType = 'multipart/related; boundary="--440d45a70251a521a20f0930e9a5420e"'
  const unpacker = new MultipartRelated(contentType)

  const filename = path.join(process.cwd(), 'test/fixtures/_bulk_get.multipart')

  return fs.readFile(filename, (error, data) => {
    const parts = unpacker.read(data)
    
    t.equal(parts.length, 7)
    
    const [docOne, three, two, one, docTwo, tf, cool] = parts

    t.same(docOne.headers, {
      'Content-Type': 'application/json'
    }, 'correct headers parsed for doc')

    t.same(three.headers, {
      'Content-Disposition': 'attachment; filename="three.txt"',
      'Content-Type': 'text/plain',
      'Content-Length': 69,
      'Content-Encoding': 'gzip'
    }, 'correct headers parsed for three')
    t.equal(three.data.length, 69, 'correct length of data returned')

    t.same(two.headers, {
      'Content-Disposition': 'attachment; filename="two.txt"',
      'Content-Type': 'text/plain',
      'Content-Length': 59,
      'Content-Encoding': 'gzip'
    }, 'correct headers parsed for two')
    t.equal(two.data.length, 59, 'correct length of data returned')

    t.same(one.headers, {
      'Content-Disposition': 'attachment; filename="one.txt"',
      'Content-Type': 'text/plain',
      'Content-Length': 50,
      'Content-Encoding': 'gzip'
    }, 'correct headers parsed for one')
    t.equal(one.data.length, 50, 'correct length of data returned')

    t.same(tf.headers, {
      'Content-Disposition': 'attachment; filename="tf.gif"',
      'Content-Type': 'image/gif',
      'Content-Length': 1450
    }, 'correct headers parsed for tf')
    t.equal(tf.data.length, 1450, 'correct length of data returned')

    t.same(cool.headers, {
      'Content-Disposition': 'attachment; filename="cool"',
      'Content-Type': 'text/plain',
      'Content-Length': 24,
      'Content-Encoding': 'gzip'
    }, 'correct headers parsed for cool')
    t.equal(cool.data.length, 24, 'correct length of data returned')
  })
})
