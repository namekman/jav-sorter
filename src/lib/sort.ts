import { Media } from '@/model/Media'
import { createServerFn } from '@tanstack/react-start'
import { downloadAssets } from './downloader'
import { serializeToXml } from './serializer'
import fs from 'fs'
import path from 'path'
import { removeScan, updateScan } from './scan-repository'
import { ScanResult } from './scanner'

export const removeScanFn = createServerFn({ method: 'POST' })
  .inputValidator((params: string) => params)
  .handler(({ data }) => {
    removeScan(data)
  })

export const updateDraftFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (params: Pick<ScanResult, 'path' | 'currentMetadata'>) => params,
  )
  .handler(async (params) => {
    updateScan(params.data)
  })

export const sortFileFn = createServerFn({ method: 'POST' })
  .inputValidator((params: { media: Media; outDir: string }) => params)
  .handler(async (params) => {
    const dir = path.join(
      params.data.outDir,
      params.data.media.currentMetadata.id!,
    )
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
    await downloadAssets({
      metadata: params.data.media.currentMetadata,
      outDir: dir,
    })
    serializeToXml({ metadata: params.data.media.currentMetadata, outDir: dir })
    fs.renameSync(
      params.data.media.path,
      path.join(
        dir,
        `${params.data.media.currentMetadata.id!}${params.data.media.currentMetadata.part ? `-pt${params.data.media.currentMetadata.part}` : ''}${path.extname(params.data.media.path)}`,
      ),
    )
    removeScan(params.data.media.path)
  })
