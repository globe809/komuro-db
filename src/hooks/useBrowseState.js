import { useState } from 'react'
import { readBrowseState, writeBrowseState } from '../utils/browseStorage'
export default function useBrowseState(key, fallback) {
  const [value, setValue] = useState(() => readBrowseState(key, fallback))
  const update = next => setValue(previous => {
    const result = typeof next === 'function' ? next(previous) : next
    writeBrowseState(key, result)
    return result
  })
  return [value, update]
}
