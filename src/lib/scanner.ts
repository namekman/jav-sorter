import path from 'node:path'
import fs from 'node:fs'
import { compact, mergeWith, sortBy, uniq, uniqBy } from 'lodash-es'
import { createServerFn } from '@tanstack/react-start'
import { searchActress } from './actress-store'
import { saveScan } from './scan-repository'
import type { Media } from '@/model/Media'
import type { Metadata } from '@/model/Metadata'
import type { Actor } from '@/model/Actor'
import { fc2Providers, providers } from '@/providers/repository'

const extensions = ['.mp4', '.mkv', '.avi', '.wmv']

export type ScanResult = {
  path: string
  metadatas: {
    sourceProvider: string
    metadata: Metadata
  }[]
  currentMetadata: Metadata
}

export const getId = (filePath: string) => {
  const fileName = path.basename(filePath)
  const name = fileName.slice(0, fileName.lastIndexOf('.')).toLocaleUpperCase()
  if (/^(.*)[A-Z]$/.exec(name)) {
    return name.slice(0, -1)
  }
  return name.toLocaleUpperCase()
}

export const mergeMetadata = (metadatas: { metadata: Metadata }[]) => {
  return mergeWith(
    {},
    ...metadatas.map((m) => m.metadata),
    (objValue: unknown, srcValue: unknown, key: string) => {
      if (typeof srcValue === 'number' && isNaN(srcValue)) {
        return objValue
      }
      if (
        key === 'cover' &&
        typeof srcValue === 'string' &&
        typeof objValue === 'string'
      ) {
        return objValue.includes('_cover.jpg') ? srcValue : objValue
      }
      if (Array.isArray(srcValue) || Array.isArray(objValue)) {
        return uniq([
          ...((srcValue ?? []) as Array<unknown>),
          ...((objValue ?? []) as Array<unknown>),
        ])
      }
      if (
        key === 'id' &&
        typeof srcValue === 'string' &&
        typeof objValue === 'string'
      ) {
        return srcValue.length > objValue.length ? srcValue : objValue
      }
    },
  )
}

export const complementActresses = async (
  metadata: Metadata | undefined,
  actresses: Actor[],
) =>
  metadata && {
    ...metadata,
    actors: uniqBy(
      await Promise.all(
        metadata.actors
          ?.filter((actor) => !actor.jpName.startsWith('—'))
          .map(
            async (actor) => (await searchActress(actor, actresses)) ?? actor,
          ) ?? [],
      ),
      'jpName',
    ),
  }

export const scanFile = async (filePath: string, actresses: Actor[]) => {
  const id = getId(filePath)
  const isFC2 = id.startsWith('FC2')

  const candidates = compact(
    (
      await Promise.all(
        (isFC2 ? fc2Providers : providers).flatMap((p) =>
          p
            .getCandidates(id)
            .then((list) =>
              Promise.allSettled(
                list.urls
                  .slice(0, 5)
                  .map((c) =>
                    p
                      .getMetadata(c)
                      .then((m) => (list.part ? { ...m, part: list.part } : m)),
                  ),
              ).then((result) =>
                result
                  .filter((s) => s.status === 'fulfilled')
                  .map(({ value }) => value),
              ),
            ),
        ),
      )
    ).flat(),
  )

  const actressList = compact(
    uniqBy(
      candidates.flatMap((c) => c.actors),
      'jpName',
    ),
  )
  const metadatas = await Promise.all(
    candidates
      .map((c, idx) =>
        idx ? { ...c, actors: [] } : { ...c, actors: actressList },
      )
      .map(
        async (metadata) =>
          ({
            metadata: await complementActresses(metadata, actresses),
          }) as Media['metadatas'][number],
      ),
  )
  const scanResult = {
    path: filePath,
    currentMetadata: { id, ...mergeMetadata([...metadatas]) },
    metadatas,
  } as ScanResult
  saveScan(scanResult)

  return scanResult
}

export const scanDirectory = (
  dir: string,
  actresses: Actor[],
  opts?: { recursive?: boolean },
) => {
  const files = fs
    .readdirSync(dir, { withFileTypes: true, recursive: opts?.recursive })
    .filter(
      (file) => file.isFile() && extensions.includes(path.extname(file.name)),
    )

  return files.map((file) =>
    scanFile(path.join(file.parentPath, file.name), actresses),
  )
}

export const listDirectory = createServerFn({ method: 'GET' })
  .inputValidator((dir: string) => dir)
  .handler(({ data: dir }) =>
    sortBy(
      fs.readdirSync(dir, { withFileTypes: true }).map((file) => ({
        name: file.name,
        type: file.isDirectory() ? ('dir' as const) : ('file' as const),
        path: path.join(file.parentPath, file.name),
      })),
      (f) => f.path.toLocaleLowerCase(),
    ).filter((file) => extensions.includes(path.extname(file.name))),
  )
