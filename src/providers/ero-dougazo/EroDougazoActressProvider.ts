import { Actor } from '@/model/Actor'
import { ActressProvider } from '../ActressProvider'
import { closePage, openPage } from '@/lib/puppeteer'

export class EroDougazoActressProvider implements ActressProvider {
  name = 'ero-dougazou'
  domain = 'https://erodougazo.com'
  async getInfo(info: Partial<Actor>) {
    let name = info?.jpName || info?.enName
    if (!name) {
      return
    }
    const page = await openPage('https://erodougazo.com/actress/')
    if (page.isClosed()) {
      return
    }
    try {
      await page.type('input[name="data[AvJoyu][name]', name!)
      await page.click('.SearchActressKanaWrap input[type="submit"]')
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 10000,
      })
      if (page.url().includes('/actress/av')) {
        const actress = await page.$eval('.APname a', (el) => {
          const jpName = el.querySelector('span')?.textContent!
          const aliases = el
            .querySelector('.other_name')
            ?.textContent?.split('、')

          const texts: string[] = Array.prototype.filter
            .call(el.childNodes, (child) => child.nodeType === Node.TEXT_NODE)
            .map((child) => child.textContent.trim())
            .filter(Boolean)

          const [furigana, enName] = (
            texts.length > 1
              ? texts
              : texts?.[0].replaceAll('\t', '').split(' ')
          ).map((text) => text.replace(/([A-Z]+)/g, ' $1').trim())
          return { jpName, aliases, furigana, enName }
        })
        const thumbnail = await page
          .$eval(
            '.ActressProfileThumb',
            (el) => el.querySelector('img')?.getAttribute('src')!,
          )
          .then((thumbnail) => !thumbnail?.startsWith('/') && thumbnail)
        return (thumbnail ? { ...actress, thumbnail } : actress) as Actor
      }
      // TODO Index case
    } finally {
      closePage(page)
    }
  }
}
