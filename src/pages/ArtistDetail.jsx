import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { ArrowLeft, Music, Disc3, Video, Mic2, Users } from 'lucide-react'
import SingleCard from '../components/SingleCard'
import AlbumCard from '../components/AlbumCard'
import VideoWorkCard from '../components/VideoWorkCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatReleaseDate } from '../utils/formatDate'

const KIND_LABEL = { album: '專輯曲', single: '單曲', coupling: 'C/W', other: '其他' }
const KIND_COLOR = { album: 'badge-blue', single: 'badge-green', coupling: 'badge-gray', other: 'badge-gray' }

function Section({ icon: Icon, title, count, children, color }) {
  if (count === 0) return null
  return (
    <section className="mb-10">
      <h2 className={`flex items-center gap-2 text-lg font-bold mb-4 ${color}`}>
        <Icon size={20} />
        {title}
        <span className="text-sm font-normal text-gray-400 ml-1">（{count}）</span>
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
// to avoid Firestore case-sensitive mismatch
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
  // Normalize known case variants (e.g. trf → TRF)
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
        // Fetch artist info separately (artists collection uses 'name' field)
        const artistSnap = await getDocs(query(collection(db, 'artists'), where('name', '==', artistName)))
        if (!artistSnap.empty) {
          setArtistInfo({ id: artistSnap.docs[0].id, ...artistSnap.docs[0].data() })
        }

        // Fetch works — cover all case variants so TRF/trf both match
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

  const totalWorks = singles.length + albums.length + videoWorks.length

  return (
    <div>
      {/* ── Visual Art Header ── */}
      <div className={`relative w-full ${artistInfo?.visualArtUrl ? 'h-56 sm:h-72' : 'h-32 bg-gradient-to-br from-blue-900 to-indigo-950'}`}>
        {artistInfo?.visualArtUrl ? (
          <>
            <img
              src={artistInfo.visualArtUrl}
              alt={artistName}
              className="w-full h-full object-cover"
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
              <div className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{artistInfo.bio}</p>
              </div>
            )}

            {/* ── Members ── */}
            {artistInfo?.members?.length > 0 && (
              <section className="mb-10">
                <h2 className="flex items-center gap-2 text-base font-bold text-gray-700 mb-4">
                  <Users size={18} />
                  成員
                </h2>
                <div className="flex flex-wrap gap-4">
                  {artistInfo.members.map((member, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 w-20">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 ring-2 ring-white shadow-md">
                        {member.photoUrl
                          ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold">
                              {member.name?.[0] || '?'}
                            </div>
                        }
                      </div>
                      <span className="text-xs text-center text-gray-600 font-medium leading-snug">{member.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Works ── */}
            <Section icon={Disc3} title="專輯" count={albums.length} color="text-indigo-700">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {albums.map(a => <AlbumCard key={a.id} album={a} />)}
              </div>
            </Section>

            <Section icon={Music} title="單曲" count={singles.length} color="text-blue-800">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {singles.map(s => <SingleCard key={s.id} single={s} />)}
              </div>
            </Section>

            <Section icon={Video} title="影像作品" count={videoWorks.length} color="text-gray-700">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {videoWorks.map(v => <VideoWorkCard key={v.id} work={v} />)}
              </div>
            </Section>

            {/* ── Provided Songs ── */}
            {providedSongs.length > 0 && (
              <section className="mb-10">
                <h2 className="flex items-center gap-2 text-lg font-bold mb-4 text-rose-700">
                  <Mic2 size={20} />
                  提供樂曲
                  <span className="text-sm font-normal text-gray-400 ml-1">（{providedSongs.length}）</span>
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-50">
                  {providedSongs.map((song, i) => (
                    <div key={song.id || i} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
                      <span className="text-gray-300 text-xs font-mono w-6 shrink-0 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{song.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-x-3">
                          {song.lyrics && <span>作詞：{song.lyrics}</span>}
                          {song.composition && <span>作曲：{song.composition}</span>}
                          {song.arrangement && <span>編曲：{song.arrangement}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {song.year && <span className="text-xs text-gray-400">{formatReleaseDate(song.year, song.month, song.day)}</span>}
                        <span className={`badge text-xs ${KIND_COLOR[song.kind] || 'badge-gray'}`}>
                          {KIND_LABEL[song.kind] || song.kind}
                        </span>
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
