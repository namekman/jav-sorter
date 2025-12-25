import puppeteer from 'puppeteer-extra'
import { Browser, CookieData, Page } from 'puppeteer'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { createServerOnlyFn } from '@tanstack/react-start'
import { pick } from 'lodash-es'

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

export const removeCookies = async (domain: string) => {
  const cookies = await browser?.cookies()
  await Promise.allSettled(
    cookies
      ?.filter(({ domain: cookieDomain }) => cookieDomain.includes(domain))
      .map((cookie) =>
        browser?.deleteMatchingCookies(pick(cookie, ['name', 'domain'])),
      ) ?? [],
  )
}

export const openPage = createServerOnlyFn(
  async (url: string, opts?: { cookies?: CookieData[] }) => {
    puppeteer.use(StealthPlugin())
    if (!browser?.connected) {
      browser = await puppeteer.launch({
        headless: true,
        devtools: false,
        args: ['--sandbox', '--incognito'],
      })
    }
    if (opts?.cookies?.length) {
      const cookies = await browser.cookies()
      await browser.setCookie(...cookies, ...opts.cookies)
    }
    const context = browser.defaultBrowserContext()
    const page = await context.newPage({ type: 'tab' })
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      const url = req.url()
      if (blockedUrl.some((u) => url.startsWith(u))) {
        req.abort()
      } else {
        req.continue()
      }
    })
    let newPage: Page | undefined = undefined
    await gotoWithRetry(page, url).catch(async (e) => {
      console.error(e)
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
