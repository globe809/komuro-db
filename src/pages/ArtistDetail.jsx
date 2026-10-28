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

function Section({ title, count, children }) {
  if (count === 0) return null
  return (
    <section className="mb-12">
      <h2 className="text-xl sm:text-2xl text-gray-900 mb-5" style={{ fontWeight: 300, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {title}
        <span className="text-sm text-gray-400 ml-3" style={{ letterSpacing: 0 }}>{count}</span>
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
        style={{ height: 'clamp(320px, 64vh, 800px)' }}
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
          <p className="text-xs text-white/60 mb-1" style={{ letterSpacing: '0.1em' }}>ARTIST</p>
          <h1 className="text-2xl sm:text-4xl text-white drop-shadow-lg" style={{ fontWeight: 400 }}>{artistName}</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-white/75">
            {singles.length > 0 && <span>{singles.length} Singles</span>}
            {albums.length > 0 && <span>{albums.length} Albums</span>}
            {videoWorks.length > 0 && <span>{videoWorks.length} Video</span>}
            {providedSongs.length > 0 && <span>{providedSongs.length} Provided</span>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? <LoadingSpinner /> : (
          <>
            {/* ── Bio（無框） ── */}
            {artistInfo?.bio && (
              <div className="mb-10 max-w-3xl">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{artistInfo.bio}</p>
              </div>
            )}

            {/* ── Members ── */}
            {artistInfo?.members?.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xl sm:text-2xl text-gray-900 mb-5" style={{ fontWeight: 300, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Members</h2>
                <div className="flex flex-wrap gap-6">
                  {artistInfo.members.map((member, i) => (
                    <div key={i} className="flex flex-col items-center gap-2.5 w-36">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 ring-2 ring-white shadow-md">
                        {member.photoUrl
                          ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                              {member.name?.[0] || '?'}
                            </div>
                        }
                      </div>
                      <span className="text-sm text-center text-gray-600 leading-snug">{member.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Works ── */}
            <Section title="Albums" count={albums.length}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-[30px]">
                {albums.map(a => <AlbumCard key={a.id} album={a} />)}
              </div>
            </Section>

            <Section title="Singles" count={singles.length}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-[30px]">
                {singles.map(s => <SingleCard key={s.id} single={s} />)}
              </div>
            </Section>

            <Section title="Video Works" count={videoWorks.length}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-[30px]">
                {videoWorks.map(v => <VideoWorkCard key={v.id} work={v} />)}
              </div>
            </Section>

            {/* ── Provided Songs (grouped by sourceTitle) ── */}
            {providedSongs.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xl sm:text-2xl text-gray-900 mb-5" style={{ fontWeight: 300, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Provided Songs
                  <span className="text-sm text-gray-400 ml-3" style={{ letterSpacing: 0 }}>{providedSongs.length}</span>
                </h2>

                <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-100" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.07)' }}>
                  {providedSongs.map((song, si) => (
                    <div key={song.id || si} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="w-11 h-11 rounded overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                        {song.imageUrl
                          ? <img src={song.imageUrl} alt={song.title} className="w-full h-full object-cover" />
                          : <Mic2 size={16} className="text-gray-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-gray-900">{song.title}</span>
                          {song.kind && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              {getProvidedSongKindLabel(song.kind)}
                            </span>
                          )}
                          {song.youtubeUrl && (
                            <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-500">
                              <Youtube size={12} /> MV
                            </a>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 truncate mt-0.5">
                          {song.sourceTitle}
                          {song.composition && <span className="text-gray-300"> · 作曲：{song.composition}</span>}
                        </div>
                      </div>
                      <div className="text-xs text-gray-300 shrink-0 whitespace-nowrap">
                        {formatReleaseDate(song.year, song.month, song.day)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {totalWorks === 0 && providedSongs.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p>此藝人尚無作品資料</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
