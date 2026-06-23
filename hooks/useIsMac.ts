import { useSyncExternalStore } from "react"

const subscribe = () => () => {}
const getSnapshot = () => /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)
const getServerSnapshot = () => false

export function useIsMac() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
