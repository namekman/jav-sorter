import sqlite from 'sqlite3'
import { ScanResult } from './scanner'
import { createServerOnlyFn } from '@tanstack/react-start'

const dbPath = './config/db/scanner.db'

const openDatabase = () => {
  const db = new sqlite.Database(
    dbPath,
    sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE,
    (err) => {
      if (err) {
        console.error('Error connecting to database:', err.message)
      }
    },
  )
  return db.exec(
    'CREATE TABLE IF NOT EXISTS scans (path TEXT PRIMARY KEY, metadatas TEXT, currentMetadata TEXT);',
  )
}

export const getAllScans = createServerOnlyFn(() => {
  const db = openDatabase()

  return new Promise<ScanResult[]>((resolve, reject) => {
    db.all(
      'SELECT * FROM scans ORDER BY path',
      (err, rows: Record<keyof ScanResult, string>[]) => {
        if (err) {
          reject(err)
        } else {
          resolve(
            rows.map((row) => ({
              path: row.path,
              currentMetadata: JSON.parse(row.currentMetadata),
              metadatas: JSON.parse(row.metadatas),
            })),
          )
        }
      },
    )
  })
})

export const getScan = createServerOnlyFn((path: string) => {
  const db = openDatabase()

  return new Promise<ScanResult>((resolve, reject) => {
    db.get(
      'SELECT * FROM scans WHERE path = :path',
      { ':path': path },
      (err, row: Record<keyof ScanResult, string>) => {
        if (err) {
          reject(err)
        } else {
          resolve({
            path,
            currentMetadata: JSON.parse(row.currentMetadata),
            metadatas: JSON.parse(row.metadatas),
          })
        }
      },
    )
  })
})

export const removeScan = createServerOnlyFn((path: string) => {
  const db = openDatabase()

  db.run('DELETE FROM scans WHERE path = :path', { ':path': path })
})

export const updateScan = createServerOnlyFn(
  (data: Pick<ScanResult, 'path' | 'currentMetadata'>) => {
    const db = openDatabase()
    db.run('UPDATE scans SET currentMetadata = :current WHERE path = :path', {
      ':path': data.path,
      ':current': JSON.stringify(data.currentMetadata),
    })
  },
)

export const saveScan = createServerOnlyFn((scan: ScanResult) => {
  const db = openDatabase()
  db.run(
    'INSERT OR REPLACE INTO scans (path, metadatas, currentMetadata) VALUES (:path, :metadatas, :current)',
    {
      ':path': scan.path,
      ':metadatas': JSON.stringify(scan.metadatas),
      ':current': JSON.stringify(scan.currentMetadata),
    },
  )
})
