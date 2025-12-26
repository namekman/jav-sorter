import { compact } from 'lodash-es'
import type { ActressProvider } from '../ActressProvider'
import type { Actor } from '@/model/Actor'
import { closePage, openPage } from '@/lib/puppeteer'

const commonMinnanoPageOptions: Parameters<typeof openPage>[1] = {
  cookies: [
    {
      name: 'age_verified',
      value: 'true',
      domain: 'www.minnano-av.com',
      path: '/',
    },
  ],
}
export class MinnanoAvActressProvider implements ActressProvider {
  name = 'minnano-av'
  domain = 'https://www.minnano-av.com'
  async getInfo(info: Partial<Actor>) {
    const name = info.jpName || info.enName
    if (!name) {
      return
    }
    const page = await openPage(
      `https://www.minnano-av.com/search_result.php?search_scope=actress&search_word=${encodeURIComponent(name)}&search=+Go+`,
      commonMinnanoPageOptions,
    )
    if (page.isClosed()) {
      return
    }
    try {
      if (page.url().includes('/actress')) {
        const actress = await page.$eval('h1', (el) => {
          const span = el.querySelector('span')?.textContent ?? ''

          const text: string | undefined = Array.prototype.filter
            .call(el.childNodes, (child) => child.nodeType === Node.TEXT_NODE)
            .map((child) => child.textContent.trim())
            .find(Boolean)
          const jpName = text?.split('(')[0]
          const [furigana, enName] = span.split('/').map((t) => t.trim())
          return { jpName, furigana, enName }
        })
        const thumbnail = await page
          .$eval('.actress-header .thumb img', (img) => img.getAttribute('src'))
          .then((img) => (img?.startsWith('/') ? `${this.domain}${img}` : img))
        const aliases = compact(
          await page.$$eval('.act-profile td', (arr) =>
            arr
              .filter((td) => td.textContent.includes('別名'))
              .map(
                (td) => td.querySelector('p')?.textContent.split(/[(（]/)[0],
              ),
          ),
        )
        return { ...actress, thumbnail: thumbnail ?? '', aliases } as Actor
      }
      // TODO Index case
    } finally {
      closePage(page)
    }
  }
}
