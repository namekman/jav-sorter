import { createServerFn } from '@tanstack/react-start'
import { fetchActresses } from '@/lib/actress-store'
import { getAllScans } from '@/lib/scan-repository'
import * as scanner from '@/lib/scanner'

export const listScans = createServerFn({ method: 'GET' }).handler(getAllScans)

export const listFiles = createServerFn({ method: 'GET' })
  .inputValidator((dir: string) => dir)
  .handler((req) => scanner.listDirectory(req))

export const scanFile = createServerFn({ method: 'GET' })
  .inputValidator((file: string) => file)
  .handler(async (req) => scanner.scanFile(req.data, await fetchActresses()))

export const scanDir = createServerFn({ method: 'GET' })
  .inputValidator((params: { dir: string; recursive?: boolean }) => params)
  .handler(async (req) =>
    scanner.scanDirectory(req.data.dir, await fetchActresses(), {
      recursive: req.data.recursive,
    }),
  )
