import { Metadata } from '@/model/Metadata'
import { Provider } from '../Provider'
import { closePage, openPage } from '@/lib/puppeteer'
import { compact, uniq } from 'lodash-es'

export class AVWikiProvider implements Provider {
  name = 'av-wiki'
  async getMetadata(url: string): Promise<Metadata | undefined> {
    const page = await openPage(url)
    if (!page) {
      return page
    }

    try {
      const rows = await page.$('.dltable').then((handler) =>
        handler?.evaluate((el) => {
          const headers = [...el.querySelectorAll('dt')]
          const content = [...el.querySelectorAll('dd')]
          return headers.map((h, idx) => ({
            header: h.textContent,
            content: content[idx].innerText?.trim(),
            arrayContent: [...(content[idx]?.querySelectorAll('a') ?? [])].map(
              (e) => e.textContent?.trim(),
            ),
          }))
        }),
      )
      const metadata = {
        url: page.url(),
        type: 'jav',
        id: rows?.find(({ header }) => header === 'メーカー品番')?.content,
        title: await page
          .$('h1')
          .then((handler) => handler?.evaluate((el) => el.textContent)),
        maker: rows?.find(({ header }) => header === 'メーカー')?.content,
        series: rows?.find(({ header }) => header === 'シリーズ')?.content,
        label: rows?.find(({ header }) => header === 'レーベル')?.content,
        contentId: rows?.find(({ header }) => header === 'FANZA品番')?.content,
        releaseDate: new Date(
          rows?.find(({ header }) => header === '配信開始日')?.content!,
        ).getTime(),
        cover: await page
          .$('.image-link-border')
          .then((handler) =>
            handler?.evaluate((el) =>
              el.querySelector('img')?.getAttribute('src'),
            ),
          ),
        actors: rows
          ?.find(({ header }) => header === 'AV女優名')
          ?.arrayContent.map((a) => ({ jpName: a })),
        genres: [],
        screenshots: [],
      } as Metadata

      return metadata
    } finally {
      await closePage(page)
    }
  }

  async getCandidates(id: string) {
    const page = await openPage(
      `https://av-wiki.net/?s=${id}&post_type=product`,
    )
    if (!page) {
      return { urls: [] }
    }
    return await page
      .$$('.read-more')
      .then((arr) =>
        Promise.all(
          arr.map((e) =>
            e?.evaluate((e) => e.querySelector('a')?.getAttribute('href')),
          ),
        ),
      )
      .then(compact)
      .then(uniq)
      .then((urls) => ({ urls }))
      .finally(() => closePage(page))
  }
}
