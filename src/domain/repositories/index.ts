import { Message, Room } from '../entities/chat'
import { User } from '../entities/user'

export interface Repository {
  user: UserRepositoryInterface
  chat: ChatRepositoryInterface
}

export interface UpdateUserOptions {
  userId: number
  user: Partial<Pick<User, 'imageUrl'>>
}

export interface UserRepositoryInterface {
  getUserByEmail: (email: string) => Promise<User | null>
  getUserByUsername: (username: string) => Promise<User | null>
  createUser: (user: User) => Promise<User | null>
  updateUser: (user: UpdateUserOptions) => Promise<User | null>
}

export interface ListMessagesFilter {
  roomId: number
  page?: number
  size?: number
}

export interface ChatRepositoryInterface {
  createRoom: (room: Partial<Room>) => Promise<Room>
  listRooms: (userId: number) => Promise<Room[] | null>
  getRoom: (roomId: number) => Promise<Room | null>
  createMessage: (message: Partial<Message>) => Promise<Message>
  updateMessage: (message: Pick<Message, 'id' | 'content'>) => Promise<Message>
  listMessages: (filter: ListMessagesFilter) => Promise<Message[] | null>
  getMessage: (id: number) => Promise<Message | null>
}
