import io from 'socket.io'
import jwt from 'jsonwebtoken'
import { Logger } from '../../domain/interfaces/logger'
import { Services } from '../../service'
import { Repository } from '../../domain/repositories'
import { ChatEvents } from './chat'
import { Config } from '../../../config/app'

export const New = (opt: Options) => {
  const users = new Map<number, io.Socket>()

  opt.server.on('connection', (socket) => {
    const userId = socket.data.userId
    socket.data.users = users

    if (userId) {
      users.set(userId, socket)
    }

    socket.on('disconnect', () => {
      users.delete(userId)
    })

    const options: EventsOptions = {
      socket,
      logger: opt.logger,
      repository: opt.repository,
      services: opt.services,
      config: opt.config,
    }

    new ChatEvents(options)
  })
}

export interface Options {
  server: io.Server
  repository: Repository
  services: Services
  logger: Logger
  config: Config
}

export interface EventsOptions {
  socket: io.Socket<any, any, any, SocketData>
  repository: Repository
  services: Services
  logger: Logger
  config: Config
}

interface SocketData {
  userId: number
  users: Map<number, io.Socket>
}

export interface CreateMessageData {
  roomId: number
  content: string
  file?: File
}

export interface UpdateMessageData {
  messageId: number
  content: string
}

export interface ConnectRoomData {
  roomId: number
  content: string
}
export interface DisconnectRoomData {
  roomId: number
  content: string
}

export interface ChatEventsInterface {
  createMessage: (data: CreateMessageData) => void
  updateMessage: (data: UpdateMessageData) => void
}

export const authMiddleware = (opt: EventsOptions) => async (socket: io.Socket, next) => {
  const logger = opt.logger.named('authMiddleware')

  const token = socket.handshake.auth?.token

  try {
    if (!token) {
      next(new Error('Empty auth token'))
    }

    const decoded = (await jwt.verify(token, opt.config.auth.tokenSecretKey)) as jwt.JwtPayload

    const userId = decoded.userId

    // save user id to socket
    if (userId) {
      socket.data.userId = Number(userId)
    }

    next()
  } catch (err) {
    if (err instanceof Error) {
      logger.error('failed to verify access token')

      if (err.name === 'TokenExpiredError') {
        next(new Error('Token expired. Please login again.'))
      } else if (err.name === 'JsonWebTokenError') {
        next(new Error('Invalid token. Please try again.'))
      } else {
        console.error(err)
        next(new Error('Internal server error.'))
      }
    }
  }
}

export enum EventErrorType {
  Client = 'client_error',
  Server = 'server_error',
}

export interface EventError extends Error {
  type: EventErrorType
  details?: string
}

export const isEventError = (obj: any): obj is EventError => {
  return typeof obj === 'object' && 'type' in obj && 'message' in obj
}

export const eventError = (err: Pick<EventError, 'type' | 'message' | 'details'>) => {
  return { ...err, name: 'Error' }
}
