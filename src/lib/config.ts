import { readFileSync } from 'fs'
import type { Config } from '@/model/Config'

export const getConfig = () =>
  JSON.parse(readFileSync('./config/config.json', 'utf8')) as Config
