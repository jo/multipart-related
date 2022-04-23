import tap from 'tap'

import firstBoundaryPosition from '../src/first-boundary-position.js'

tap.test('smoke', t => {
  const data = [1,45,45,2,3]
  const boundary = [2,3]
  const index = firstBoundaryPosition(data, boundary)
  t.equal(index, 1)
  t.end()
})

tap.test('offset bigger than data', t => {
  const data = [1,2,3]
  const boundary = [2,3]
  const index = firstBoundaryPosition(data, boundary, 3)
  t.equal(index, -1)
  t.end()
})

tap.test('offset bigger than data plus boundary', t => {
  const data = [1,2,3]
  const boundary = [3,4]
  const index = firstBoundaryPosition(data, boundary, 1)
  t.equal(index, -1)
  t.end()
})

tap.test('half match', t => {
  const data = [1,45,45,2,3]
  const boundary = [2,4]
  const index = firstBoundaryPosition(data, boundary)
  t.equal(index, -1)
  t.end()
})
