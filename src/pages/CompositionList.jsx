import { useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { PenLine, ArrowUpDown, Music, Disc3 } from 'lucide-react'
import { useCollection } from '../hooks/useFirestore'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatReleaseDate, toSortableDate } from '../utils/formatDate'

const COMPOSER = '小室哲哉'

const SORT_OPTIONS = [
  { value: 'date_desc', label: '發行日期：新→舊' },
  { value: 'date_asc', label: '發行日期：舊→新' },
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
  //    Only match inner segments that don't themselves contain a dash-pair
  s = s.replace(/\s+-([^-]+)-/g, (match, inner) => {
    return isVariantContent(inner) ? '' : match
  })

  return s.trim().toLowerCase()
}

function includesComposer(str) {
  return str && str.includes(COMPOSER)
}

export default function CompositionList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sortBy = searchParams.get('sort') || 'date_desc'
  const keyword = searchParams.get('q') || ''

  const setParam = (key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    }, { replace: true })
  }

  const { data: singles, loading: ls } = useCollection('singles', 'year', 'desc')
  const { data: albums, loading: la } = useCollection('albums', 'year', 'desc')
  const { data: providedSongs, loading: lp } = useCollection('providedSongs', 'year', 'desc')

  const loading = ls || la || lp

  const allSongs = useMemo(() => {
    if (loading) return []

    const raw = [] // { title, artistName, sourceTitle, sourceId, sourceType, year, month, day, kind }

    // 1. From singles: check top-level composition OR per-track composition
    singles.forEach(single => {
      const tracks = single.tracks || []
      if (tracks.length === 0) {
        // No tracks — treat the single itself as one track
        if (includesComposer(single.composition)) {
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
          if (includesComposer(track.composition)) {
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
        if (includesComposer(track.composition)) {
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
      if (includesComposer(song.composition)) {
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
        grouped.set(key, { ...song, _date: date })
      } else {
        const existing = grouped.get(key)
        // Keep earliest (smallest date, but 0 = unknown → prefer known)
        const existingDate = existing._date
        if (date > 0 && (existingDate === 0 || date < existingDate)) {
          grouped.set(key, { ...song, _date: date })
        }
      }
    })

    return [...grouped.values()]
  }, [singles, albums, providedSongs, loading])

  const filtered = useMemo(() => {
    let list = allSongs
    if (keyword) {
      const kw = keyword.toLowerCase()
      list = list.filter(s =>
        s.title?.toLowerCase().includes(kw) ||
        s.artistName?.toLowerCase().includes(kw) ||
        s.sourceTitle?.toLowerCase().includes(kw)
      )
    }
    return [...list].sort((a, b) => {
      return sortBy === 'date_asc' ? a._date - b._date : b._date - a._date
    })
  }, [allSongs, keyword, sortBy])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <PenLine size={22} className="text-blue-800" />
        <h1 className="text-2xl font-bold text-[#1d1d1f]">作曲作品總覽</h1>
        {!loading && (
          <span className="text-sm text-[#6e6e73] ml-2">共 {filtered.length} 首</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <ArrowUpDown size={15} className="text-[#6e6e73]" />
          <select
            value={sortBy}
            onChange={e => setParam('sort', e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 text-[#1d1d1f]"
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
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white shadow-sm text-[#1d1d1f] placeholder-[#6e6e73]"
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#6e6e73]">
          <PenLine size={48} className="mx-auto mb-3 opacity-20" />
          <p>{keyword ? `找不到「${keyword}」相關結果` : '尚無作曲資料'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[2fr_1.5fr_2fr_1fr_auto] gap-4 px-5 py-3 border-b border-gray-100 text-xs font-semibold text-[#6e6e73]">
            <div>歌名</div>
            <div>演唱藝人</div>
            <div>首次收錄作品</div>
            <div>發行日期</div>
            <div>種別</div>
          </div>

          <div className="divide-y divide-gray-50">
            {filtered.map((song, i) => (
              <div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_2fr_1fr_auto] gap-1 sm:gap-4 items-start sm:items-center px-5 py-3.5 hover:bg-[#f5f5f7] transition-colors"
              >
                {/* 歌名 */}
                <div className="font-medium text-sm text-[#1d1d1f]">{song.title}</div>

                {/* 演唱藝人 */}
                <div className="text-sm text-[#6e6e73]">
                  {song.artistName ? (
                    <Link
                      to={`/artists/${encodeURIComponent(song.artistName)}`}
                      className="hover:text-blue-700 hover:underline"
                    >
                      {song.artistName}
                    </Link>
                  ) : '—'}
                </div>

                {/* 首次收錄作品 */}
                <div className="text-sm text-[#6e6e73]">
                  {song.sourceId ? (
                    <Link
                      to={`/${song.sourceType === 'single' ? 'singles' : 'albums'}/${song.sourceId}`}
                      className="hover:text-blue-700 hover:underline flex items-center gap-1.5"
                    >
                      {song.sourceType === 'single'
                        ? <Music size={12} className="text-blue-600 shrink-0" />
                        : <Disc3 size={12} className="text-indigo-600 shrink-0" />
                      }
                      <span className="truncate">{song.sourceTitle}</span>
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Music size={12} className="text-rose-400 shrink-0" />
                      <span className="truncate">{song.sourceTitle || '—'}</span>
                    </span>
                  )}
                </div>

                {/* 發行日期 */}
                <div className="text-xs text-[#6e6e73]">
                  {formatReleaseDate(song.year, song.month, song.day) || '—'}
                </div>

                {/* 種別 */}
                <div>
                  {song.sourceType === 'single' && (
                    <span className="badge badge-blue">單曲</span>
                  )}
                  {song.sourceType === 'album' && (
                    <span className="badge badge-indigo">專輯曲</span>
                  )}
                  {song.sourceType === 'provided' && (
                    <span className="badge badge-gray">提供樂曲</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
