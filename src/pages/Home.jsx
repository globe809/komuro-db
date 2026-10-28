import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Music, Disc3, Video, Search, ArrowRight, Pause, Play, ChevronLeft, ChevronRight, PlayCircle, X } from 'lucide-react'
import { useCollection, useDocument } from '../hooks/useFirestore'
import LoadingSpinner from '../components/LoadingSpinner'
import CoverArt from '../components/CoverArt'
import { formatReleaseDate } from '../utils/formatDate'
import { track } from '../utils/analytics'

const TYPE_LABEL = { single: 'Single', album: 'Album', video: 'Video' }
const TYPE_BADGE = { single: 'badge-blue', album: 'badge-indigo', video: 'badge-rose' }
const TYPE_ICON = { single: Music, album: Disc3, video: Video }

function sortKey(x) {
  return (x.year || 0) * 10000 + (x.month || 0) * 100 + (x.day || 0)
}

function getYoutubeEmbedUrl(url) {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null
}

export default function Home() {
  const { data: siteConfig } = useDocument('siteConfig', 'home')
  const { data: singles, loading: ls } = useCollection('singles', 'year', 'desc')
  const { data: albums, loading: la } = useCollection('albums', 'year', 'desc')
  const { data: videoWorks, loading: lv } = useCollection('videoWorks', 'year', 'desc')
  const { data: artists, loading: lar } = useCollection('artists', 'name', 'asc')

  const [keyword, setKeyword] = useState('')
  const [mvOpen, setMvOpen] = useState(null) // 開啟 lightbox 的 embed url

  // 最新 10 個有 YouTube MV 連結的作品（含作品層級與曲目層級的連結）
  const recentMvs = useMemo(() => {
    const findMvUrl = (x) => {
      if (getYoutubeEmbedUrl(x.youtubeUrl)) return x.youtubeUrl
      const t = (x.tracks || []).find(tr => getYoutubeEmbedUrl(tr.youtubeUrl))
      return t ? t.youtubeUrl : null
    }
    const tag = (arr, type, path) => arr.map(x => ({ ...x, _type: type, _path: path }))
    return [...tag(singles, 'single', 'singles'), ...tag(albums, 'album', 'albums')]
      .map(x => ({ ...x, _mvUrl: findMvUrl(x) }))
      .filter(x => x._mvUrl)
      .sort((a, b) => sortKey(b) - sortKey(a))
      .slice(0, 10)
  }, [singles, albums])

  // 合併所有作品，依發行日排序（最新在前）
  const allReleases = useMemo(() => {
    const tag = (arr, type, path) => arr.map(x => ({ ...x, _type: type, _path: path }))
    return [
      ...tag(singles, 'single', 'singles'),
      ...tag(albums, 'album', 'albums'),
      ...tag(videoWorks, 'video', 'video-works'),
    ].sort((a, b) => sortKey(b) - sortKey(a))
  }, [singles, albums, videoWorks])

  const featured = allReleases[0]
  // New Release 跳過第一筆（已顯示於 hero）
  const newReleases = allReleases.slice(1, 13)

  // 歷史上的這個月
  const today = useMemo(() => new Date(), [])
  const currentMonth = useMemo(() => today.getMonth() + 1, [today])
  const currentDay = useMemo(() => today.getDate(), [today])
  const monthName = today.toLocaleString('en', { month: 'long' })

  const historical = useMemo(() => {
    const tag = (arr, type, path) => arr.filter(x => x.month === currentMonth).map(x => ({ ...x, _type: type, _path: path }))
    return [...tag(singles, 'single', 'singles'), ...tag(albums, 'album', 'albums')]
      .sort((a, b) => (a.day || 0) - (b.day || 0) || (b.year || 0) - (a.year || 0))
  }, [singles, albums, currentMonth])

  // 藝人（依作品數排序）
  const dedupedArtists = useMemo(() => {
    const seen = new Map()
    for (const a of artists) {
      const key = a.name?.toLowerCase()
      if (!key) continue
      if (!seen.has(key)) seen.set(key, a)
      else { const e = seen.get(key); if (e.name === e.name.toLowerCase()) seen.set(key, a) }
    }
    return [...seen.values()]
  }, [artists])

  const artistStats = useMemo(() => {
    const s = {}
    singles.forEach(x => { if (x.artistName) { const k = x.artistName.toLowerCase(); s[k] = (s[k] || 0) + 1 } })
    albums.forEach(x => { if (x.artistName) { const k = x.artistName.toLowerCase(); s[k] = (s[k] || 0) + 1 } })
    return s
  }, [singles, albums])

  const pickupArtists = useMemo(() =>
    [...dedupedArtists]
      .filter(a => a.visualArtUrl)
      .sort((a, b) => (artistStats[b.name?.toLowerCase()] || 0) - (artistStats[a.name?.toLowerCase()] || 0))
      .slice(0, 9)
  , [dedupedArtists, artistStats])

  const loading = ls || la || lv || lar

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-20"><LoadingSpinner /></div>
  }

  return (
    <div>
      {/* ── Search strip ── */}
      <div className="border-b border-gray-100 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-center">
          <div className="w-full max-w-xl relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search titles, artists..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && keyword.trim()) { track('search', { search_term: keyword.trim() }); window.location.href = `#/search?q=${encodeURIComponent(keyword)}` } }}
              className="w-full pl-11 pr-4 py-2.5 rounded-full text-sm bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* ── FEATURED HERO (full-bleed) ── */}
      {featured && <FeaturedHero item={featured} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* ── NEW RELEASE ── */}
        {newReleases.length > 0 && (
          <section>
            <SectionHeading>New Release</SectionHeading>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-8 mt-8">
              {newReleases.map(item => <ReleaseCard key={`${item._type}-${item.id}`} item={item} />)}
            </div>
            <div className="flex justify-end mt-8">
              <Link to="/singles" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors" style={{ letterSpacing: '0.06em' }}>
                View all releases <ArrowRight size={15} />
              </Link>
            </div>
          </section>
        )}

        {/* ── PICKUP ARTISTS (full-bleed carousel) ── */}
        {pickupArtists.length > 0 && (
          <section className="mt-16 sm:mt-24">
            <SectionHeading>Pickup Artists</SectionHeading>
            <ArtistCarousel items={pickupArtists} />
          </section>
        )}

        {/* ── THIS MONTH IN HISTORY (horizontal carousel) ── */}
        {historical.length > 0 && (
          <section className="mt-16 sm:mt-24">
            <SectionHeading>Released in {monthName}</SectionHeading>
            <MonthlyCarousel items={historical} currentDay={currentDay} />
          </section>
        )}

        {/* ── LATEST MUSIC VIDEOS ── */}
        {recentMvs.length > 0 && (
          <section className="mt-16 sm:mt-24">
            <SectionHeading>Music Videos</SectionHeading>
            <MvCarousel items={recentMvs} onPlay={(url, item) => { track('mv_play', { content_title: item?.title, artist: item?.artistName }); setMvOpen(url) }} />
          </section>
        )}
      </div>

      {/* ── MV Lightbox ── */}
      {mvOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setMvOpen(null)}
        >
          <button
            onClick={() => setMvOpen(null)}
            aria-label="關閉"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
          <div className="w-full max-w-4xl aspect-video" onClick={e => e.stopPropagation()}>
            <iframe
              className="w-full h-full rounded-xl"
              src={mvOpen}
              title="Music Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  )
}

/* ── MV carousel (horizontal, click → lightbox, 含導覽列) ── */
function MvCarousel({ items, onPlay }) {
  const scrollerRef = useRef(null)
  const [playing, setPlaying] = useState(true)
  const [page, setPage] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  const handleScroll = () => {
    const el = scrollerRef.current
    if (!el || !el.clientWidth) return
    setPageCount(Math.max(1, Math.min(30, Math.round(el.scrollWidth / el.clientWidth))))
    setPage(Math.round(el.scrollLeft / el.clientWidth))
  }
  useEffect(() => { handleScroll() }, [items])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      const el = scrollerRef.current
      if (!el) return
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + el.clientWidth, behavior: 'smooth' })
    }, 3500)
    return () => clearInterval(id)
  }, [playing])

  const step = (dir) => {
    const el = scrollerRef.current
    if (!el) return
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8
    const atStart = el.scrollLeft <= 8
    if (dir > 0) el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + el.clientWidth, behavior: 'smooth' })
    else el.scrollTo({ left: atStart ? el.scrollWidth : el.scrollLeft - el.clientWidth, behavior: 'smooth' })
  }
  const goToPage = (p) => {
    const el = scrollerRef.current
    if (el) el.scrollTo({ left: p * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="mt-8">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {items.map(item => {
          const embed = getYoutubeEmbedUrl(item._mvUrl)
          return (
            <button
              key={`${item._type}-${item.id}`}
              onClick={() => onPlay(embed, item)}
              className="group snap-start shrink-0 w-56 sm:w-64 text-left"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center"><Music size={32} className="text-gray-300" /></div>}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <PlayCircle size={44} className="text-white/90 drop-shadow-lg" strokeWidth={1.5} />
                </div>
              </div>
              <div className="mt-3 px-0.5">
                <div className="text-sm text-gray-900 truncate group-hover:text-gray-500 transition-colors" style={{ fontWeight: 400 }}>{item.title}</div>
                <div className="text-xs text-gray-400 truncate mt-0.5">{item.artistName}</div>
              </div>
            </button>
          )
        })}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          {/* Mobile：左右箭頭 */}
          <div className="flex sm:hidden items-center gap-4">
            <button onClick={() => step(-1)} aria-label="上一個"
              className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 active:bg-gray-100 shadow-sm">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setPlaying(p => !p)} aria-label={playing ? '暫停' : '播放'}
              className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm">
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button onClick={() => step(1)} aria-label="下一個"
              className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 active:bg-gray-100 shadow-sm">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Desktop：分頁點 + 播放/暫停 */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2">
              {Array.from({ length: pageCount }).map((_, i) => (
                <button key={i} onClick={() => goToPage(i)} aria-label={`第 ${i + 1} 頁`}
                  className="rounded-full transition-all"
                  style={{ width: i === page ? 22 : 7, height: 7, background: i === page ? '#111827' : 'rgba(0,0,0,0.18)' }} />
              ))}
            </div>
            <button onClick={() => setPlaying(p => !p)} aria-label={playing ? '暫停' : '播放'}
              className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors shadow-sm ml-1">
              {playing ? <Pause size={13} /> : <Play size={13} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Section heading (large editorial) ── */
function SectionHeading({ children }) {
  return (
    <h2 className="text-3xl sm:text-5xl text-gray-900" style={{ fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
      {children}
    </h2>
  )
}

/* ── Monthly horizontal auto-play carousel ── */
function MonthlyCarousel({ items, currentDay }) {
  const scrollerRef = useRef(null)
  const [playing, setPlaying] = useState(true)
  const [page, setPage] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  // 依捲動位置更新分頁指示點
  const handleScroll = () => {
    const el = scrollerRef.current
    if (!el || !el.clientWidth) return
    const pc = Math.max(1, Math.min(30, Math.round(el.scrollWidth / el.clientWidth)))
    setPageCount(pc)
    setPage(Math.round(el.scrollLeft / el.clientWidth))
  }

  useEffect(() => { handleScroll() }, [items])

  // 自動輪播
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      const el = scrollerRef.current
      if (!el) return
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + el.clientWidth, behavior: 'smooth' })
    }, 3500)
    return () => clearInterval(id)
  }, [playing])

  const goToPage = (p) => {
    const el = scrollerRef.current
    if (el) el.scrollTo({ left: p * el.clientWidth, behavior: 'smooth' })
  }

  const step = (dir) => {
    const el = scrollerRef.current
    if (!el) return
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8
    const atStart = el.scrollLeft <= 8
    if (dir > 0) el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + el.clientWidth, behavior: 'smooth' })
    else el.scrollTo({ left: atStart ? el.scrollWidth : el.scrollLeft - el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="mt-8">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {items.map(item => (
          <div key={`${item._type}-${item.id}`} className="snap-start shrink-0 w-44 sm:w-52">
            <ReleaseCard item={item} isToday={item.day === currentDay} />
          </div>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          {/* Mobile：左右箭頭 */}
          <div className="flex sm:hidden items-center gap-4">
            <button onClick={() => step(-1)} aria-label="上一個"
              className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 active:bg-gray-100 shadow-sm">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setPlaying(p => !p)} aria-label={playing ? '暫停' : '播放'}
              className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm">
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button onClick={() => step(1)} aria-label="下一個"
              className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 active:bg-gray-100 shadow-sm">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Desktop：分頁點 + 播放/暫停 */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2">
              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i)}
                  aria-label={`第 ${i + 1} 頁`}
                  className="rounded-full transition-all"
                  style={{ width: i === page ? 22 : 7, height: 7, background: i === page ? '#111827' : 'rgba(0,0,0,0.18)' }}
                />
              ))}
            </div>
            <button
              onClick={() => setPlaying(p => !p)}
              aria-label={playing ? '暫停' : '播放'}
              className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors shadow-sm ml-1"
            >
              {playing ? <Pause size={13} /> : <Play size={13} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Featured hero (full-bleed, cover-tinted frosted background) ── */
function FeaturedHero({ item }) {
  const Icon = TYPE_ICON[item._type]
  return (
    <div className="relative w-full overflow-hidden">
      {/* Frosted cover background — colour adapts to the artwork */}
      {item.imageUrl ? (
        <>
          <div
            className="absolute inset-0"
            style={{ backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(60px) saturate(1.6)', transform: 'scale(1.2)' }}
          />
          <div className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, #fef3c7 0%, #fde2e4 45%, #e0e7ff 100%)' }} />
      )}

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          <Link to={`/${item._path}/${item.id}`} className="group block w-full">
            <CoverArt src={item.imageUrl} alt={item.title} icon={Icon} iconSize={72} rounded="rounded-2xl" aspect="aspect-[3/2]" />
          </Link>
          <div className="text-gray-900">
            <div className="text-3xl sm:text-5xl mb-4" style={{ fontWeight: 400, letterSpacing: '0.03em' }}>{item.artistName}</div>
            <div className="h-px bg-gray-900/15 mb-5" />
            <div className="text-xl sm:text-2xl mb-4" style={{ fontWeight: 400 }}>{item.title}</div>
            {item.notes && <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 mb-7 max-w-md">{item.notes}</p>}
            <Link to={`/${item._path}/${item.id}`}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full btn-primary transition-colors" style={{ letterSpacing: '0.08em' }}>
              View Details <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Release card (NEW RELEASE grid / carousel) ── */
function ReleaseCard({ item, isToday = false }) {
  const Icon = TYPE_ICON[item._type]
  return (
    <Link
      to={`/${item._path}/${item.id}`}
      className="group block"
      onClick={() => track('select_content', { content_type: item._type, item_id: item.id, content_title: item.title, artist: item.artistName })}
    >
      <div className="relative">
        <CoverArt src={item.imageUrl} alt={item.title} icon={Icon} iconSize={32} />
        {isToday && (
          <span className="absolute top-2 left-2 z-10 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white shadow" style={{ fontWeight: 500 }}>🎉 Today</span>
        )}
      </div>
      <div className="mt-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] text-gray-400 tabular-nums">{formatReleaseDate(item.year, item.month, item.day)}</span>
          <span className={`badge ${TYPE_BADGE[item._type]} !text-[10px] !px-1.5 !py-0`}>{TYPE_LABEL[item._type]}</span>
        </div>
        <div className="text-sm text-gray-900 leading-snug line-clamp-2 group-hover:text-gray-500 transition-colors" style={{ fontWeight: 400 }}>{item.title}</div>
        <div className="text-xs text-gray-400 truncate mt-0.5">{item.artistName}</div>
      </div>
    </Link>
  )
}

/* ── Artist carousel (full-bleed, 3:2 cards) ── */
function ArtistCarousel({ items }) {
  const scrollerRef = useRef(null)
  const [page, setPage] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  const handleScroll = () => {
    const el = scrollerRef.current
    if (!el || !el.clientWidth) return
    setPageCount(Math.max(1, Math.min(30, Math.round(el.scrollWidth / el.clientWidth))))
    setPage(Math.round(el.scrollLeft / el.clientWidth))
  }
  useEffect(() => { handleScroll() }, [items])

  const step = (dir) => {
    const el = scrollerRef.current
    if (!el) return
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8
    const atStart = el.scrollLeft <= 8
    if (dir > 0) el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + el.clientWidth, behavior: 'smooth' })
    else el.scrollTo({ left: atStart ? el.scrollWidth : el.scrollLeft - el.clientWidth, behavior: 'smooth' })
  }
  const goToPage = (p) => {
    const el = scrollerRef.current
    if (el) el.scrollTo({ left: p * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="mt-8 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex gap-4 sm:gap-6 overflow-x-auto px-4 sm:px-8 pb-2 snap-x scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {items.map(artist => (
          <Link
            key={artist.id}
            to={`/artists/${encodeURIComponent(artist.name)}`}
            className="group snap-start shrink-0 w-72 sm:w-[28rem]"
          >
            <div className="relative">
              <img src={artist.visualArtUrl} alt="" aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover rounded-2xl pointer-events-none"
                style={{ filter: 'blur(26px) saturate(1.5)', transform: 'translateY(9%) scale(0.92)', opacity: 0.5 }} />
              <div className="relative aspect-[3/2] rounded-2xl overflow-hidden bg-gray-100">
                <img src={artist.visualArtUrl} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-gray-900 group-hover:text-gray-500 transition-colors">
              <span className="text-base truncate" style={{ fontWeight: 400 }}>{artist.name}</span>
              <ArrowRight size={14} className="shrink-0 opacity-40" />
            </div>
          </Link>
        ))}
      </div>

      {/* Controls: < dots > */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button onClick={() => step(-1)} aria-label="上一個"
            className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors shadow-sm">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button key={i} onClick={() => goToPage(i)} aria-label={`第 ${i + 1} 頁`}
                className="rounded-full transition-all"
                style={{ width: i === page ? 22 : 7, height: 7, background: i === page ? '#111827' : 'rgba(0,0,0,0.18)' }} />
            ))}
          </div>
          <button onClick={() => step(1)} aria-label="下一個"
            className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors shadow-sm">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
