import { User } from './user'

export interface Room {
  id?: number
  name: string
  participants?: Partial<User>[]
  createdBy: number
  createdAt: Date
}

export interface Message {
  id?: number
  content: string
  fileId?: number
  roomId: number
  createdBy: number
  createdAt: Date
}
