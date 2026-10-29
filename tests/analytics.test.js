import test from 'node:test'
import assert from 'node:assert/strict'
import { catalogueRows, filterRows, collectionSummary, prepareSales, salesValue, salesSummary, groupSales, csvText } from '../src/utils/releaseAnalytics.js'
const catalogue = {
 singles: [{id:'s',title:'A',artistName:'篠原涼子',year:1995,salesRecord:100}],
 albums: [{id:'a',title:'B',artistName:'globe',year:1996,salesRecord:200}],
 providedSongs: [{id:'p',title:'A',kind:'single',artistName:'篠原涼子 with t.komuro',year:1995,salesRecord:100}, {id:'p2',title:'Track',kind:'album',sourceTitle:'C',artistName:'Other',year:1996,salesRecord:20}, {id:'p3',title:'Track 2',kind:'album',sourceTitle:'C',artistName:'Other',year:1996,salesRecord:20}]
}
test('collection counts works and owned formats separately, ignores orphan inventory', () => {
 const rows = catalogueRows(catalogue,[{id:'singles__s',owned:{cd:true,digital:true}},{id:'albums__a',owned:{cd:true}},{id:'albums__deleted',owned:{cd:true}}])
 const s = collectionSummary(rows)
 assert.equal(s.ownedWorks,2); assert.equal(s.ownedFormats,3)
 const digital = collectionSummary(rows,'digital'); assert.equal(digital.ownedWorks,1); assert.equal(digital.ownedFormats,1)
})
test('sales distinguishes missing, invalid and explicit zero', () => {
 for (const v of [null,undefined,'','  ',true,-1,'bad',Infinity]) assert.equal(salesValue(v),null)
 assert.equal(salesValue('0'),0)
 assert.deepEqual(salesSummary([{salesRecord:0,releaseYear:1995},{salesRecord:null},{salesRecord:2}]),{total:2,known:2,missing:1,undated:1})
})
test('provided release aliases and multiple album tracks do not double count', () => {
 const rows=catalogueRows(catalogue)
 assert.equal(salesSummary(prepareSales(rows).rows).total,300)
 const prepared=prepareSales(rows,true)
 assert.equal(salesSummary(prepared.rows).total,320)
 assert.equal(prepared.excluded.length,2)
 assert.equal(groupSales(prepared.rows,'releaseYear').find(row=>row.key==='1996').total,220)
})
test('ambiguous provided album totals and missing source titles are excluded', () => {
 const rows=catalogueRows({providedSongs:[{id:'1',kind:'album',title:'x',sourceTitle:'Release',artistName:'a',year:1990,salesRecord:10},{id:'2',kind:'album',title:'y',sourceTitle:'Release',artistName:'a',year:1990,salesRecord:20},{id:'3',kind:'coupling',title:'z',salesRecord:5}]})
 const result=prepareSales(rows,true); assert.equal(result.rows.length,0); assert.equal(result.excluded.length,3)
})
test('filters include endpoints and exclude unknown release years only when bounded', () => {
 const rows=catalogueRows({singles:[...catalogue.singles,{id:'u',salesRecord:30}]})
 assert.equal(filterRows(rows).length,2)
 assert.equal(filterRows(rows,{from:'1995',to:'1995'}).length,1)
 assert.equal(filterRows(rows,{from:'1996',to:'1995'}).length,0)
 assert.equal(filterRows(rows,{artist:'篠原涼子'}).length,1)
})
test('CSV quotes fields and neutralizes spreadsheet formula injection', () => {
 const csv=csvText(['Title'],[['=HYPERLINK("x")'],['a,b\nc']])
 assert.ok(csv.includes('"\'=HYPERLINK(""x"")"')); assert.ok(csv.includes('"a,b\nc"'))
})
