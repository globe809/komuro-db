const base = { artistName: 'TM NETWORK', title: 'Get Wild', year: 1987, month: 4, day: 8, tracks: [{ trackNo: 1, title: 'Get Wild' }], type: 'physical', albumType: 'studio', imageUrl: '', notes: '' }
export const fixtures = {
 providedSongs: [{id:'qa-provided',title:'Provided song',kind:'single',artistName:'篠原涼子',year:1995,salesRecord:202.1}],
  singles: [{ ...base, id: 'single-one', salesRecord: 22.7 }, { ...base, id: 'single-reissue', salesRecord: 5, year: 2020 }, { id: 'single-undated', title: '未填日期作品', artistName: 'globe' }],
  albums: [{ ...base, id: 'album-one', salesRecord: 125, title: 'CAROL', year: 1988 }, { ...base, id: 'album-two', salesRecord: 10, title: 'CAROL', year: 2004 }],
  videoWorks: [{ ...base, id: 'video-one', title: 'LIVE', formats: ['Blu-ray'], videoType: 'concert', contents: [] }],
  collectionInventory: [{ id: 'singles__single-one', kind: 'singles', workId: 'single-one', schemaVersion: 1, trackedFormats: ['cd', 'digital'], owned: { cd: true } }],
  artists: [{ id: 'tm', name: 'TM NETWORK' }, { id: 'globe', name: 'globe' }],
}
