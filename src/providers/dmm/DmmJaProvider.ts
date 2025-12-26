import { compact, isNil, trim, uniq } from 'lodash-es'
import type { Page } from 'puppeteer'
import type { Provider } from '../Provider'
import type { Metadata } from '@/model/Metadata'
import { closePage, openPage } from '@/lib/puppeteer'

const commonDmmPageOptions: Parameters<typeof openPage>[1] = {
  cookies: [
    {
      name: 'age_check_done',
      value: '1',
      domain: '.dmm.co.jp',
      path: '/',
    },
  ],
}

export class DmmJaProvider implements Provider {
  name = 'dmm-ja'
  private async getContentMetadata(page: Page) {
    const title = await page
      .waitForSelector('h1')
      .then((el) => el?.evaluate((e) => e.textContent))
    const info = await page
      .$('[type="application/ld+json"]')
      .then((h) => h?.evaluate((s) => JSON.parse(s.textContent)))
    const rows = await page.$$('tr').then((handlers) =>
      Promise.all(
        handlers.map((handler) =>
          handler.evaluate((row) => {
            const element = row.querySelector('td')
            return {
              header: row.querySelector('th')?.textContent,
              content: element?.innerText,
            }
          }),
        ),
      ),
    )

    return {
      url: page.url(),
      type: 'jav',
      id: rows.find(({ header }) => header === 'メーカー品番：')?.content,
      title,
      runTime: ((val) => (!isNil(val) ? +val : val))(
        rows
          .find(({ header }) => header === '収録時間：')
          ?.content?.slice(0, -1),
      ),
      maker: rows.find(({ header }) => header === 'メーカー：')?.content,
      series:
        trim(
          rows.find(({ header }) => header === 'シリーズ：')?.content,
          '-',
        ) || undefined,
      director:
        trim(rows.find(({ header }) => header === '監督：')?.content, '-') ||
        undefined,
      label:
        info?.brand?.name ??
        rows.find(({ header }) => header === 'レーベル：')?.content,
      genres: info.subjectOf.genre ?? [],
      contentId: info.sku,
      releaseDate: new Date(
        info.subjectOf.uploadDate ??
          rows.find(({ header }) => header === '商品発売日：')?.content,
      ).getTime(),
      cover: await page
        .$('[data-e2eid="sample-image-gallery"]')
        .then((handler) =>
          handler?.evaluate((el) =>
            el.querySelector('a')?.getAttribute('href'),
          ),
        ),
      // cover: info.subjectOf.thumbnailUrl,
      description: info.description,
      trailer: info.subjectOf.contentUrl,
      screenshots: info.image ?? [],
      votes: info.aggregateRating?.ratingCount,
      rating: info.aggregateRating?.ratingValue,
      actors: info.subjectOf.actor?.map(
        (actor: { name: string; alternateName: string }) => ({
          jpName: actor.name,
          furigana: actor.alternateName,
        }),
      ),
    } as Metadata
  }

  private async getDvdMetadata(page: Page, id?: string) {
    const title = await page
      .waitForSelector('h1')
      .then((el) => el?.evaluate((e) => e.textContent))
    const rows = await page.$$('tr').then((handlers) =>
      Promise.all(
        handlers.map((handler) =>
          handler.evaluate((row) => {
            const element = row.querySelector('td')
            return {
              header: row.querySelector('th')?.textContent,
              content: element?.innerText,
            }
          }),
        ),
      ),
    )
    const meta = await page.$$('meta').then((handlers) =>
      Promise.all(
        handlers.map((handler) =>
          handler.evaluate((row) => {
            return {
              header: row.getAttribute('property'),
              content: row.getAttribute('content'),
            }
          }),
        ),
      ),
    )

    return {
      url: page.url(),
      type: 'jav',
      id: id ?? rows.find(({ header }) => header === '品番：')?.content,
      title,
      runTime: ((val) => (isNil(val) ? val : +val))(
        rows
          .find(({ header }) => header === '収録時間：')
          ?.content?.slice(0, -1),
      ),
      maker: rows.find(({ header }) => header === 'メーカー：')?.content,
      series: trim(
        rows.find(({ header }) => header === 'シリーズ：')?.content,
        '-',
      ),
      director: rows.find(({ header }) => header === '監督：')?.content,
      label: rows.find(({ header }) => header === 'レーベル：')?.content,
      genres: rows.find(({ header }) => header === 'ジャンル：')?.content,
      contentId: rows.find(({ header }) => header === '品番：')?.content,
      releaseDate: ((val) => (val ? new Date(val).getTime() : val))(
        rows.find(({ header }) => header === '発売日：')?.content,
      ),
      cover: meta.find(({ header }) => header === 'og:image')?.content,
      description: meta.find(({ header }) => header === 'og:description')
        ?.content,
      actors: rows
        .find(({ header }) => header === '出演者：')
        ?.content?.split('\n')
        .map((jpName) => ({
          jpName,
        })),
      screenshots: [],
    } as Metadata
  }

  async getMetadata(url: string) {
    if (url.startsWith('https://video.dmm.co.jp/')) {
      const page = await openPage(url, commonDmmPageOptions)
      if (page.isClosed()) {
        return
      }
      return await this.getContentMetadata(page).finally(() => closePage(page))
    }
    // if (url.startsWith('https://www.dmm.co.jp/mono/dvd/')) {
    //   return await this.getDvdMetadata(page, id)
    // }

    return undefined
  }

  async fetchCandidates(id: string) {
    const page = await openPage(
      `https://www.dmm.co.jp/search/=/searchstr=${id}`,
      commonDmmPageOptions,
    )
    return await page
      .$$eval('[alt="Product"]', (arr) =>
        arr.map((e) => e.closest('a')?.getAttribute('href')),
      )
      .then(compact)
      .then(uniq)
      .finally(() => closePage(page))
  }

  async getCandidates(id: string) {
    const idParts = id.split('-')
    const candidates =
      idParts.length > 1
        ? await this.fetchCandidates(
            idParts[0].toLocaleLowerCase() + idParts[1].padStart(5, '0'),
          )
        : []
    if (!candidates.length) {
      return { urls: await this.fetchCandidates(id) }
    }
    return { urls: candidates }
  }
}
