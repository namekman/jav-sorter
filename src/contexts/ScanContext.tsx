import type { ScanResult } from '@/lib/scanner'
import type { Metadata } from '@/model/Metadata'
import type { Task } from '@/ws'
import { findIndex, sortBy } from 'lodash-es'
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react'
import io from 'socket.io-client'
import { toast } from 'sonner'

type Status = { inProgress: boolean; type: 'sort' | 'scan'; key: string }

type ScanContextState = {
  scan: (path: string) => void
  update: (data: {
    path: string
    currentMetadata: Metadata
    reload?: boolean
  }) => void
  sort: (path: string) => void
  remove: (path: string) => void
  scans: ScanResult[]
  queue: { type: 'sort' | 'scan'; path: string }[]
}

const socket = io()

const ScanContext = createContext<ScanContextState>({
  scan: () => {},
  update: () => {},
  sort: () => {},
  remove: () => {},
  scans: [],
  queue: [],
})

export const useScanContext = () => useContext(ScanContext)

export const ScanContextProvider = ({ children }: PropsWithChildren) => {
  const [data, setData] = useState<ScanResult[]>([])
  const [tmpQueue, setTmpQueue] = useState<
    { type: 'sort' | 'scan'; path: string }[]
  >([])
  const [queue, setQueue] = useState<{ type: 'sort' | 'scan'; path: string }[]>(
    [],
  )
  useEffect(() => {
    socket.on('scans', (scans) => {
      setData(scans)
    })
    socket.on('new-scan', (scan) => {
      setData((data) =>
        sortBy([...data.filter((d) => d.path !== scan.path), scan], (s) =>
          s.path.toLowerCase(),
        ),
      )
    })
    socket.on('scan-removed', (scanPath) => {
      setData((data) => data.filter(({ path }) => path !== scanPath))
    })
    socket.on('queue', (queue: { type: 'sort' | 'scan'; path: string }[]) => {
      setQueue(queue)
    })
    socket.on('error', (error: { task: Task; error: Error }) => {
      toast.error(
        `${error.task.type}:${error.task.path} Failed (${error.error.message})`,
      )
    })
  }, [])

  const sendEvent = useCallback(
    (ev: { type: 'sort' | 'scan'; path: string }) => {
      socket.emit(ev.type, ev.path)
      setTmpQueue((q) => [...q, ev])
    },
    [setTmpQueue],
  )

  useEffect(() => {
    setTmpQueue([])
  }, [queue])

  const value: ScanContextState = useMemo(
    () => ({
      scans: data,
      queue: [...queue, ...tmpQueue],
      scan: (path) => sendEvent({ type: 'scan', path }),
      sort: (path) => sendEvent({ type: 'sort', path }),
      update: (params) => {
        const idx = findIndex(data, (d) => d.path === params.path)
        if (idx !== -1) {
          data[idx].currentMetadata = params.currentMetadata
          socket.emit('update', data[idx])
          setData((d) => [
            ...d.slice(0, idx),
            params.reload
              ? {
                  ...data[idx],
                }
              : data[idx],
            ...d.slice(idx + 1),
          ])
        }
      },
      remove: (path) => socket.emit('removed', path),
    }),
    [queue, data, sendEvent],
  )

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>
}
