import type { Provider } from '../Provider'
import type { Page } from 'puppeteer'
import type { Metadata } from '@/model/Metadata'
import { closePage, openPage } from '@/lib/puppeteer'

export class FC2Provider implements Provider {
  name = 'fc2'
  domain = 'https://adult.contents.fc2.com'

  private async getContentMetadata(page: Page) {
    const title = await (page.isClosed()
      ? ''
      : page.waitForSelector('h3').then((el) =>
          el?.evaluate((e) =>
            Array.prototype.filter
              .call(e.childNodes, (child) => child.nodeType === Node.TEXT_NODE)
              .map((child) => child.textContent.trim())
              .filter(Boolean)
              .join(' '),
          ),
        ))
    if (
      !title ||
      title.includes('申し訳ありません') ||
      title.includes('The product you were looking for was not found') ||
      title.includes('This product is not available in your country') ||
      page.url().includes('error')
    ) {
      return
    }
    const id = ((parts) => parts[parts.length - 1])(
      page.url().split('/').filter(Boolean),
    )
    return {
      url: page.url(),
      type: 'fc2',
      id: `FC2PPV-${id}`,
      title,
      genres: await page.$$eval('.items_article_TagArea a', (arr) =>
        arr.map((el) => el.textContent),
      ),
      runTime: await page
        .$eval('.items_article_MainitemThumb .items_article_info', (el) =>
          el.textContent.split(':'),
        )
        .then((arr) =>
          arr
            .slice(0, -1)
            .reverse()
            .reduce((acc, curr, idx) => acc + +curr * 60 ** idx, 0),
        ),
      releaseDate: ((val) => (val ? new Date(val).getTime() : val))(
        await page.$eval('div > p', (el) =>
          el.textContent.split(':')[1]?.trim(),
        ),
      ),
      cover: await page
        .$eval('.items_article_MainitemThumb img', (el) =>
          el.getAttribute('src'),
        )
        .then((img) => img?.replace(/^\/\//, 'https://')),
      screenshots: await page.$$eval(
        '.items_article_SampleImagesArea img',
        (arr) =>
          arr.map((el) => el.getAttribute('src')?.replace(/^\/\//, 'https://')),
      ),
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
      return { urls: [`${this.domain}/article/${movieId}/`], part: -+part }
    }
    return { urls: [] }
  }
}
