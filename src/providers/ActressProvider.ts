import type { Actor } from '@/model/Actor'

export interface ActressProvider {
  getInfo: (info: Partial<Actor>) => Promise<Actor | undefined>
}
