import {
  LoginUserOptions,
  LoginUserResponse,
  Options,
  RegisterUserOptions,
  RegisterUserResponse,
  UploadImageOptions,
  UserServiceInterface,
} from '.'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export class UserService implements UserServiceInterface {
  constructor(private us: Options) {}

  async register(opt: RegisterUserOptions): Promise<RegisterUserResponse> {
    const logger = this.us.logger.named('RegisterUser')

    try {
      logger.debug('args', opt)

      let user = await this.us.repository.user.getUserByEmail(opt.email).catch((err) => {
        logger.error('failed to get user by email through storage', err)
        throw new Error()
      })

      if (user) {
        logger.info('user with such email already exists')
        throw new Error('User with this email already exists')
      }

      user = await this.us.repository.user.getUserByUsername(opt.username).catch((err) => {
        logger.error('failed to get user by username through storage', err)
        throw new Error()
      })

      if (user) {
        logger.info('user with such username already exists')
        throw new Error('User with this username already exists')
      }

      const passwordHash = await bcrypt.hash(opt.password, 10).catch((err) => {
        logger.error('failed to hash password', err)
        throw new Error()
      })

      user = await this.us.repository.user
        .createUser({
          email: opt.email,
          username: opt.username,
          passwordHash,
        })
        .catch((err) => {
          logger.error('failed to create user in storage', err)
          throw new Error()
        })

      if (!user) {
        throw new Error()
      }

      const { tokenSecretKey, tokenLifeTime } = this.us.config.auth
      const authToken = jwt.sign({ userId: user.id! }, tokenSecretKey, {
        expiresIn: tokenLifeTime,
      })
      logger.debug('auth token generated')

      return { authToken }
    } catch (err) {
      logger.info('Failed to register user', err)

      if (err instanceof Error) {
        throw new Error(`Failed to register user: ${err.message}`)
      }

      throw new Error('Failed to register user')
    }
  }

  async login(opt: LoginUserOptions): Promise<LoginUserResponse> {
    const logger = this.us.logger.named('LoginUser')

    try {
      logger.debug('args', opt)

      const user = await this.us.repository.user.getUserByEmail(opt.email).catch((err) => {
        logger.error('failed to get user by email through storage', err)
        throw new Error()
      })

      if (!user) {
        logger.info('user with such email not found')
        throw new Error('User not found')
      }

      const passwordMatches = await bcrypt.compare(opt.password, user.passwordHash).catch((err) => {
        logger.error('failed to compare password', err)
        throw new Error()
      })

      if (!passwordMatches) {
        logger.info('password not matches')
        throw new Error('Invalid password')
      }

      const { tokenSecretKey, tokenLifeTime } = this.us.config.auth
      const authToken = jwt.sign({ userId: user.id! }, tokenSecretKey, {
        expiresIn: tokenLifeTime,
      })
      logger.debug('auth token generated')

      return { authToken }
    } catch (err) {
      logger.info('Failed to login user', err)

      if (err instanceof Error) {
        throw new Error(`Failed to login user: ${err.message}`)
      }

      throw new Error('Failed to login user')
    }
  }

  uploadImage = async (opt: UploadImageOptions) => {
    const logger = this.us.logger.named('uploadUserImageService')

    try {
      const imageUrl = await this.us.apis.file
        .uploadFile({
          data: opt.data,
          key: `user/images/${opt.userId}`,
        })
        .catch((err) => {
          logger.error('Filed to upload user image through awsS3: ' + err)
          throw new Error('Failed to save user image into storage')
        })

      await this.us.repository.user
        .updateUser({
          userId: opt.userId,
          user: { imageUrl },
        })
        .catch((err) => {
          logger.error('Failed to update user through db: ' + err)
          throw new Error('Failed to update user through database')
        })

      return imageUrl
    } catch (err) {
      logger.info('Failed to upload user image', err)

      if (err instanceof Error) {
        throw new Error(`Failed to upload user image: ${err.message}`)
      }

      throw new Error('Failed to upload user image')
    }
  }
}
