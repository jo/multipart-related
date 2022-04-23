import tap from 'tap'

import startsWithBoundaryEnd from '../src/starts-with-boundary-end.js'

tap.test('smoke', t => {
  const data = [45, 45, 1, 2, 45, 45]
  const boundary = [1,2]
  const starting = startsWithBoundaryEnd(data, boundary)
  t.equal(starting, true)
  t.end()
})

tap.test('no start', t => {
  const data = [45, 1, 2, 45, 45]
  const boundary = [1,2]
  const starting = startsWithBoundaryEnd(data, boundary)
  t.equal(starting, false)
  t.end()
})

tap.test('no end', t => {
  const data = [45, 45, 1, 2, 45]
  const boundary = [1,2]
  const starting = startsWithBoundaryEnd(data, boundary)
  t.equal(starting, false)
  t.end()
})

tap.test('with offset', t => {
  const data = [1, 45, 45, 1, 2, 45, 45]
  const boundary = [1,2]
  const starting = startsWithBoundaryEnd(data, boundary, 1)
  t.equal(starting, true)
  t.end()
})
