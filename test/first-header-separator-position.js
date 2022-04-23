import tap from 'tap'

import firstHeaderSeparatorPosition from '../src/first-header-separator-position.js'

tap.test('smoke', t => {
  const data = [1,13,10,13,10,2,3]
  const index = firstHeaderSeparatorPosition(data)
  t.equal(index, 1)
  t.end()
})

tap.test('offset bigger than data', t => {
  const data = [1,2,3]
  const index = firstHeaderSeparatorPosition(data, 3)
  t.equal(index, -1)
  t.end()
})

tap.test('half match', t => {
  const data = [1,13,11,2,3]
  const index = firstHeaderSeparatorPosition(data)
  t.equal(index, -1)
  t.end()
})
