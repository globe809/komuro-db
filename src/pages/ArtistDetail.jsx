import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { ArrowLeft, Music, Disc3, Video } from 'lucide-react'
import SingleCard from '../components/SingleCard'
import AlbumCard from '../components/AlbumCard'
import VideoWorkCard from '../components/VideoWorkCard'
import LoadingSpinner from '../components/LoadingSpinner'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      const [s, a, v] = await Promise.all([
        getDocs(query(collection(db, 'singles'), where('artistName', '==', artistName), orderBy('year', 'desc'))),
        getDocs(query(collection(db, 'albums'), where('artistName', '==', artistName), orderBy('year', 'desc'))),
        getDocs(query(collection(db, 'videoWorks'), where('artistName', '==', artistName), orderBy('year', 'desc'))),
      ])
      setSingles(s.docs.map(d => ({ id: d.id, ...d.data() })))
      setAlbums(a.docs.map(d => ({ id: d.id, ...d.data() })))
      setVideoWorks(v.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }
    fetchAll()
  }, [artistName])

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
        <div className="ml-auto flex gap-3 text-sm text-gray-500">
          {singles.length > 0 && <span>{singles.length} 單曲</span>}
          {albums.length > 0 && <span>{albums.length} 專輯</span>}
          {videoWorks.length > 0 && <span>{videoWorks.length} 影像</span>}
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

          {singles.length === 0 && albums.length === 0 && videoWorks.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p>此藝人尚無作品資料</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
