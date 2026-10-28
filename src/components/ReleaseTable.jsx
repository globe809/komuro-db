import { Link, useLocation } from 'react-router-dom'
import { formatReleaseDate } from '../utils/formatDate'
import { getAlbumTypeLabel, getSingleTypeLabel, getVideoTypeLabel } from '../utils/constants'

export default function ReleaseTable({ items, kind }) {
  const location = useLocation()
  const base = kind === 'video' ? '/video-works' : `/${kind}`
  const type = item => kind === 'albums' ? getAlbumTypeLabel(item.albumType) : kind === 'singles' ? getSingleTypeLabel(item.type) : [getVideoTypeLabel(item.videoType), ...(item.formats || (item.format ? [item.format] : []))].filter(Boolean).join(' / ')
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm text-left whitespace-nowrap">
        <caption className="sr-only">發行作品比較表</caption>
        <thead className="bg-gray-50 text-xs text-gray-500"><tr>
          {['發行日期', '作品名稱', '藝人', '類型／格式', '銷量（萬枚）', '曲目／內容'].map(label => <th key={label} scope="col" className="px-4 py-3 font-medium">{label}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {items.map(item => <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 text-gray-500">{formatReleaseDate(item.year, item.month, item.day)}</td>
            <th scope="row" className="px-4 py-3 font-normal"><Link className="text-gray-900 hover:underline whitespace-normal min-w-[12rem] block" to={`${base}/${item.id}`} state={{ fromList: location.pathname + location.search }}>{item.title || '未命名'}</Link></th>
            <td className="px-4 py-3 text-gray-500">{item.artistName || '—'}</td>
            <td className="px-4 py-3 text-gray-500">{type(item) || '—'}</td>
            <td className="px-4 py-3 text-gray-500">{item.salesRecord !== null && item.salesRecord !== undefined && item.salesRecord !== '' ? item.salesRecord : '—'}</td>
            <td className="px-4 py-3 text-gray-500">{(kind === 'video' ? item.contents : item.tracks)?.length || '—'}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  )
}
