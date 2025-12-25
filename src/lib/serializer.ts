import { Metadata } from '@/model/Metadata'
import { createServerOnlyFn } from '@tanstack/react-start'
import fs from 'fs'
import { compact, uniq } from 'lodash-es'
import path from 'path'
import { create } from 'xmlbuilder2'

export const serializeToXml = createServerOnlyFn(
  ({ metadata, outDir }: { metadata: Metadata; outDir: string }) => {
    const doc = create({
      movie: {
        title: metadata.id,
        originalTitle: metadata.title,
        id: metadata.id,
        premiered: metadata.releaseDate
          ? new Date(metadata.releaseDate).toLocaleDateString('en-CA')
          : '',
        year: metadata.releaseDate
          ? new Date(metadata.releaseDate).getFullYear()
          : '',
        director: metadata.director,
        studio: metadata.maker,
        rating: metadata.rating,
        votes: metadata.votes,
        plot: metadata.description,
        runtime: metadata.runTime,
        trailer: metadata.trailer,
        mpaa: 'XXX',
        tagline: '',
        set: '',
        tag: uniq(
          compact([
            ...(metadata.tags ?? []),
            ...(metadata.actors ?? []).map((a) => a.enName),
            metadata.series,
            metadata.maker,
            metadata.label,
          ]),
        ),
        thumb: metadata.cover,
        genre: metadata.genres,
        actor: metadata.actors?.map((actor) => ({
          name: actor.enName,
          altname: actor.jpName,
          role: actor.jpName,
          thumb: actor.thumbnail,
        })),
      },
    })

    const xml = doc.end({ prettyPrint: true })
    fs.writeFileSync(path.join(outDir, `${metadata.id}.nfo`), xml)
  },
)
