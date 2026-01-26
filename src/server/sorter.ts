import { createServerFn } from '@tanstack/react-start'
import { fetchActresses } from '@/lib/actress-store'
import { getAllScans, removeScan, updateScan } from '@/lib/scan-repository'
import * as scanner from '@/lib/scanner'
import { Media } from '@/model/Media'
import { sortFile } from '@/lib/sort'

export const listScans = createServerFn({ method: 'GET' }).handler(getAllScans)

export const listFiles = createServerFn({ method: 'GET' })
  .inputValidator((dir: string) => dir)
  .handler(({ data }) => scanner.listDirectory(data))

export const scanFile = createServerFn({ method: 'GET' })
  .inputValidator((file: string) => file)
  .handler(async ({ data }) => scanner.scanFile(data, await fetchActresses()))

export const scanDir = createServerFn({ method: 'GET' })
  .inputValidator((params: { dir: string; recursive?: boolean }) => params)
  .handler(async ({ data }) =>
    scanner.scanDirectory(data.dir, await fetchActresses(), {
      recursive: data.recursive,
    }),
  )

export const removeScanFn = createServerFn({ method: 'POST' })
  .inputValidator((params: string) => params)
  .handler(({ data }) => {
    removeScan(data)
  })

export const updateDraftFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (params: Pick<scanner.ScanResult, 'path' | 'currentMetadata'>) => params,
  )
  .handler(({ data }) => {
    updateScan(data)
  })

export const sortFileFn = createServerFn({ method: 'POST' })
  .inputValidator((params: { media: Media; outDir: string }) => params)
  .handler(async ({ data }) => {
    sortFile(data)
  })
