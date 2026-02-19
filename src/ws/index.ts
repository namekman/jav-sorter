import type { ViteDevServer } from 'vite'
import { Server, Socket } from 'socket.io'
import {
  getAllScans,
  getScan,
  removeScan,
  updateScan,
} from '../lib/scan-repository'
import { scanFile } from '../lib/scanner'
import { fetchActresses } from '../lib/actress-store'
import { sortFile } from '../lib/sort'
import { getConfig } from '../lib/config'
import type { Task } from '../lib/db'
import {
  destroyTask,
  getAllTasks,
  getFirstTask,
  saveTask,
} from '../lib/task-repository'

/**
 * Sends an event to a socket in a fail-safe manner.
 */
const sendEvent = <S extends Socket>(
  socket: S,
  ...args: Parameters<S['emit']>
) => {
  try {
    socket.emit.call(socket, ...args)
  } catch {}
}

/**
 * Broadcast an event to all opened socket in a fail-safe manner.
 */
const broadcastEvent = <S extends Server>(
  server: S,
  ...args: Parameters<S['sockets']['emit']>
) => {
  try {
    server.sockets.emit.call(server.sockets, ...args)
  } catch {}
}

const executor = (io: Server, type: Task['type']) => {
  let currentTask: Task | undefined

  const worker = async (task: Task) => {
    switch (task.type) {
      case 'sort': {
        const scan = await getScan(task.path).catch((error) =>
          broadcastEvent(io, 'error', { error, task }),
        )
        if (scan) {
          const config = getConfig()
          const outDir =
            scan.currentMetadata.type === 'fc2'
              ? config.fc2TargetDir
              : config.targetDir
          return await sortFile({ media: scan, outDir }).catch((error) =>
            broadcastEvent(io, 'error', { error, task }),
          )
        }
        return
      }
      case 'scan':
        return await scanFile(task.path, await fetchActresses()).catch(
          (error) => broadcastEvent(io, 'error', { error, task }),
        )
    }
  }

  const execute = (task: Task) => {
    currentTask = task
    return worker(task)
      .then((result) => {
        switch (task.type) {
          case 'scan':
            if (result) {
              broadcastEvent(io, 'new-scan', result)
            }
            break
          case 'sort':
            broadcastEvent(io, 'scan-removed', task.path)
            break
        }
      })
      .finally(() => destroyTask(task.path))
      .finally(() =>
        getAllTasks().then((tasks) => broadcastEvent(io, 'queue', tasks)),
      )
      .finally(() => (currentTask = undefined))
  }

  const start = async () => {
    const task = await getFirstTask(type)
    if (task && !currentTask) {
      execute(task.get()).then(() => start())
    }
  }

  return { start }
}

export const configureSocketIO = (io: Server) => {
  const scanExecutor = executor(io, 'scan')
  const sortExecutor = executor(io, 'sort')

  scanExecutor.start()
  sortExecutor.start()

  const addTask = (task: Task) => {
    saveTask(task).then(() => {
      switch (task.type) {
        case 'scan':
          scanExecutor.start()
          break
        case 'sort':
          sortExecutor.start()
          break
      }
    })
    getAllTasks().then((tasks) => broadcastEvent(io, 'queue', tasks))
  }
  io.on('connection', (socket) => {
    getAllScans()
      .then((scans) => {
        sendEvent(socket, 'scans', scans)
      })
      .catch()
    getAllTasks().then((tasks) => {
      sendEvent(socket, 'queue', tasks)
    })
    socket.on('scan', (path: string) => {
      addTask({ type: 'scan', path })
    })
    socket.on('sort', (path: string) => {
      addTask({ type: 'sort', path })
    })
    socket.on('removed', (path: string) => {
      removeScan(path)
      broadcastEvent(io, 'scan-removed', path)
    })
    socket.on('update', (params: Parameters<typeof updateScan>[0]) => {
      updateScan(params)
    })
  })
}

export const configureWsServer = (server: ViteDevServer) => {
  configureSocketIO(new Server(server.httpServer!))
}
