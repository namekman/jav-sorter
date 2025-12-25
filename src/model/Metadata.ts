import { Actor } from './Actor'

export type Metadata = {
  type?: 'fc2' | 'jav'
  url?: string
  id?: string
  part?: number
  contentId?: string
  displayName?: string
  title?: string
  altTitle?: string
  description?: string
  director?: string
  releaseDate?: number
  runTime?: number
  maker?: string
  label?: string
  series?: string
  rating?: number
  votes?: number
  genres?: string[]
  tags?: string[]
  cover?: string
  screenshots?: string[]
  trailer?: string
  actors?: Actor[]
}
