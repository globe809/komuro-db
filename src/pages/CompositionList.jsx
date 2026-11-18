import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PenLine, ArrowUpDown } from 'lucide-react'
import { useCollection } from '../hooks/useFirestore'
import YearTimeline from '../components/YearTimeline'
import CompositionTable, { COMPOSITION_TYPES } from '../components/CompositionTable'
import { compareReleaseDate } from '../utils/sortReleaseDate'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatReleaseDate, toSortableDate } from '../utils/formatDate'

const COMPOSER = '小室哲哉'

const SORT_OPTIONS = [
  { value: 'date_desc', label: '發行日期：新→舊' },
  { value: 'date_asc', label: '發行日期：舊→新' },
  { value: 'title_asc', label: '各年歌名：A → Z' },
  { value: 'title_desc', label: '各年歌名：Z → A' },
]

/**
 * Returns true if the text inside brackets/dashes describes a variant
 * (remix, version, mix, edit, instrumental, etc.)
 */
function isVariantContent(inner) {
  // Matches any string that contains these keywords as whole words / boundary matches
  return /\b(?:mix(?:es)?|remix|re-?mix|version|ver\.?|edit|instrumental|inst\.?|orchestral|acoustic|piano|mixture|extended|straight)\b/i.test(inner)
    || /カラオケ/.test(inner)
    || /\boff\s*vocal\b/i.test(inner)
    || /\bbacking\b/i.test(inner)
}

/**
 * Normalize a song title for deduplication:
 * - Strip parenthetical / bracket content that describes a variant
 *   e.g. (album mix), (tk remix), (SPACE GROOVE MIX), (united states mix),
 *        (UK DANCE VERSION), (Expanded Version), (LA Session Version),
 *        (-Version. 2023-), (manhattan b.mix), (bob brockman mix), etc.
 * - Strip dash-bounded variant tags e.g. -Mixture with Canon in D-
 * - Exception: if title still contains " / " after stripping, the remaining
 *   text (e.g. "/ a-nation's party") keeps it distinct, so it won't collapse
 *   with plain versions of the main title.
 */
function normalizeTitle(title) {
  if (!title) return ''

  let s = title

  // 1. Strip anything inside ( ), （ ）, [ ], 【 】 when content is a variant
  s = s.replace(/\s*[\(（\[【]([^\)）\]】]*)[\)）\]】]/g, (match, inner) => {
    return isVariantContent(inner) ? '' : match
  })

  // 2. Strip dash-bounded tags when content is a variant, e.g. -Mixture with Canon in D-
  s = s.replace(/\s+-([^-]+)-/g, (match, inner) => {
    return isVariantContent(inner) ? '' : match
  })

  // 3. Strip known variant keywords at the end of title without brackets
  //    e.g. "SONG tk remix" / "SONG REMIX-VERSION" / "SONG SEQ OVER DUB MIX"
  s = s.replace(
    /\s+(?:tk\s+remix|album\s+mix|seq\s+over\s+dub\s+mix|remix-version|re-?mix|remix)\s*$/gi,
    ''
  )

  return s.trim().toLowerCase()
}

function includesComposer(str) {
  return str && str.includes(COMPOSER)
}

/**
 * 判斷歌曲標題是否為應排除的版本（純音樂、Karaoke、配唱、TVサイズ等）
 * 這類歌曲不算獨立作品，不列入作曲總覽
 */
function isTitleToSkip(title) {
  if (!title) return false
  return /\binstrumental\b/i.test(title)
    || /\bkaraoke\b/i.test(title)
    || /\bback[\s-]?track\b/i.test(title)
    || /TVサイズ/i.test(title)
    || /TVオープニングサイズ/i.test(title)
}

export default function CompositionList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sortBy = searchParams.get('sort') || 'date_desc'
  const sourceType = COMPOSITION_TYPES.some(type => type.value === searchParams.get('type')) ? searchParams.get('type') : ''
  const keyword = searchParams.get('q') || ''

  const setParam = (key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    }, { replace: true })
  }

  const { data: singles, loading: ls } = useCollection('singles', null)
  const { data: albums, loading: la } = useCollection('albums', null)
  const { data: providedSongs, loading: lp } = useCollection('providedSongs', null)

  const loading = ls || la || lp

  const allSongs = useMemo(() => {
    if (loading) return []

    const raw = [] // { title, artistName, sourceTitle, sourceId, sourceType, year, month, day, kind }

    // 1. From singles: check top-level composition OR per-track composition
    singles.forEach(single => {
      const tracks = single.tracks || []
      if (tracks.length === 0) {
        // No tracks — treat the single itself as one track
        if (includesComposer(single.composition) && !isTitleToSkip(single.title)) {
          raw.push({
            title: single.title,
            artistName: single.artistName || '',
            sourceTitle: single.title,
            sourceId: single.id,
            sourceType: 'single',
            year: single.year,
            month: single.month,
            day: single.day,
          })
        }
      } else {
        tracks.forEach(track => {
          if (includesComposer(track.composition) && !isTitleToSkip(track.title)) {
            raw.push({
              title: track.title,
              artistName: single.artistName || '',
              sourceTitle: single.title,
              sourceId: single.id,
              sourceType: 'single',
              year: single.year,
              month: single.month,
              day: single.day,
            })
          }
        })
      }
    })

    // 2. From albums: per-track composition
    albums.forEach(album => {
      const tracks = album.tracks || []
      tracks.forEach(track => {
        if (includesComposer(track.composition) && !isTitleToSkip(track.title)) {
          raw.push({
            title: track.title,
            artistName: album.artistName || '',
            sourceTitle: album.title,
            sourceId: album.id,
            sourceType: 'album',
            year: album.year,
            month: album.month,
            day: album.day,
          })
        }
      })
    })

    // 3. From providedSongs
    providedSongs.forEach(song => {
      if (includesComposer(song.composition) && !isTitleToSkip(song.title)) {
        raw.push({
          title: song.title,
          artistName: song.artistName || '',
          sourceTitle: song.sourceTitle || song.title,
          sourceId: null,
          sourceType: 'provided',
          year: song.year,
          month: song.month,
          day: song.day,
        })
      }
    })

    // Dedup: group by artistName (lowercase) + normalizedTitle
    // Keep earliest release per group
    const grouped = new Map()
    raw.forEach(song => {
      const key = `${song.artistName.toLowerCase()}__${normalizeTitle(song.title)}`
      const date = toSortableDate(song.year, song.month, song.day)
      if (!grouped.has(key)) {
        grouped.set(key, { ...song, _key: key, _date: date })
      } else {
        const existing = grouped.get(key)
        // Keep earliest (smallest date, but 0 = unknown → prefer known)
        const existingDate = existing._date
        if (date > 0 && (existingDate === 0 || date < existingDate)) {
          grouped.set(key, { ...song, _key: key, _date: date })
        }
      }
    })

    return [...grouped.values()]
  }, [singles, albums, providedSongs, loading])

  const searched = useMemo(() => {
    let list = allSongs
    if (keyword) {
      const kw = keyword.toLowerCase()
      list = list.filter(s =>
        s.title?.toLowerCase().includes(kw) ||
        s.artistName?.toLowerCase().includes(kw) ||
        s.sourceTitle?.toLowerCase().includes(kw)
      )
    }
    return list
  }, [allSongs, keyword])

  const filtered = useMemo(() => {
    const list = sourceType ? searched.filter(song => song.sourceType === sourceType) : searched
    return [...list].sort((a, b) => {
      if (sortBy === 'title_asc') return (a.title || '').localeCompare(b.title || '', 'ja')
      if (sortBy === 'title_desc') return (b.title || '').localeCompare(a.title || '', 'ja')
      return compareReleaseDate(a, b, sortBy === 'date_asc' ? 'asc' : 'desc')
    })
  }, [searched, sourceType, sortBy])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-3xl sm:text-4xl text-gray-900" style={{ fontWeight: 300, letterSpacing: "0.1em", textTransform: "uppercase" }}>Works</h1>
        {!loading && (
          <span className="text-sm text-gray-400">{filtered.length}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <ArrowUpDown size={15} className="text-gray-500" />
          <select
            aria-label="作品排序"
            value={sortBy}
            onChange={e => setParam('sort', e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-900"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={keyword}
          onChange={e => setParam('q', e.target.value)}
          placeholder="搜尋歌名、藝人、收錄作品..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white shadow-sm text-gray-900 placeholder-gray-400"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="作品種別篩選">
        {[{ value: '', label: '全部' }, ...COMPOSITION_TYPES].map(type => (
          <button key={type.value} type="button" aria-pressed={sourceType === type.value} onClick={() => setParam('type', type.value)} className={`rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-300 ${sourceType === type.value ? 'control-selected' : 'border-gray-200 bg-white text-gray-500 hover:bg-stone-100'}`}>
            {type.label}<span className="ml-2 text-xs text-gray-400">{type.value ? searched.filter(song => song.sourceType === type.value).length : searched.length}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mb-6">依首次收錄作品分類並按首次發行年份分組；歌名排序套用於各年份內。窄螢幕可左右捲動表格查看所有欄位。</p>
      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <PenLine size={48} className="mx-auto mb-3 opacity-20" />
          <p>{keyword ? `找不到「${keyword}」相關結果` : '沒有符合種別的作曲資料'}</p>
        </div>
      ) : (
        <YearTimeline items={filtered} direction={sortBy === 'date_asc' ? 'asc' : 'desc'} layout="list" renderGroup={(songs, year) => <CompositionTable songs={songs} year={year} />} />
      )}
    </div>
  )
}
