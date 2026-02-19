import { Sequelize, DataTypes, Model } from 'sequelize'
import { ScanResult } from './scanner'

export type Task = { type: 'sort' | 'scan'; path: string }

const sequelize = new Sequelize(
  process.env.DATABASE_URL ?? 'sqlite:config/db/scanner.db',
  { logging: false },
)
export const ScanTable = sequelize.define<Model<ScanResult, ScanResult>>(
  'scans',
  {
    path: { type: DataTypes.CHAR, primaryKey: true },
    metadatas: DataTypes.JSON,
    currentMetadata: DataTypes.JSON,
  },
)
export const TaskTable = sequelize.define<Model<Task, Task>>('tasks', {
  path: { type: DataTypes.CHAR, primaryKey: true },
  type: DataTypes.CHAR,
})
