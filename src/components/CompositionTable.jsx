import { Link } from 'react-router-dom'
import { Music, Disc3 } from 'lucide-react'
import { formatReleaseDate } from '../utils/formatDate'

export const COMPOSITION_TYPES = [
  { value: 'single', label: '單曲', badge: 'badge-blue' },
  { value: 'album', label: '專輯曲', badge: 'badge-indigo' },
  { value: 'provided', label: '提供樂曲', badge: 'badge-gray' },
]

export default function CompositionTable({ songs, year }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-300" role="region" aria-label={`${year === 'unknown' ? '年份未詳' : year + ' 年'}作曲作品表格，可左右捲動`} tabIndex={0}>
      <table className="w-full min-w-[48rem] table-fixed text-left">
        <caption className="sr-only">{year === 'unknown' ? '年份未詳' : year + ' 年'}首次發行的作曲作品</caption>
        <colgroup><col style={{ width: '25%' }} /><col style={{ width: '18%' }} /><col style={{ width: '27%' }} /><col style={{ width: '18%' }} /><col style={{ width: '12%' }} /></colgroup>
        <thead className="border-b border-gray-100 bg-stone-50/60 text-xs text-gray-500">
          <tr>{['歌名', '演唱藝人', '首次收錄作品', '發行日期', '種別'].map(label => <th key={label} scope="col" className="px-3 py-3 font-normal">{label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {songs.map(song => {
            const type = COMPOSITION_TYPES.find(type => type.value === song.sourceType)
            return <tr key={song._key} className="align-top hover:bg-stone-50 transition-colors">
              <th scope="row" className="px-3 py-3.5 text-sm font-normal text-gray-900 whitespace-normal [overflow-wrap:anywhere]">{song.title}</th>
              <td className="px-3 py-3.5 text-sm text-gray-500 whitespace-normal [overflow-wrap:anywhere]">{song.artistName ? <Link to={`/artists/${encodeURIComponent(song.artistName)}`} className="hover:text-gray-700 hover:underline">{song.artistName}</Link> : '—'}</td>
              <td className="px-3 py-3.5 text-sm text-gray-500 whitespace-normal [overflow-wrap:anywhere]">{song.sourceId ? <Link to={`/${song.sourceType === 'single' ? 'singles' : 'albums'}/${song.sourceId}`} className="flex min-w-0 items-start gap-1.5 hover:text-gray-700 hover:underline">{song.sourceType === 'single' ? <Music size={12} className="mt-1 shrink-0 text-gray-400" /> : <Disc3 size={12} className="mt-1 shrink-0 text-gray-400" />}<span className="min-w-0">{song.sourceTitle || '—'}</span></Link> : song.sourceTitle || '—'}</td>
              <td className="px-3 py-3.5 text-xs text-gray-500 whitespace-nowrap">{formatReleaseDate(song.year, song.month, song.day)}</td>
              <td className="px-3 py-3.5"><span className={`badge whitespace-nowrap ${type?.badge || 'badge-gray'}`}>{type?.label || '其他'}</span></td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
  )
}
