import { Config } from '../../config/app'
import { Message, Room } from '../domain/entities/chat'
import { Logger } from '../domain/interfaces/logger'
import { Repository } from '../domain/repositories'
import { Apis } from './apis'

export interface Services {
  user: UserServiceInterface
  chat: ChatServiceInterface
}

export interface Options {
  apis: Apis
  repository: Repository
  logger: Logger
  config: Config
}

export interface RegisterUserOptions {
  email: string
  password: string
  username: string
}

export interface RegisterUserResponse {
  authToken: string
}

export interface LoginUserOptions {
  email: string
  password: string
}

export interface LoginUserResponse {
  authToken: string
}

export interface UploadImageOptions {
  data: Buffer
  userId: number
}

export interface UserServiceInterface {
  register: (opt: RegisterUserOptions) => Promise<RegisterUserResponse>
  login: (opt: LoginUserOptions) => Promise<LoginUserResponse>
  uploadImage: (opt: UploadImageOptions) => Promise<string>
}

export interface ListMessagesOptions {
  userId: number
  roomId: number
  page?: number
  size?: number
}

export interface ListMessagesResponse {
  messages: Message[]
}

export interface CreateMessageOptions {
  roomId: number
  userId: number
  content: string
}

export interface CreateMessageResponse {
  room: Room
  message: Message
}

export interface UpdateMessageOptions {
  messageId: number
  userId: number
  content: string
}

export interface UpdateMessageResponse {
  room: Room
  message: Message
}

export interface ChatServiceInterface {
  createMessage: (opt: CreateMessageOptions) => Promise<CreateMessageResponse>
  updateMessage: (opt: UpdateMessageOptions) => Promise<UpdateMessageResponse>
  listMessages: (opt: ListMessagesOptions) => Promise<ListMessagesResponse>
}

export interface Err {
  name: string
  message: string
  code: string
}

export const Err = {
  new: (message: string, code: string): Err => {
    return { name: code, message, code }
  },

  isExpected: (err: Error): err is Err => {
    return 'code' in err && 'message' in err
  },

  getCode: (err: Error): string => {
    const isExpected = Err.isExpected(err)

    if (!isExpected) {
      return ''
    }

    return err.code
  },
}
