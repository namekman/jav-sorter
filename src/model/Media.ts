import type { Metadata } from './Metadata'

export type Media = {
  path: string
  currentMetadata: Metadata
  metadatas: {
    metadata: Metadata
  }[]
}
