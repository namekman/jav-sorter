import { compact, uniq } from 'lodash-es'
import type { Provider } from '../Provider'
import type { Metadata } from '@/model/Metadata'
import { closePage, openPage } from '@/lib/puppeteer'

export class AVWikiProvider implements Provider {
  name = 'av-wiki'
  async getMetadata(url: string): Promise<Metadata | undefined> {
    const page = await openPage(url)
    if (page.isClosed()) {
      return
    }

    try {
      const rows = await page.$('.dltable').then((handler) =>
        handler?.evaluate((el) => {
          const headers = [...el.querySelectorAll('dt')]
          const content = [...el.querySelectorAll('dd')]
          return headers.map((h, idx) => ({
            header: h.textContent,
            content: content[idx].innerText.trim(),
            arrayContent: [...(content[idx]?.querySelectorAll('a') ?? [])].map(
              (e) => e.textContent.trim(),
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
        releaseDate: ((val) => (val ? new Date(val).getTime() : val))(
          rows?.find(({ header }) => header === '配信開始日')?.content,
        ),
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
    if (page.isClosed()) {
      return { urls: [] }
    }
    return await page
      .$$eval('.read-more', (arr) =>
        arr.map((e) => e.querySelector('a')?.getAttribute('href')),
      )
      .then(compact)
      .then(uniq)
      .then((urls) => ({ urls }))
      .finally(() => closePage(page))
  }
}
