import { compact, trim, uniq } from 'lodash-es'
import type { Page } from 'rebrowser-puppeteer-core'
import type { Provider } from '../Provider'
import type { Metadata } from '@/model/Metadata'
import { closePage, openPage } from '@/lib/puppeteer'

const commonMGSPageOptions: Parameters<typeof openPage>[1] = {
  cookies: [
    {
      name: 'adc',
      value: '1',
      domain: '.mgstage.com',
      path: '/',
    },
  ],
}

export class MgstageJaProvider implements Provider {
  name = 'mgs-ja'
  domain = 'https://www.mgstage.com'
  private async getContentMetadata(page: Page) {
    const title = await page
      .waitForSelector('h1')
      .then((el) => el?.evaluate((e) => e.textContent))
    const rows = await page.$$('.detail_data tr').then((handlers) =>
      Promise.all(
        handlers.map((handler) =>
          handler.evaluate((row) => {
            const element = row.querySelector('td')
            return {
              header: row.querySelector('th')?.textContent,
              content: element?.innerText.trim(),
              arrayContent: [...(element?.querySelectorAll('a') ?? [])].map(
                (e) => e.textContent.trim(),
              ),
            }
          }),
        ),
      ),
    )

    return {
      url: page.url(),
      type: 'jav',
      id: rows.find(({ header }) => header === '品番：')?.content,
      title,
      runTime: ((val) => (val ? +val : undefined))(
        rows
          .find(({ header }) => header === '収録時間：')
          ?.content?.match(/^([0-9]+)/)?.[0],
      ),
      maker: rows.find(({ header }) => header === 'メーカー：')?.content,
      series:
        trim(
          rows.find(({ header }) => header === 'シリーズ：')?.content,
          '-',
        ) || undefined,
      director: rows.find(({ header }) => header === '監督：')?.content,
      label: rows.find(({ header }) => header === 'レーベル：')?.content,
      genres:
        rows.find(({ header }) => header === 'ジャンル：')?.arrayContent ?? [],
      releaseDate: ((val) => (val ? new Date(val).getTime() : val))(
        rows.find(
          ({ header }) =>
            header === '配信開始日：' || header === '商品発売日：',
        )?.content,
      ),
      cover: await page
        .$('#EnlargeImage')
        .then((handler) => handler?.evaluate((el) => el.getAttribute('href'))),
      description: await page.$eval('#introduction dd', (el) =>
        el.textContent.trim(),
      ),
      screenshots: await page.$$eval('#sample-photo .sample_image', (arr) =>
        arr.map((el) => el.getAttribute('href')),
      ),
      // NOTE: MGStage's actress info is worthless most of the time
      // actors: rows
      //   .find(({ header }) => header === '出演：')
      //   ?.content?.split('\n')
      //   ?.map((actor) => ({
      //     jpName: actor,
      //   })),
    } as Metadata
  }

  async getMetadata(url: string) {
    const page = await openPage(
      url.startsWith('/') ? `${this.domain}${url}` : url,
      commonMGSPageOptions,
    )
    if (page.isClosed()) {
      return
    }
    return await this.getContentMetadata(page).finally(() => closePage(page))
  }

  async fetchCandidates(id: string) {
    const page = await openPage(
      `${this.domain}/search/cSearch.php?search_word=${id}`,
      commonMGSPageOptions,
    )
    if (page.isClosed()) {
      return []
    }
    return await page
      .$$eval('h5', (arr) =>
        arr.map((e) => e.querySelector('a')?.getAttribute('href')),
      )
      .then(compact)
      .then(uniq)
      .finally(() => closePage(page))
  }

  async getCandidates(id: string) {
    return await this.fetchCandidates(id).then((urls) => ({ urls }))
  }
}
