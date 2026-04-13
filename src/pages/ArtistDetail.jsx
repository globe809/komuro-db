import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { ArrowLeft, Music, Disc3, Video, Mic2 } from 'lucide-react'
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

export default function ArtistDetail() {
  const { name } = useParams()
  const artistName = decodeURIComponent(name)
  const [singles, setSingles] = useState([])
  const [albums, setAlbums] = useState([])
  const [videoWorks, setVideoWorks] = useState([])
  const [providedSongs, setProvidedSongs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Remove orderBy to avoid composite index requirement; sort client-side
        const [s, a, v, p] = await Promise.all([
          getDocs(query(collection(db, 'singles'), where('artistName', '==', artistName))),
          getDocs(query(collection(db, 'albums'), where('artistName', '==', artistName))),
          getDocs(query(collection(db, 'videoWorks'), where('artistName', '==', artistName))),
          getDocs(query(collection(db, 'providedSongs'), where('artistName', '==', artistName))),
        ])

        const sortByYear = (docs) =>
          docs.map(d => ({ id: d.id, ...d.data() }))
              .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))

        setSingles(sortByYear(s.docs))
        setAlbums(sortByYear(a.docs))
        setVideoWorks(sortByYear(v.docs))
        setProvidedSongs(sortByYear(p.docs))
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/artists" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="text-xs text-gray-400">藝人</p>
          <h1 className="text-2xl font-bold text-gray-900">{artistName}</h1>
        </div>
        <div className="ml-auto flex flex-wrap gap-3 text-sm text-gray-500">
          {singles.length > 0 && <span>{singles.length} 單曲</span>}
          {albums.length > 0 && <span>{albums.length} 專輯</span>}
          {videoWorks.length > 0 && <span>{videoWorks.length} 影像</span>}
          {providedSongs.length > 0 && <span>{providedSongs.length} 提供樂曲</span>}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
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

          {/* 提供樂曲 */}
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
  )
}
