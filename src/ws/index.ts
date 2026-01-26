import type { ViteDevServer } from 'vite'
import { Server } from 'socket.io'
import {
  getAllScans,
  getScan,
  removeScan,
  updateScan,
} from '../lib/scan-repository'
import fastq from 'fastq'
import { scanFile, ScanResult } from '../lib/scanner'
import { fetchActresses } from '../lib/actress-store'
import { sortFile } from '../lib/sort'
import { getConfig } from '../lib/config'

export type Task = { type: 'sort' | 'scan'; path: string }

export const configureSocketIO = (io: Server) => {
  const worker = async (task: Task) => {
    try {
      switch (task.type) {
        case 'sort': {
          const scan = await getScan(task.path)
          const config = getConfig()
          const outDir =
            scan.currentMetadata.type === 'fc2'
              ? config.fc2TargetDir
              : config.targetDir
          return await sortFile({ media: scan, outDir })
        }
        case 'scan':
          return await scanFile(task.path, await fetchActresses())
      }
    } catch (error: any) {
      io.sockets.emit('error', { error, task })
    }
  }

  const queue = fastq.promise(worker, 1)
  const queueContent: Task[] = []

  const addTask = (task: Task, cb?: (result: ScanResult | void) => void) => {
    const tasks = queue.getQueue()
    if (!tasks.some((t) => t.path === task.path)) {
      io.sockets.emit('status', {
        inProgress: true,
        type: task.type,
        key: task.path,
      })
      queueContent.push(task)
      io.sockets.emit('queue', queueContent)
      return queue
        .push(task)
        .then((result) => cb?.(result))
        .finally(() => {
          io.sockets.emit('status', {
            inProgress: false,
            type: task.type,
            key: task.path,
          })
          queueContent.splice(0, 1)
          io.sockets.emit('queue', queueContent)
        })
    }
  }
  io.on('connection', (socket) => {
    getAllScans().then((scans) => {
      socket.emit('scans', scans)
    })
    socket.emit('queue', queueContent)
    socket.on('scan', (path: string) => {
      addTask({ type: 'scan', path }, (scan) => {
        if (scan) {
          io.sockets.emit('new-scan', scan)
        }
      })
    })
    socket.on('sort', (path: string) => {
      addTask({ type: 'sort', path }, () => {
        io.sockets.emit('scan-removed', path)
      })
    })
    socket.on('removed', (path: string) => {
      removeScan(path)
      io.sockets.emit('scan-removed', path)
    })
    socket.on('update', (params: Parameters<typeof updateScan>[0]) => {
      updateScan(params)
    })
  })
}

export const configureWsServer = (server: ViteDevServer) => {
  configureSocketIO(new Server(server.httpServer!))
}
