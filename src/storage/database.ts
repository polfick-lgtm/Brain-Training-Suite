import Dexie, { EntityTable } from 'dexie'
import { AppSettings, LocalProfile, TrainingSession } from './models'

export class BrainTrainingDatabase extends Dexie {
  profiles!: EntityTable<LocalProfile, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  sessions!: EntityTable<TrainingSession, 'id'>

  constructor() {
    super('brain-training-suite')
    this.version(1).stores({
      profiles: '&id',
      settings: '&id',
      sessions: '&id, gameId, completedAt, difficulty, completed',
    })
  }
}

export const database = new BrainTrainingDatabase()
