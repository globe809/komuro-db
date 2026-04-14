// 專輯類型
export const ALBUM_TYPES = [
  { value: 'studio', label: '錄音室專輯' },
  { value: 'remix', label: '混音專輯' },
  { value: 'best', label: '精選輯' },
  { value: 'project', label: '企劃專輯' },
  { value: 'soundtrack', label: '原聲帶 (OST)' },
  { value: 'live', label: '演唱會專輯' },
  { value: 'instrumental', label: '純音樂專輯' },
  { value: 'box', label: 'BOX' },
  { value: 'other', label: '其他' },
]

// 單曲類型
export const SINGLE_TYPES = [
  { value: 'physical', label: '實體單曲' },
  { value: 'digital', label: '數位單曲' },
]

// 提供樂曲種別
export const PROVIDED_SONG_KINDS = [
  { value: 'single', label: '實體單曲' },
  { value: 'digital', label: '數位單曲' },
  { value: 'album', label: '專輯曲' },
  { value: 'coupling', label: 'C/W（偶合曲）' },
  { value: 'other', label: '其他' },
]

// 影像作品格式
export const VIDEO_FORMATS = [
  { value: 'DVD', label: 'DVD' },
  { value: 'Blu-ray', label: 'Blu-ray' },
  { value: 'VHS', label: 'VHS' },
  { value: 'LD', label: 'LD（LaserDisc）' },
]

// 月份
export const MONTHS = [
  { value: 1, label: '1月' },
  { value: 2, label: '2月' },
  { value: 3, label: '3月' },
  { value: 4, label: '4月' },
  { value: 5, label: '5月' },
  { value: 6, label: '6月' },
  { value: 7, label: '7月' },
  { value: 8, label: '8月' },
  { value: 9, label: '9月' },
  { value: 10, label: '10月' },
  { value: 11, label: '11月' },
  { value: 12, label: '12月' },
]

export const getAlbumTypeLabel = (value) =>
  ALBUM_TYPES.find((t) => t.value === value)?.label ?? value

export const getSingleTypeLabel = (value) =>
  SINGLE_TYPES.find((t) => t.value === value)?.label ?? value

export const getVideoFormatLabel = (value) =>
  VIDEO_FORMATS.find((f) => f.value === value)?.label ?? value

export const getProvidedSongKindLabel = (value) =>
  PROVIDED_SONG_KINDS.find((k) => k.value === value)?.label ?? value
