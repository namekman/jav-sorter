import { fetchActresses, fuzzyActressSearch } from '@/lib/actress-store'
import { createServerFn } from '@tanstack/react-start'

export const fetchActressFn = createServerFn({ method: 'GET' })
  .inputValidator((query: string) => query)
  .handler(async ({ data }) => {
    if (data.length < 2) {
      return []
    }
    const actresses = await fetchActresses()
    return fuzzyActressSearch(data, actresses)
  })
