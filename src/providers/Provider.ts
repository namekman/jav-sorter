import type { Metadata } from '@/model/Metadata'

export interface Provider {
  name: string
  getMetadata: (url: string, part?: number) => Promise<Metadata | undefined>
  getCandidates: (id: string) => Promise<{ urls: string[]; part?: number }>
}
