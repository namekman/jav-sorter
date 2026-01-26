import { createServerFn } from '@tanstack/react-start'
import { getConfig } from '@/lib/config'

export const getConfigFn = createServerFn({ method: 'GET' }).handler(() =>
  getConfig(),
)
