import test from 'node:test'
import assert from 'node:assert/strict'
import { dedupeCompositions, normalizeCompositionTitle } from '../src/utils/compositionVersions.js'
import { toSortableDate } from '../src/utils/formatDate.js'

test('RUNNING TO HORIZON original and 206 Mix both remain visible', () => {
  const rows = dedupeCompositions([
    { title: 'RUNNING TO HORIZON', artistName: '小室哲哉', year: '1989', month: '10', day: '28' },
    { title: 'RUNNING TO HORIZON (206 Mix) ', artistName: '小室哲哉', year: '2021', month: '4', day: '28' },
  ])
  assert.equal(rows.length, 2)
  assert.equal(rows[1].year, '2021')
})
test('named remixes, album versions and acoustic recordings remain distinct', () => {
  const titles = ['Song', 'Song (Album Mix)', 'Song [TK REMIX]', 'Song -Version. 2023-', 'Song Acoustic', 'Song tk remix']
  assert.equal(dedupeCompositions(titles.map(title => ({ title, artistName: 'a', year: 2000 }))).length, titles.length)
})
test('same version normalizes typography and keeps its earliest release across numeric and string dates', () => {
  const rows = dedupeCompositions([
    { title: 'Song (206 Mix)', artistName: 'a', year: 2022, month: 1, day: 1, sourceId: 'later' },
    { title: ' SONG （206 MIX） ', artistName: 'a', year: '2021', month: '4', day: '28', sourceId: 'earlier' },
    { title: 'Song (206 Mix)', artistName: 'b', year: 2021 },
  ])
  assert.equal(rows.length, 2)
  assert.equal(rows[0].sourceId, 'earlier')
  assert.equal(normalizeCompositionTitle('Song （206 Mix）'), normalizeCompositionTitle('Song(206 Mix)'))
})
test('date keys treat string and numeric date fields identically and prefer known years', () => {
  assert.equal(toSortableDate('2021', '4', '28'), 20210428)
  assert.equal(toSortableDate(2021, 4, 28), 20210428)
  assert.equal(toSortableDate(null, 4, 28), 0)
  assert.equal(dedupeCompositions([{title:'a'}, {title:'a', year:2021}])[0].year, 2021)
})
