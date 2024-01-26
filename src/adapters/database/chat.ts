import { Pool } from 'pg'
import { ChatRepositoryInterface, ListMessagesFilter } from '../../domain/repositories'
import { Message, Room } from '../../domain/entities/chat'
import { parseResult } from './database'
import { User } from '../../domain/entities/user'

export class ChatRepository implements ChatRepositoryInterface {
  private db: Pool

  constructor(db: Pool) {
    this.db = db
  }

  createRoom = async (room: Partial<Room>) => {
    const { name, createdBy } = room

    const result = await this.db.query<Room>('INSERT INTO rooms (name, created_by) VALUES ($1, $2) RETURNING *', [
      name,
      createdBy,
    ])

    return parseResult(result)!
  }

  listRooms = async (userId: number) => {
    const result = await this.db.query<Room[]>(
      'SELECT * FROM rooms WHERE id IN (SELECT room_id FROM users_rooms WHERE user_id = $1)',
      [userId]
    )

    return parseResult(result)
  }

  getRoom = async (roomId: number) => {
    // get room participants
    const usersResult = await this.db.query<Partial<User>[]>(
      'SELECT id, email, username FROM users WHERE id IN (SELECT user_id FROM users_rooms WHERE room_id = $1)',
      [roomId]
    )

    const participants = parseResult(usersResult) || undefined

    // get room
    const roomResult = await this.db.query<Room>('SELECT * FROM rooms WHERE id = $1', [roomId])

    const room = parseResult(roomResult)

    return {
      ...room,
      participants,
    } as Room
  }

  createMessage = async (message: Partial<Message>) => {
    const { content, roomId, createdBy } = message

    const result = await this.db.query<Message>(
      'INSERT INTO messages (content, room_id, created_by) VALUES ($1, $2, $3) RETURNING *',
      [content, roomId, createdBy]
    )

    return parseResult(result)!
  }

  updateMessage = async (message: Pick<Message, 'id' | 'content'>) => {
    const { id, content } = message

    const result = await this.db.query<Message>('UPDATE messages SET content = $2 WHERE id = $1 RETURNING *', [
      id,
      content,
    ])

    return parseResult(result)!
  }

  listMessages = async (filter: ListMessagesFilter) => {
    const { roomId, page = undefined, size = undefined } = filter

    let offset: number | undefined = undefined

    // get offset
    if (page && size && page > 1) {
      offset = (page - 1) * size
    }

    const result = await this.db.query<Message[]>(
      'SELECT * FROM messages WHERE room_id = $1 ORDER BY id ASC LIMIT $2 OFFSET $3',
      [roomId, size, offset]
    )

    return parseResult(result)
  }

  getMessage = async (id: number) => {
    const result = await this.db.query<Message>(`SELECT * FROM messages WHERE id = $1`, [id])

    return parseResult(result)
  }
}
