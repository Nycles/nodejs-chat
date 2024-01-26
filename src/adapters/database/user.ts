import { Pool } from 'pg'
import { UpdateUserOptions, UserRepositoryInterface } from '../../domain/repositories'
import { User } from '../../domain/entities/user'
import { parseResult } from './database'

export class UserRepository implements UserRepositoryInterface {
  constructor(private db: Pool) {
    this.db = db
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.db.query<User>(`SELECT * FROM users WHERE email = $1`, [email])

    const user = parseResult(result)

    return user
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await this.db.query<User>(`SELECT * FROM users WHERE username = $1`, [username])

    const user = parseResult(result)

    return user
  }

  async createUser(user: User): Promise<User | null> {
    const { email, passwordHash, username } = user

    const result = await this.db.query<User>(
      'INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING *',
      [email, passwordHash, username]
    )

    return parseResult(result)
  }

  async updateUser(options: UpdateUserOptions): Promise<User | null> {
    const { userId, user } = options

    const result = await this.db.query<User>('UPDATE users SET image_url = $2 WHERE id = $1 RETURNING *', [
      userId,
      user.imageUrl,
    ])

    return parseResult(result)
  }
}
