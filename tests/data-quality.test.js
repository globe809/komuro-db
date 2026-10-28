import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeReleaseName, findDuplicateCandidates, validReleaseDate, getQualityIssues, duplicateGroups, deduplicateImport } from '../src/utils/dataQuality.js'
import { groupReleases } from '../src/utils/groupReleases.js'
import { readBrowseState, writeBrowseState } from '../src/utils/browseStorage.js'

const release = { id: 'one', title: 'Get Wild', artistName: 'TM NETWORK', year: 1987, month: 4, day: 8, type: 'physical', tracks: [{ title: 'Get Wild' }], imageUrl: 'https://example.test/cover.jpg' }
test('full-width, case and spacing variants identify the same title', () => {
  assert.equal(normalizeReleaseName('Ｇｅｔ　Ｗｉｌｄ'), normalizeReleaseName('get wild'))
  assert.equal(findDuplicateCandidates({ ...release, title: 'Ｇｅｔ　Ｗｉｌｄ' }, [release]).length, 1)
})
test('editing excludes only itself, other artists and versions stay distinct', () => {
  assert.equal(findDuplicateCandidates(release, [release], 'one').length, 0)
  assert.equal(findDuplicateCandidates({ ...release, artistName: 'globe' }, [release]).length, 0)
  assert.equal(findDuplicateCandidates({ ...release, title: 'Get Wild (Remix)' }, [release]).length, 0)
})
test('validates actual calendar dates, leap years and unknown date fields', () => {
  assert.equal(validReleaseDate({ year: 2024, month: 2, day: 29 }), true)
  for (const date of [{ year: 2023, month: 2, day: 29 }, { year: 2024, month: 4, day: 31 }, { year: 1995 }, {}, { year: 1995, month: 0, day: 1 }]) assert.equal(validReleaseDate(date), false)
})
test('quality checks include undated records and empty track placeholders', () => {
  assert.deepEqual(getQualityIssues(release, 'singles'), [])
  const issues = getQualityIssues({ tracks: [{ title: ' ' }] }, 'albums').map(item => item.key)
  assert.deepEqual(issues, ['title', 'artist', 'cover', 'date', 'contents'])
  assert.equal(getQualityIssues({ ...release, contents: [{ title: 'LIVE' }] }, 'videoWorks').length, 0)
})
test('duplicate groups require both artist and title', () => {
  assert.equal(duplicateGroups([release, { ...release, id: 'two', year: 2020 }, { title: '' }, { title: '' }]).length, 1)
})
test('import skips only identical payloads, preserving dates, editions and different contents', () => {
  const equivalent = { ...release, id: 'another', tracks: [{ title: 'Get Wild' }], updatedAt: 'ignored metadata' }
  const variations = [{ ...release, year: 2000 }, { ...release, type: 'digital' }, { ...release, tracks: [{ title: 'Instrumental' }] }, { ...release, notes: 'Limited edition' }]
  const result = deduplicateImport([release, equivalent, ...variations])
  assert.equal(result.duplicates.length, 1)
  assert.equal(result.unique.length, 5)
  assert.equal(release.tracks[0].title, 'Get Wild')
})
test('year groups normalize strings, preserve within-year sorting and put unknown dates last', () => {
  const items = [{ year: '1995', id: 1 }, { year: 2025 }, { year: 1995, id: 3 }, {}, { year: 'invalid' }]
  const groups = groupReleases(items)
  assert.deepEqual(groups.map(item => item.year), ['2025', '1995', 'unknown'])
  assert.deepEqual(groups[1].releases.map(item => item.id), [1, 3])
  assert.deepEqual(groupReleases(items, 'asc').map(item => item.year), ['1995', '2025', 'unknown'])
})
test('browse storage survives unavailable storage without breaking the page', () => {
  assert.equal(readBrowseState('missing', 123), 123)
  writeBrowseState('memory', { view: 'table', y: 1200 })
  assert.deepEqual(readBrowseState('memory', null), { view: 'table', y: 1200 })
})
