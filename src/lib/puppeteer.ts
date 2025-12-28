import { createServerOnlyFn } from '@tanstack/react-start'
import { connect } from 'puppeteer-real-browser'
import type {
  BrowserContext,
  Page,
  CookieData,
  Browser,
} from 'rebrowser-puppeteer-core'

let browser: Browser | undefined = undefined
const blockedUrl = [
  'https://www.googletagmanager.com',
  'https://bs.nakanohito.jp',
  'https://stat.i3.dmm.com',
  'https://www.google-analytics.com/analytics.js',
  'https://www.googleoptimize.com/optimize.js',
  'https://stats.g.doubleclick.net/dc.js',
  'https://d2ezz24t9nm0vu.cloudfront.net',
  'https://static.cloudflareinsights.com',
  'https://pagead2.googlesyndication.com',
  'https://unrulypause.com',
  'https://media.fc2.com/counter_empjs.php',
  'https://media.fc2.com/counter_img.php',
  'https://guidepaparazzisurface.com',
  'https://www.imaginary-flower.pro',
  'https://mc.yandex.ru/',
  'https://coosync.com',
  'https://error.fc2.com/other/',
  'https://excavatenearbywand.com',
  'https://widget-view.dmm.co.jp',
]

const gotoWithRetry = async (page: Page, url: string, count = 0) => {
  if (count > 5) {
    throw new Error(`Timeout: ${url}`)
  }
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000))
  await page.goto(url, { timeout: 10000 }).catch(async () => {
    await gotoWithRetry(page, url, count + 1)
  })
}

export const openPage = createServerOnlyFn(
  async (url: string, opts?: { cookies?: CookieData[] }) => {
    if (!browser?.connected) {
      browser = (
        await connect({
          headless: true,
          args: ['--sandbox', '--incognito'],
        })
      ).browser
    }
    const context: BrowserContext = browser.defaultBrowserContext()
    if (opts?.cookies?.length) {
      const cookies = await browser.cookies()
      await context.setCookie(...cookies, ...opts.cookies)
    }
    const page = await context.newPage()
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      const requestUrl = req.url()
      if (blockedUrl.some((u) => requestUrl.startsWith(u))) {
        req.abort()
      } else {
        req.continue()
      }
    })
    let newPage = undefined as Page | undefined
    await gotoWithRetry(page, url).catch(async () => {
      await page.close()
      browser = undefined
      newPage = await openPage(url, opts)
    })

    return newPage ?? page
  },
)

export const closePage = async (page: Page) => {
  if (!page.isClosed()) {
    await page.close()
  }
  // if (isEmpty) {
  //   await b.close()
  //   browser = undefined
  // }
}
