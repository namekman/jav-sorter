import { compact, uniq } from 'lodash-es'
import type { Provider } from '../Provider'
import type { Metadata } from '@/model/Metadata'
import { closePage, openPage } from '@/lib/puppeteer'

export class ShiroutoWikiProvider implements Provider {
  name = 'shirouto-wiki'
  async getMetadata(url: string): Promise<Metadata | undefined> {
    const page = await openPage(url)
    if (page.isClosed()) {
      return
    }
    try {
      const rows = await page.$('.post_content dl').then((handler) =>
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
      return {
        url: page.url(),
        type: 'jav',
        id: rows?.find(({ header }) => header === '商品品番')?.content,
        title: rows?.find(({ header }) => header === 'タイトル')?.content,
        maker: rows?.find(({ header }) => header === 'メーカー')?.content,
        series: rows?.find(({ header }) => header === 'シリーズ')?.content,
        label: rows?.find(({ header }) => header === 'レーベル')?.content,
        contentId: rows?.find(({ header }) => header === 'FANZA品番')?.content,
        releaseDate: ((val) => (val ? new Date(val).getTime() : val))(
          rows?.find(({ header }) => header === '公開日')?.content,
        ),
        cover: await page.$eval('.p-articleThumb__img', (el) =>
          el.getAttribute('src'),
        ),
        actors: rows
          ?.find(({ header }) => header === '女優名')
          ?.arrayContent.map((a) => ({ jpName: a })),
      } as Metadata
    } finally {
      await closePage(page)
    }
  }

  async getCandidates(id: string) {
    const page = await openPage(`https://shiroutowiki.work/?s=${id}`)
    if (page.isClosed()) {
      return { urls: [] }
    }
    return await page
      .$$eval('.mgs-data-table__thumb', (elements) =>
        elements.map((e) => e.closest('a')?.getAttribute('href')),
      )
      .then(compact)
      .then(uniq)
      .then((urls) => ({ urls }))
      .finally(() => closePage(page))
  }
}
