import fs from 'fs'
import path from 'path'
import { downloadAssets } from './downloader'
import { serializeToXml } from './serializer'
import { removeScan } from './scan-repository'
import type { Media } from '@/model/Media'

export const sortFile = async (params: { media: Media; outDir: string }) => {
  const dir = path.join(params.outDir, params.media.currentMetadata.id!)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
  await downloadAssets({
    metadata: params.media.currentMetadata,
    outDir: dir,
  })
  serializeToXml({ metadata: params.media.currentMetadata, outDir: dir })

  return await new Promise<void>((resolve, reject) => {
    fs.copyFile(
      params.media.path,
      path.join(
        dir,
        `${params.media.currentMetadata.id!}${params.media.currentMetadata.part ? `-pt${params.media.currentMetadata.part}` : ''}${path.extname(params.media.path)}`,
      ),
      (err) => {
        if (err) {
          reject(err)
        } else {
          fs.rm(params.media.path, (err) => {
            if (err) {
              reject(err)
            } else {
              removeScan(params.media.path)
              resolve()
            }
          })
        }
      },
    )
  })
}
