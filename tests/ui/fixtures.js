const base = { artistName: 'TM NETWORK', title: 'Get Wild', year: 1987, month: 4, day: 8, tracks: [{ trackNo: 1, title: 'Get Wild' }], type: 'physical', albumType: 'studio', imageUrl: '', notes: '' }
export const fixtures = {
  singles: [{ ...base, id: 'single-one' }, { ...base, id: 'single-reissue', year: 2020 }, { id: 'single-undated', title: '未填日期作品', artistName: 'globe' }],
  albums: [{ ...base, id: 'album-one', title: 'CAROL', year: 1988 }, { ...base, id: 'album-two', title: 'CAROL', year: 2004 }],
  videoWorks: [{ ...base, id: 'video-one', title: 'LIVE', formats: ['Blu-ray'], videoType: 'concert', contents: [] }],
  collectionInventory: [{ id: 'singles__single-one', kind: 'singles', workId: 'single-one', schemaVersion: 1, trackedFormats: ['cd', 'digital'], owned: { cd: true } }],
  artists: [{ id: 'tm', name: 'TM NETWORK' }, { id: 'globe', name: 'globe' }],
}
