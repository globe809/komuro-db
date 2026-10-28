import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, ChevronLeft, List, Grid, Table } from 'lucide-react'
import { groupReleases } from '../utils/groupReleases'
import { useLocation } from 'react-router-dom'
import useBrowseState from '../hooks/useBrowseState'
import { readBrowseState, writeBrowseState } from '../utils/browseStorage'
import ReleaseTable from './ReleaseTable'

export default function YearTimeline({ items, renderItem, direction = 'desc', kind }) {
  const location = useLocation()
  const storageKey = location.pathname
  const positionKey = `position:${location.pathname}${location.search}`
  const [open, setOpen] = useBrowseState(`timeline:${storageKey}`, true)
  const [mode, setMode] = useBrowseState(`view:${storageKey}`, 'cards')
  const [collapsed, setCollapsed] = useBrowseState(`collapsed:${storageKey}`, {})
  const [activeYear, setActiveYear] = useState('')
  const sections = useRef(new Map())
  const groups = useMemo(() => groupReleases(items, direction), [items, direction])

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      let current = groups[0]?.year || ''
      for (const group of groups) {
        const node = sections.current.get(group.year)
        if (node && node.getBoundingClientRect().top <= 160) current = group.year
      }
      setActiveYear(current)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [groups])

  useEffect(() => {
    let cancelled = false
    let restored = false
    const saved = readBrowseState(positionKey, 0)
    const frame = requestAnimationFrame(() => {
      if (cancelled) return
      window.scrollTo(0, Number(saved) || 0)
      restored = true
    })
    const save = () => { if (restored) writeBrowseState(positionKey, window.scrollY) }
    window.addEventListener('scroll', save, { passive: true })
    window.addEventListener('pagehide', save)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', save)
      window.removeEventListener('pagehide', save)
    }
  }, [positionKey])

  const jumpToYear = (year) => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setCollapsed(previous => ({ ...previous, [year]: false }))
    requestAnimationFrame(() => sections.current.get(year)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }))
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white" role="group" aria-label="清單檢視方式">
          {[['cards', '卡片', Grid], ['table', '表格', Table]].map(([value, label, Icon]) => (
            <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs ${mode === value ? 'control-selected' : 'text-gray-500 hover:bg-gray-50'}`}><Icon size={14} />{label}</button>
          ))}
        </div>
        <div className="flex gap-3 text-xs text-gray-500">
          <button type="button" onClick={() => setCollapsed({})} className="hover:text-gray-900">全部展開</button>
          <button type="button" onClick={() => setCollapsed(Object.fromEntries(groups.map(group => [group.year, true])))} className="hover:text-gray-900">全部收合</button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
      <aside className={`w-full md:sticky md:top-24 shrink-0 ${open ? 'md:w-36' : 'md:w-12'}`} aria-label="發行年份時間軸">
        <button
          type="button"
          onClick={() => setOpen(value => !value)}
          aria-expanded={open}
          aria-label={open ? '收合年份時間軸' : '展開年份時間軸'}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 rounded-lg border border-gray-200 bg-white px-3 py-2 transition-colors"
        >
          <List size={15} aria-hidden="true" />
          <span className={open ? '' : 'md:hidden'}>年份時間軸</span>
          {open && <ChevronLeft size={13} aria-hidden="true" />}
        </button>
        {open && (
          <nav aria-label="跳至發行年份" className="mt-4 max-h-48 md:max-h-[calc(100vh-13rem)] overflow-y-auto overscroll-contain pr-2">
            <ol className="ml-2 border-l border-gray-200">
              {groups.map(({ year, releases }) => (
                <li key={year} className="relative">
                  <button
                    type="button"
                    onClick={() => jumpToYear(year)}
                    aria-current={activeYear === year ? 'location' : undefined}
                    className={`relative flex w-full items-center justify-between gap-3 py-2 pl-5 pr-2 text-sm rounded-r-lg transition-colors ${activeYear === year ? 'control-selected' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-800'}`}
                  >
                    <span aria-hidden="true" className={`absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${activeYear === year ? 'bg-stone-400' : 'bg-gray-300'}`} />
                    <span>{year === 'unknown' ? '年份未詳' : year}</span>
                    <span className="text-xs text-gray-400">{releases.length}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </aside>
      <div className="min-w-0 flex-1 w-full space-y-10">
        {groups.map(({ year, releases }) => (
          <section
            key={year}
            ref={node => { if (node) sections.current.set(year, node); else sections.current.delete(year) }}
            aria-label={year === 'unknown' ? '年份未詳的作品' : `${year} 年發行作品`}
            className="scroll-mt-24"
          >
            <div className="flex items-baseline gap-3 border-b border-gray-200 pb-3 mb-5">
              <h2 className="text-2xl text-gray-800" style={{ fontWeight: 300, letterSpacing: '0.04em' }}>
                <button type="button" aria-expanded={!collapsed[year]} onClick={() => setCollapsed(previous => ({ ...previous, [year]: !previous[year] }))} className="flex items-center gap-2" aria-label={`${collapsed[year] ? '展開' : '收合'} ${year === 'unknown' ? '年份未詳' : year + ' 年'}作品`}>
                  {year === 'unknown' ? '年份未詳' : year}{collapsed[year] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </h2>
              <span className="text-xs text-gray-400">{releases.length} 筆</span>
            </div>
            {!collapsed[year] && (mode === 'table' ? <ReleaseTable items={releases} kind={kind} /> : <div className={`grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-[30px] ${open ? 'lg:grid-cols-4 xl:grid-cols-5' : 'md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'}`}>
              {releases.map(renderItem)}
            </div>)}
          </section>
        ))}
      </div>
      </div>
    </div>
  )
}
