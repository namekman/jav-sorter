import { Metadata } from '@/model/Metadata'
import { Provider } from '../Provider'
import { closePage, openPage } from '@/lib/puppeteer'
import { compact, uniq } from 'lodash-es'

export class XXXPlanetProvider implements Provider {
  name = '3xPlanet'
  async getMetadata(url: string): Promise<Metadata | undefined> {
    const page = await openPage(url)
    if (!page) {
      return page
    }
    try {
      const title = (
        await page
          .waitForSelector('h1')
          .then((el) => el?.evaluate((e) => e.textContent))
      )
        ?.split(' ')
        .filter((t) => !t.startsWith('('))
      const info = await page
        .$('[type="application/ld+json"]')
        .then((h) => h?.evaluate((s) => JSON.parse(s.textContent!)))
      const rows = (
        await page.$$('p').then((handlers) =>
          Promise.all(
            handlers.map((handler) =>
              handler.evaluate((row) => {
                const content = row.textContent?.split(/[：:]/)
                return {
                  header: content?.[0],
                  content: content?.slice(1).join(':'),
                }
              }),
            ),
          ),
        )
      )
        .filter((row) => row?.content && row?.header)
        .map((row) => ({
          content: row.content!.trim(),
          header: row.header!.trim(),
        }))
      return {
        url: page.url(),
        type: 'jav',
        id: title?.[0],
        title: title?.slice(1).join(' '),
        runTime: +rows
          .find(({ header }) => header === '収録時間')
          ?.content?.slice(0, -1)!,
        description: rows.find(({ header }) => header === 'Description')
          ?.content!,
        maker: rows.find(({ header }) => header === 'メーカー')?.content,
        label: rows.find(({ header }) => header === 'レーベル')?.content,
        series: rows.find(({ header }) => header === 'シリーズ')?.content,
        director:
          rows.find(({ header }) => header === '監督')?.content || undefined,
        releaseDate: new Date(
          rows?.find(({ header }) => header === '配信開始日')?.content!,
        ).getTime(),
        cover: info['@graph'].find((g: any) => g['@type'] === 'ImageObject')
          ?.url,
        genres: compact(
          [
            ...(rows
              ?.find(({ header }) => header === 'ジャンル')
              ?.content.split(/[ 、,]/) ?? [],
            rows
              ?.find(({ header }) => header === 'Tags')
              ?.content.split(/[ 、,]/) ?? []),
          ].map((genre) => genre.trim()),
        ),
        actors: rows
          ?.find(({ header }) => header === '出演者')
          ?.content.split(' ')
          .filter((name) => name !== 'Amateur')
          .map((jpName) => ({ jpName })),
      } as Metadata
    } finally {
      await closePage(page)
    }
  }

  async getCandidates(id: string) {
    const page = await openPage(`https://3xplanet.com/?s=${id}`)

    if (!page) {
      return { urls: [] }
    }
    return await page
      .$$('a.td-image-wrap ')
      .then((arr) =>
        Promise.all(
          arr.map((e) => e?.evaluate((e) => e?.getAttribute('href'))),
        ),
      )
      .then(compact)
      .then(uniq)
      .then((urls) => ({ urls }))
      .finally(() => closePage(page))
  }
}
