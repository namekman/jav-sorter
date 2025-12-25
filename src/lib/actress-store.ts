import { Actor } from '@/model/Actor'
import { actressProviders } from '@/providers/repository'
import { createServerFn } from '@tanstack/react-start'
import { Store } from '@tanstack/store'
import * as csv from 'csv'
import fs from 'fs'
import { compact, mergeWith, uniq, uniqBy } from 'lodash-es'

export const actressStore = new Store<Actor[]>([])

export const searchSelector = (query: string) => (actors: Actor[]) => {
  // search aliases
  const actor = actors.find(
    ({ aliases }) =>
      aliases?.length && aliases.some((alias) => alias === query),
  )
  if (actor) {
    return [actor]
  }
  return actors.filter(
    ({ jpName, enName }) => jpName === query || enName === query,
  )
}

export const fuzzyActressSearch = (query: string, actors: Actor[]) =>
  actors.filter(
    (actor) =>
      actor.enName.includes(query) ||
      actor.jpName.includes(query) ||
      actor.aliases?.some((alias) => alias.includes(query)),
  )

export const searchActress = async (
  actor: Partial<Actor>,
  actors?: Actor[],
) => {
  if (!actors) {
    actors = await fetchActresses()
  }
  if (!actor || /[0-9？]/.test(actor.jpName ?? '')) {
    return
  }
  if (actor.jpName?.includes('（')) {
    actor.jpName = actor.jpName.split('（')?.[0]
  }
  let result: Actor | undefined
  if (actor.jpName) {
    result = searchSelector(actor.jpName)(actors)[0]
  }
  if (!result && actor.enName) {
    result = searchSelector(actor.enName)(actors)[0]
  }
  if (!result) {
    const infos = compact(
      (
        await Promise.allSettled(
          actressProviders.map((provider) => provider.getInfo(actor)),
        )
      )
        .filter((a) => a.status === 'fulfilled')
        .map((a) => a.value),
    )
    if (infos.length) {
      const actress = mergeWith(
        {},
        ...infos,
        (objValue: unknown, srcValue: unknown) => {
          if (Array.isArray(srcValue) || Array.isArray(objValue)) {
            return uniq([
              ...((srcValue ?? []) as Array<unknown>),
              ...((objValue ?? []) as Array<unknown>),
            ])
          }
        },
      )
      result = syncRepository(actress, actors)
    }
  }

  return result
}

export const saveActors = (actors: Actor[]) => {
  const list = uniqBy([...actors].sort(), 'jpName').map((actor) => [
    actor.enName,
    actor.enName?.split(' ').slice(0, -1).join(' ') ?? '',
    actor.enName?.split(' ').slice(-1)[0] ?? '',
    actor.jpName,
    actor.thumbnail,
    actor.aliases?.join('|') ?? '',
  ])
  fs.writeFileSync(
    './jvThumbs.csv',
    list.map((row) => row.join(',')).join('\n'),
  )
}

export const syncRepository = (actor: Actor, actors: Actor[]) => {
  const related = [...(actor.aliases ?? []), actor.jpName]
    .map((alias) => searchSelector(alias)(actors))
    .find((actors) => actors.length)?.[0]

  if (related) {
    related.aliases = uniq([
      ...(related.aliases ?? []),
      actor.jpName,
      ...(actor.aliases ?? []),
    ])
  } else {
    actors.push(actor)
  }

  saveActors(actors)

  return related ?? actor
}

export const fetchActresses = createServerFn({ method: 'GET' })
  .inputValidator((file?: string) => file)
  .handler(async ({ data: file = 'jvThumbs.csv' }) => {
    return new Promise<Actor[]>((resolve) => {
      const actors: Actor[] = []
      const parser = fs
        .createReadStream(file)
        .pipe(csv.parse())
        // .pipe(
        //   csv.transform(([enName, , , jpName, thumbnail, alias]: string[]) => ({
        //     jpName,
        //     enName,
        //     aliases: alias.split('|'),
        //     thumbnail,
        //   })),
        // )
        .on('readable', () => {
          let record: string[]
          while ((record = parser.read()) !== null) {
            actors.push({
              jpName: record[3],
              enName: record[0],
              aliases: compact(record[5]?.split('|')),
              thumbnail: record[4],
            })
          }
        })
        .on('end', () => {
          resolve(actors)
        })
    })
  })
