import { readFileSync } from 'node:fs'
import { createServerFn } from '@tanstack/react-start'
import type { Config } from '@/model/Config'

export const getConfig = createServerFn({ method: 'GET' }).handler(
  () => JSON.parse(readFileSync('./config/config.json', 'utf8')) as Config,
)
