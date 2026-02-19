import fs from 'node:fs'
import { createServerOnlyFn } from '@tanstack/react-start'
import type { Task } from './db'
import { TaskTable } from './db'
import { WhereOptions } from 'sequelize'

export const getAllTasks = createServerOnlyFn(
  async (where?: WhereOptions<Task>) => {
    await TaskTable.sync()
    const tasks = await TaskTable.findAll({ where })
    tasks
      .filter((task) => !fs.existsSync(task.get().path))
      .forEach((task) => destroyTask(task.get().path))
    return tasks
      .filter((task) => fs.existsSync(task.get().path))
      .map((task) => task.get())
  },
)
export const getTasksByType = createServerOnlyFn(async (type: Task['type']) =>
  getAllTasks({ type }),
)

export const getTask = createServerOnlyFn(async (path: string) => {
  await TaskTable.sync()
  return await TaskTable.findByPk(path)
})

export const destroyTask = createServerOnlyFn((path: string) =>
  TaskTable.destroy({
    where: {
      path,
    },
  }),
)

export const getFirstTask = createServerOnlyFn(async (type: Task['type']) => {
  await TaskTable.sync()
  return await TaskTable.findOne({ where: { type } })
})

export const saveTask = createServerOnlyFn(async (task: Task) => {
  const t = await getTask(task.path)
  if (!t) {
    await TaskTable.create(task)
  }
})
