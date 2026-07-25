import { useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Music, Disc3, Video, Mic2, ArrowRight } from 'lucide-react'
import { useCollection } from '../hooks/useFirestore'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatReleaseDate } from '../utils/formatDate'

function ResultSection({ icon: Icon, title, color, items, renderItem }) {
  if (items.length === 0) return null
  return (
    <section className="mb-8">
      <h2 className={`flex items-center gap-2 text-base font-bold mb-3 ${color}`}>
        <Icon size={18} />
        {title}
        <span className="text-sm font-normal text-zinc-500">（{items.length}）</span>
      </h2>
      <div className="bg-zinc-900 rounded-xl border border-white/10 shadow-sm divide-y divide-white/5">
        {items.slice(0, 10).map(renderItem)}
      </div>
      {items.length > 10 && (
        <p className="text-xs text-zinc-500 mt-2 text-right">僅顯示前 10 筆，請縮小關鍵字範圍</p>
      )}
    </section>
  )
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''

  const { data: singles, loading: ls } = useCollection('singles', 'year', 'desc')
  const { data: albums, loading: la } = useCollection('albums', 'year', 'desc')
  const { data: videoWorks, loading: lv } = useCollection('videoWorks', 'year', 'desc')
  const { data: providedSongs, loading: lp } = useCollection('providedSongs', 'year', 'desc')

  const loading = ls || la || lv || lp

  const kw = q.toLowerCase()

  const matchedSingles = useMemo(() => {
    if (!kw) return []
    return singles.filter(s =>
      s.title?.toLowerCase().includes(kw) ||
      s.artistName?.toLowerCase().includes(kw) ||
      s.tieUp?.toLowerCase().includes(kw)
    )
  }, [singles, kw])

  const matchedAlbums = useMemo(() => {
    if (!kw) return []
    return albums.filter(a =>
      a.title?.toLowerCase().includes(kw) ||
      a.artistName?.toLowerCase().includes(kw)
    )
  }, [albums, kw])

  const matchedVideoWorks = useMemo(() => {
    if (!kw) return []
    return videoWorks.filter(v =>
      v.title?.toLowerCase().includes(kw) ||
      v.artistName?.toLowerCase().includes(kw)
    )
  }, [videoWorks, kw])

  const matchedProvided = useMemo(() => {
    if (!kw) return []
    return providedSongs.filter(s =>
      s.title?.toLowerCase().includes(kw) ||
      s.artistName?.toLowerCase().includes(kw) ||
      s.sourceTitle?.toLowerCase().includes(kw)
    )
  }, [providedSongs, kw])

  const totalResults = matchedSingles.length + matchedAlbums.length + matchedVideoWorks.length + matchedProvided.length

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Search bar */}
      <div className="mb-8">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={q}
            onChange={e => setSearchParams({ q: e.target.value }, { replace: true })}
            placeholder="輸入歌名、藝人、作品名稱..."
            className="w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-sm bg-zinc-900"
            autoFocus
          />
        </div>
        {q && !loading && (
          <p className="text-sm text-zinc-500 mt-2">
            「{q}」共找到 {totalResults} 筆結果
          </p>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : !q ? (
        <div className="text-center py-16 text-zinc-500">
          <Search size={48} className="mx-auto mb-3 opacity-20" />
          <p>輸入關鍵字開始搜尋</p>
        </div>
      ) : totalResults === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <Search size={48} className="mx-auto mb-3 opacity-20" />
          <p>找不到「{q}」相關結果</p>
        </div>
      ) : (
        <>
          {/* Singles */}
          <ResultSection
            icon={Music}
            title="單曲"
            color="text-blue-400"
            items={matchedSingles}
            renderItem={s => (
              <Link key={s.id} to={`/singles/${s.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900/50 transition-colors">
                <div className="w-9 h-9 rounded bg-blue-900/30 overflow-hidden shrink-0">
                  {s.imageUrl
                    ? <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Music size={14} className="text-blue-400" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{s.title}</div>
                  <div className="text-xs text-zinc-500">{s.artistName} · {s.year ? `${s.year}年` : ''}</div>
                </div>
                <ArrowRight size={14} className="text-zinc-600 shrink-0" />
              </Link>
            )}
          />

          {/* Albums */}
          <ResultSection
            icon={Disc3}
            title="專輯"
            color="text-indigo-400"
            items={matchedAlbums}
            renderItem={a => (
              <Link key={a.id} to={`/albums/${a.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900/50 transition-colors">
                <div className="w-9 h-9 rounded bg-indigo-100 overflow-hidden shrink-0">
                  {a.imageUrl
                    ? <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Disc3 size={14} className="text-indigo-500" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{a.title}</div>
                  <div className="text-xs text-zinc-500">{a.artistName} · {a.year ? `${a.year}年` : ''}</div>
                </div>
                <ArrowRight size={14} className="text-zinc-600 shrink-0" />
              </Link>
            )}
          />

          {/* Video Works */}
          <ResultSection
            icon={Video}
            title="影像作品"
            color="text-zinc-300"
            items={matchedVideoWorks}
            renderItem={v => (
              <Link key={v.id} to={`/video-works/${v.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900/50 transition-colors">
                <div className="w-9 h-9 rounded bg-zinc-800 overflow-hidden shrink-0">
                  {v.imageUrl
                    ? <img src={v.imageUrl} alt={v.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Video size={14} className="text-zinc-500" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{v.title}</div>
                  <div className="text-xs text-zinc-500">{v.artistName} · {v.year ? `${v.year}年` : ''}</div>
                </div>
                <ArrowRight size={14} className="text-zinc-600 shrink-0" />
              </Link>
            )}
          />

          {/* Provided Songs */}
          <ResultSection
            icon={Mic2}
            title="提供樂曲"
            color="text-rose-400"
            items={matchedProvided}
            renderItem={(s, i) => (
              <div key={s.id || i} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900/50">
                <div className="w-9 h-9 rounded bg-rose-900/20 overflow-hidden shrink-0">
                  {s.imageUrl
                    ? <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Mic2 size={14} className="text-rose-300" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{s.title}</div>
                  <div className="text-xs text-zinc-500 truncate">
                    {s.artistName}{s.sourceTitle ? ` · ${s.sourceTitle}` : ''} · {s.year ? `${s.year}年` : ''}
                  </div>
                </div>
              </div>
            )}
          />
        </>
      )}
    </div>
  )
}
