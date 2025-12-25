import { Metadata } from '@/model/Metadata'
import { Provider } from '../Provider'
import { closePage, openPage } from '@/lib/puppeteer'
import { compact, uniq } from 'lodash-es'

export class ShiroutoWikiProvider implements Provider {
  name = 'shirouto-wiki'
  async getMetadata(url: string): Promise<Metadata | undefined> {
    const page = await openPage(url)
    if (!page) {
      return page
    }
    try {
      const rows = await page.$('.post_content dl').then((handler) =>
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
      return {
        url: page.url(),
        type: 'jav',
        id: rows?.find(({ header }) => header === '商品品番')?.content,
        title: rows?.find(({ header }) => header === 'タイトル')?.content,
        maker: rows?.find(({ header }) => header === 'メーカー')?.content,
        series: rows?.find(({ header }) => header === 'シリーズ')?.content,
        label: rows?.find(({ header }) => header === 'レーベル')?.content,
        contentId: rows?.find(({ header }) => header === 'FANZA品番')?.content,
        releaseDate: new Date(
          rows?.find(({ header }) => header === '公開日')?.content!,
        ).getTime(),
        cover: await page
          .$('.p-articleThumb__img')
          .then((handler) =>
            handler?.evaluate((el) => el?.getAttribute('src')),
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
    if (!page) {
      return { urls: [] }
    }
    return await page
      .$$('.mgs-data-table__thumb ')
      .then((arr) =>
        Promise.all(
          arr.map((e) =>
            e?.evaluate((e) => e.closest('a')?.getAttribute('href')),
          ),
        ),
      )
      .then(compact)
      .then(uniq)
      .then((urls) => ({ urls }))
      .finally(() => closePage(page))
  }
}
