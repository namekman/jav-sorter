import path from 'node:path'
import fs from 'node:fs'
import axios from 'redaxios'
import sharp from 'sharp'
import type { Metadata } from '@/model/Metadata'

sharp.cache(false)

const writeImage = ({ url, filePath }: { url: string; filePath: string }) =>
  axios
    .get(url, {
      responseType: 'stream',
    })
    .then((response) => new Response(response.data).arrayBuffer())
    .then((buffer) => Buffer.from(buffer))
    .then((buffer) => sharp(buffer))
    .then((image) => image.toFormat('jpg').toFile(filePath))

export const downloadAssets = async ({
  metadata,
  outDir,
}: {
  metadata: Metadata
  outDir: string
}) => {
  // cover
  if (metadata.cover) {
    const fanart = path.join(outDir, 'fanart.jpg')
    const folder = path.join(outDir, 'folder.jpg')
    await writeImage({ url: metadata.cover, filePath: fanart })
    const image = sharp(fanart)
    const { width, height } = await image.metadata()
    if (width > height * 1.3) {
      const croppedImage = image.extract({
        left: Math.round(width / 1.895734597),
        top: 0,
        width: Math.round(width - width / 1.895734597),
        height,
      })
      croppedImage.end()
      await croppedImage.toFile(folder)
    } else {
      fs.copyFileSync(fanart, folder)
    }
    image.end()
  }
  if (metadata.actors?.length) {
    const actors = metadata.actors.filter(
      (actor) => actor.enName && actor.thumbnail,
    )
    if (actors.length) {
      const baseDir = path.join(outDir, '.actors')
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir)
      }
      await Promise.all(
        actors.map((actor) =>
          writeImage({
            url: actor.thumbnail!,
            filePath: path.join(
              baseDir,
              `${actor.enName
                .split(' ')
                .map(
                  (p) =>
                    p.charAt(0).toLocaleUpperCase() +
                    p.slice(1).toLocaleLowerCase(),
                )
                .join('_')}.jpg`,
            ),
          }).catch(),
        ),
      )
    }
  }
  if (metadata.screenshots) {
    const baseDir = path.join(outDir, 'extrafanart')
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir)
    }
    await Promise.all(
      metadata.screenshots.map((url, idx) =>
        writeImage({
          url,
          filePath: path.join(baseDir, `fanart${idx + 1}.jpg`),
        }),
      ),
    )
  }
}
