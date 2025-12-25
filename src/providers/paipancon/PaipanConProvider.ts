import { Metadata } from '@/model/Metadata'
import { Provider } from '../Provider'
import { Page } from 'puppeteer'
import { closePage, openPage, removeCookies } from '@/lib/puppeteer'
import { compact } from 'lodash-es'

export class PaipanConProvider implements Provider {
  name = 'fc2'
  domain = 'paipancon.com'

  private async fetchPaipanconRows(page: Page) {
    if (page.isClosed()) {
      return []
    }
    try {
      return compact(
        await page.$$eval('.text-center span', (arr) =>
          arr
            .filter((el) => el.textContent?.includes(':'))
            .map((el) => el.textContent?.split(':') ?? []),
        ),
      )
    } catch {
      return []
    }
  }
  private fetchPaipanconRow(rows: string[][], name: string) {
    try {
      const row = rows.find(([header]) => header.includes(name))
      return compact(row?.[1]?.split(',').map((p) => p.trim()))
    } catch {
      return []
    }
  }

  private async getContentMetadata(page: Page) {
    let title = await (page.isClosed()
      ? ''
      : page
          .waitForSelector('h2')
          .then((handler) =>
            handler?.evaluate((el) =>
              el.textContent?.split(' - ').slice(1).join(' - '),
            ),
          ))
    if (!title || (await page.title())?.includes('Page not found')) {
      return
    }

    const id = ((parts) => parts[parts.length - 1])(
      page.url().split('/').filter(Boolean),
    ).replace('FC2-PPV', 'FC2PPV')
    const rows = await this.fetchPaipanconRows(page)
    const maker = this.fetchPaipanconRow(rows, 'Seller Name')?.[0]
    return {
      url: page.url(),
      type: 'fc2',
      id,
      title,
      genres: this.fetchPaipanconRow(rows, 'Tags'),
      maker,
      label: maker,
      series: maker,
      releaseDate: new Date(
        await page.$$eval(
          '.text-center',
          (arr) =>
            arr
              .find((el) => el.textContent?.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/))
              ?.textContent?.trim() ?? '',
        ),
      ).getTime(),
      cover: await page
        .$$eval('img', (arr) =>
          arr
            .find((img) => img.getAttribute('src')?.endsWith('cover.jpg'))
            ?.getAttribute('src'),
        )
        .then((img) => (img ? `https://${this.domain}${img}` : undefined)),
      screenshots: await page
        .$$eval('img', (arr) =>
          arr
            .find((img) => img.getAttribute('src')?.endsWith('grid.jpg'))
            ?.getAttribute('src'),
        )
        .then((img) => (img ? [`https://${this.domain}${img}`] : [])),
      actors: this.fetchPaipanconRow(rows, 'Actress')?.map((jpName) => ({
        enName: jpName,
        jpName,
      })),
    } as Metadata
  }

  async getMetadata(url: string) {
    await removeCookies(this.domain)
    const page = await openPage(url)
    return await this.getContentMetadata(page).finally(() => {
      closePage(page)
    })
  }

  async getCandidates(id: string) {
    const result = id.match(/([0-9]+)(-[0-9])?$/)
    if (result) {
      const [, movieId, part] = result
      return {
        urls: [`https://${this.domain}/fc2daily/detail/FC2-PPV-${movieId}`],
        part: -+part,
      }
    }
    return { urls: [] }
  }
}
