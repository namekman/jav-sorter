import { Config } from '@/model/Config'
import { createServerFn } from '@tanstack/react-start'
import { readFileSync } from 'fs'

export const getConfig = createServerFn({ method: 'GET' }).handler(
  () => JSON.parse(readFileSync('./config/config.json', 'utf8')) as Config,
)
