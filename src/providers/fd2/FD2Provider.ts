
import type { Provider } from '../Provider'
import type { Page } from 'rebrowser-puppeteer-core'
import type { Metadata } from '@/model/Metadata'
import { closePage, openPage } from '../../lib/puppeteer'

export class FD2Provider implements Provider {
  name = 'fd2'
  domain = 'https://fd2ppv.cc'

  private async getContentMetadata(page: Page) {
    let title: string
    try {
      title = await (page.isClosed()
        ? ''
        : page
            .waitForSelector('h3')
            .then(() => page.$eval('.work-brief', (el) => el.textContent)))
    } catch (e) {
      title = await page.$eval('.work-brief', (el) => el.textContent)
    }
    if ((await page.title()).includes('Page Not Found')) {
      return
    }
    const id = ((parts) => parts[parts.length - 1])(
      page.url().split('/').filter(Boolean),
    )
    const rows = await page.$eval('.work-info-section .work-meta', (row) => {
      const elements = [...row.children]
      const chunks = [...Array(Math.ceil(elements.length / 2))].map((_) =>
        elements.splice(0, 2),
      )
      return chunks.map((chunk) => ({
        header: chunk[0].textContent,
        content: chunk[1].textContent,
      }))
    })
    return {
      url: page.url(),
      type: 'fc2',
      id: `FC2PPV-${id}`,
      title,
      genres: await page.$$eval('.work-tags a', (arr) =>
        arr.map((el) => el.textContent),
      ),
      runTime: rows
        .find(({ header }) => header === '収録時間')
        ?.content?.split(':')
        .slice(0, -1)
        .reverse()
        .reduce((acc, curr, idx) => acc + +curr * 60 ** idx, 0),
      releaseDate: ((val) => (val ? new Date(val).getTime() : val))(
        rows.find(({ header }) => header === '配信日')?.content,
      ),
      cover: await page.$eval('.work-image-section', (el) =>
        el.textContent.trim(),
      ),
      maker: rows.find(({ header }) => header === 'メーカー')?.content,
      label: rows.find(({ header }) => header === '販売者')?.content,
      series: rows.find(({ header }) => header === '販売者')?.content,
      actors: (
        await page.$$eval('.artist-name a', (els) =>
          els.map((el) => el.textContent),
        )
      ).map((jpName) => ({ enName: jpName, jpName })),
    } as Metadata
  }

  async getMetadata(url: string) {
    const page = await openPage(url)
    return await this.getContentMetadata(page).finally(() => {
      closePage(page)
    })
  }

  async getCandidates(id: string) {
    const result = id.match(/([0-9]+)(-[0-9])?$/)
    if (result) {
      const [, movieId, part] = result
      return { urls: [`${this.domain}/articles/${movieId}/`], part: -+part }
    }
    return { urls: [] }
  }
}
