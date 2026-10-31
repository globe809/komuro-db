import test from 'node:test'
import assert from 'node:assert/strict'
import { compareReleaseDate } from '../src/utils/sortReleaseDate.js'
test('sorts by year then month then day, not year alone', () => {
 const rows=[{id:'b',year:1995,month:2,day:10},{id:'c',year:1995,month:1,day:20},{id:'a',year:1994,month:12,day:31},{id:'d',year:1995,month:1,day:5}]
 assert.deepEqual([...rows].sort(compareReleaseDate).map(r=>r.id),['a','d','c','b'])
 assert.deepEqual([...rows].sort((a,b)=>compareReleaseDate(a,b,'desc')).map(r=>r.id),['b','c','d','a'])
})
test('missing year or date parts always follow known dates', () => {
 const rows=[{id:'u'},{id:'m',year:'1995'},{id:'d',year:1995,month:1},{id:'k',year:'1995',month:'1',day:'2'}]
 for (const order of ['asc','desc']) assert.deepEqual([...rows].sort((a,b)=>compareReleaseDate(a,b,order)).map(r=>r.id),['k','d','m','u'])
})
test('same release sorts disc and track numbers with stable identity tie-breaks', () => {
 const rows=[{id:'b',year:1995,discNo:2,trackNo:1},{id:'a',year:1995,discNo:1,trackNo:2}]
 assert.equal([...rows].sort(compareReleaseDate)[0].id,'a')
})
