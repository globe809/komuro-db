import { Routes, Route, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import Home from './pages/Home'
import Singles from './pages/Singles'
import SingleDetail from './pages/SingleDetail'
import Albums from './pages/Albums'
import AlbumDetail from './pages/AlbumDetail'
import VideoWorks from './pages/VideoWorks'
import VideoWorkDetail from './pages/VideoWorkDetail'

import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import ArtistsAdmin from './pages/admin/ArtistsAdmin'
import SinglesAdmin from './pages/admin/SinglesAdmin'
import AlbumsAdmin from './pages/admin/AlbumsAdmin'
import VideoWorksAdmin from './pages/admin/VideoWorksAdmin'

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* 前台公開頁面 */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/singles" element={<Singles />} />
        <Route path="/singles/:id" element={<SingleDetail />} />
        <Route path="/albums" element={<Albums />} />
        <Route path="/albums/:id" element={<AlbumDetail />} />
        <Route path="/video-works" element={<VideoWorks />} />
        <Route path="/video-works/:id" element={<VideoWorkDetail />} />
      </Route>

      {/* 後台管理頁面 */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="artists" element={<ArtistsAdmin />} />
        <Route path="singles" element={<SinglesAdmin />} />
        <Route path="albums" element={<AlbumsAdmin />} />
        <Route path="video-works" element={<VideoWorksAdmin />} />
      </Route>
    </Routes>
  )
}
