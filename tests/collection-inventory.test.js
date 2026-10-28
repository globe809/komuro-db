import test from 'node:test'
import assert from 'node:assert/strict'
import { collectionProgress, defaultTrackedFormats, inventoryId } from '../src/utils/collectionInventory.js'

test('stable inventory keys keep album, single and video ownership independent', () => {
  assert.notEqual(inventoryId('albums', 'same'), inventoryId('singles', 'same'))
})
test('format defaults distinguish physical, digital and video releases', () => {
  assert.deepEqual(defaultTrackedFormats({ type: 'digital' }, 'singles'), ['digital'])
  assert.deepEqual(defaultTrackedFormats({ type: 'physical' }, 'singles'), ['cd'])
  assert.deepEqual(defaultTrackedFormats({}, 'albums'), ['cd'])
  assert.deepEqual(defaultTrackedFormats({ formats: ['Blu-ray', 'DVD', 'VHS', 'Blu-ray'] }, 'videoWorks'), ['bluray', 'dvd', 'vhs'])
  assert.deepEqual(defaultTrackedFormats({ format: 'BD' }, 'videoWorks'), ['bluray'])
})
test('unknown video formats are not falsely counted as missing discs', () => {
  const progress = collectionProgress({ formats: ['LD'] }, 'videoWorks')
  assert.equal(progress.status, 'unconfigured')
  assert.deepEqual(progress.missingFormats, [])
})
test('partial ownership reports only the missing tracked formats', () => {
  const progress = collectionProgress({ formats: ['Blu-ray', 'DVD'] }, 'videoWorks', { owned: { bluray: true } })
  assert.equal(progress.status, 'partial')
  assert.deepEqual(progress.ownedFormats, ['bluray'])
  assert.deepEqual(progress.missingFormats, ['dvd'])
})
test('manual tracking can replace album CD defaults with digital, or track nothing', () => {
  assert.deepEqual(collectionProgress({}, 'albums', { trackedFormats: ['digital'] }).missingFormats, ['digital'])
  assert.equal(collectionProgress({}, 'albums', { trackedFormats: [] }).status, 'unconfigured')
})
test('owned formats remain visible and truthy strings do not count as owned', () => {
  const progress = collectionProgress({}, 'albums', { trackedFormats: [], owned: { cd: 'yes', digital: true } })
  assert.deepEqual(progress.tracked, ['digital'])
  assert.equal(progress.status, 'complete')
})
test('unchecking the final owned format restores unowned status without mutation', () => {
  const work = {}, entry = { owned: { cd: true }, trackedFormats: ['cd'] }
  assert.equal(collectionProgress(work, 'albums', entry).status, 'complete')
  assert.equal(collectionProgress(work, 'albums', { ...entry, owned: { cd: false } }).status, 'unowned')
  assert.equal(entry.owned.cd, true)
})
