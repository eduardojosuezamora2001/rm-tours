import { useSyncExternalStore } from 'react'

const query = '(max-width: 767px)'
const snapshot = () => window.matchMedia(query).matches
const serverSnapshot = () => false
const subscribe = (listener: () => void) => {
  const media = window.matchMedia(query)
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}

export function useMobileViewport() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot)
}
