import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { ArrowLeft, Music, Disc3, Video, Mic2, Users, Youtube } from 'lucide-react'
import SingleCard from '../components/SingleCard'
import AlbumCard from '../components/AlbumCard'
import VideoWorkCard from '../components/VideoWorkCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatReleaseDate } from '../utils/formatDate'
import { getProvidedSongKindLabel } from '../utils/constants'

function Section({ icon: Icon, title, count, children, color }) {
  if (count === 0) return null
  return (
    <section className="mb-10">
      <h2 className={`flex items-center gap-2 text-lg font-bold mb-4 ${color}`}>
        <Icon size={20} />
        {title}
        <span className="text-sm font-normal text-zinc-500 ml-1">（{count}）</span>
      </h2>
      {children}
    </section>
  )
}

const sortByDate = (items) =>
  [...items].sort((a, b) => {
    const ay = a.year ?? 0, by = b.year ?? 0
    const am = a.month ?? 0, bm = b.month ?? 0
    const ad = a.day ?? 0, bd = b.day ?? 0
    if (ay !== by) return by - ay
    if (am !== bm) return bm - am
    return bd - ad
  })

// Query a collection by artistName, covering all case variants (e.g. TRF / trf)
async function fetchByArtist(colName, artistName) {
  const variants = [...new Set([artistName, artistName.toLowerCase(), artistName.toUpperCase()])]
  const snaps = await Promise.all(
    variants.map(v => getDocs(query(collection(db, colName), where('artistName', '==', v))))
  )
  const seen = new Set()
  return snaps
    .flatMap(snap => snap.docs)
    .filter(d => { if (seen.has(d.id)) return false; seen.add(d.id); return true })
    .map(d => ({ id: d.id, ...d.data() }))
}

export default function ArtistDetail() {
  const { name } = useParams()
  const rawName = decodeURIComponent(name)
  const artistName = rawName.toLowerCase() === 'trf' ? 'TRF' : rawName

  const [artistInfo, setArtistInfo] = useState(null)
  const [singles, setSingles] = useState([])
  const [albums, setAlbums] = useState([])
  const [videoWorks, setVideoWorks] = useState([])
  const [providedSongs, setProvidedSongs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const artistSnap = await getDocs(query(collection(db, 'artists'), where('name', '==', artistName)))
        if (!artistSnap.empty) {
          setArtistInfo({ id: artistSnap.docs[0].id, ...artistSnap.docs[0].data() })
        }

        const [s, a, v, p] = await Promise.all([
          fetchByArtist('singles', artistName),
          fetchByArtist('albums', artistName),
          fetchByArtist('videoWorks', artistName),
          fetchByArtist('providedSongs', artistName),
        ])

        setSingles(sortByDate(s))
        setAlbums(sortByDate(a))
        setVideoWorks(sortByDate(v))
        setProvidedSongs(sortByDate(p))
      } catch (err) {
        console.error('ArtistDetail fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [artistName])

  // Group provided songs by sourceTitle, then sort within by discNo → trackNo
  const providedGroups = useMemo(() => {
    const groupMap = new Map()
    providedSongs.forEach(song => {
      const key = song.sourceTitle || ''
      if (!groupMap.has(key)) {
        groupMap.set(key, { sourceTitle: song.sourceTitle || '', imageUrl: '', songs: [] })
      }
      const group = groupMap.get(key)
      if (!group.imageUrl && song.imageUrl) group.imageUrl = song.imageUrl
      group.songs.push(song)
    })
    const groups = [...groupMap.values()]
    groups.forEach(group => {
      group.songs.sort((a, b) => {
        const da = a.discNo ?? 1, db = b.discNo ?? 1
        if (da !== db) return da - db
        const ta = a.trackNo ?? 999, tb = b.trackNo ?? 999
        return ta - tb
      })
    })
    return groups
  }, [providedSongs])

  const totalWorks = singles.length + albums.length + videoWorks.length

  return (
    <div>
      {/* ── Visual Art Header ── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: 'clamp(160px, 32vh, 400px)' }}
      >
        {artistInfo?.visualArtUrl ? (
          <>
            <img
              src={artistInfo.visualArtUrl}
              alt={artistName}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-indigo-950" />
        )}

        {/* Back button */}
        <Link
          to="/artists"
          className="absolute top-4 left-4 p-2 rounded-lg bg-black/30 hover:bg-black/50 text-white transition-colors backdrop-blur-sm"
        >
          <ArrowLeft size={18} />
        </Link>

        {/* Artist name overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
          <p className="text-xs text-white/60 mb-1">藝人</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">{artistName}</h1>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-white/70">
            {singles.length > 0 && <span>{singles.length} 單曲</span>}
            {albums.length > 0 && <span>{albums.length} 專輯</span>}
            {videoWorks.length > 0 && <span>{videoWorks.length} 影像</span>}
            {providedSongs.length > 0 && <span>{providedSongs.length} 提供樂曲</span>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? <LoadingSpinner /> : (
          <>
            {/* ── Bio ── */}
            {artistInfo?.bio && (
              <div className="mb-8 p-5 bg-zinc-900/50 rounded-xl border border-white/10">
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{artistInfo.bio}</p>
              </div>
            )}

            {/* ── Members ── */}
            {artistInfo?.members?.length > 0 && (
              <section className="mb-10">
                <h2 className="flex items-center gap-2 text-base font-bold text-zinc-300 mb-4">
                  <Users size={18} />
                  成員
                </h2>
                <div className="flex flex-wrap gap-4">
                  {artistInfo.members.map((member, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 w-20">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-700 ring-2 ring-white shadow-md">
                        {member.photoUrl
                          ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xl font-bold">
                              {member.name?.[0] || '?'}
                            </div>
                        }
                      </div>
                      <span className="text-xs text-center text-zinc-400 font-medium leading-snug">{member.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Works ── */}
            <Section icon={Disc3} title="專輯" count={albums.length} color="text-indigo-400">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {albums.map(a => <AlbumCard key={a.id} album={a} />)}
              </div>
            </Section>

            <Section icon={Music} title="單曲" count={singles.length} color="text-blue-400">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {singles.map(s => <SingleCard key={s.id} single={s} />)}
              </div>
            </Section>

            <Section icon={Video} title="影像作品" count={videoWorks.length} color="text-zinc-300">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {videoWorks.map(v => <VideoWorkCard key={v.id} work={v} />)}
              </div>
            </Section>

            {/* ── Provided Songs (grouped by sourceTitle) ── */}
            {providedSongs.length > 0 && (
              <section className="mb-10">
                <h2 className="flex items-center gap-2 text-lg font-bold mb-4 text-rose-700">
                  <Mic2 size={20} />
                  提供樂曲
                  <span className="text-sm font-normal text-zinc-500 ml-1">（{providedSongs.length}）</span>
                </h2>

                <div className="space-y-4">
                  {providedGroups.map((group, gi) => (
                    <div key={gi} className="bg-zinc-900 rounded-xl border border-white/10 shadow-sm overflow-hidden">
                      {/* Group header */}
                      {group.sourceTitle && (
                        <div className="flex items-center gap-4 px-4 py-3 bg-rose-900/20 border-b border-rose-100">
                          {group.imageUrl ? (
                            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 shadow-sm">
                              <img src={group.imageUrl} alt={group.sourceTitle} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                              <Disc3 size={24} className="text-rose-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-rose-400 mb-0.5">收錄作品</div>
                            <div className="text-base font-bold text-rose-800 truncate leading-snug">{group.sourceTitle}</div>
                            <div className="text-xs text-rose-400 mt-1">{group.songs.length} 首</div>
                          </div>
                        </div>
                      )}

                      {/* Songs in group */}
                      <div className="divide-y divide-white/5">
                        {group.songs.map((song, si) => (
                          <div key={song.id || si} className="px-4 py-3 flex items-start gap-3 hover:bg-zinc-900/50">
                            {/* Show image if no group header (songs without sourceTitle) */}
                            {!group.sourceTitle && song.imageUrl && (
                              <div className="w-8 h-8 rounded overflow-hidden shrink-0 mt-0.5">
                                <img src={song.imageUrl} alt={song.title} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-zinc-100">{song.title}</span>
                                {song.kind && (
                                  <span className="text-xs bg-rose-900/20 text-rose-500 px-1.5 py-0.5 rounded">
                                    {getProvidedSongKindLabel(song.kind)}
                                  </span>
                                )}
                                {song.discNo && <span className="text-xs text-zinc-500">D{song.discNo}</span>}
                                {song.trackNo && <span className="text-xs text-zinc-500">#{song.trackNo}</span>}
                                {song.youtubeUrl && (
                                  <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-400 rounded-full text-xs font-medium hover:bg-red-200 transition-colors">
                                    <Youtube size={11} /> MV
                                  </a>
                                )}
                              </div>
                              <div className="text-xs text-zinc-500 mt-0.5 flex flex-wrap gap-x-3">
                                {song.lyrics && <span>作詞：{song.lyrics}</span>}
                                {song.composition && <span>作曲：{song.composition}</span>}
                                {song.arrangement && <span>編曲：{song.arrangement}</span>}
                              </div>
                            </div>
                            <div className="text-xs text-zinc-500 shrink-0 pt-0.5">
                              {formatReleaseDate(song.year, song.month, song.day)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {totalWorks === 0 && providedSongs.length === 0 && (
              <div className="text-center py-16 text-zinc-500">
                <p>此藝人尚無作品資料</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
