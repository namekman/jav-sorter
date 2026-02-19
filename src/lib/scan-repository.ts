import fs from 'node:fs'
import { createServerOnlyFn } from '@tanstack/react-start'
import type { ScanResult } from './scanner'
import { ScanTable } from './db'

export const getAllScans = createServerOnlyFn(async () => {
  await ScanTable.sync()
  const scans = await ScanTable.findAll()
  scans
    .filter((scan) => !fs.existsSync(scan.get().path))
    .forEach((scan) => removeScan(scan.get().path))
  return scans
    .filter((scan) => fs.existsSync(scan.get().path))
    .map((scan) => scan.get())
})

export const getScan = createServerOnlyFn((path: string) => {
  return ScanTable.findByPk(path).then((scan) => scan?.get())
})

export const removeScan = createServerOnlyFn((path: string) => {
  ScanTable.destroy({
    where: {
      path,
    },
  })
})

export const updateScan = createServerOnlyFn(
  (data: Pick<ScanResult, 'path' | 'currentMetadata'>) => {
    ScanTable.update(
      { currentMetadata: data.currentMetadata },
      { where: { path: data.path } },
    )
  },
)

export const saveScan = createServerOnlyFn((scan: ScanResult) => {
  ScanTable.upsert(scan)
})
