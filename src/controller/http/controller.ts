import { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import jwt from 'jsonwebtoken'
import { Services } from '../../service'
import { Repository } from '../../domain/repositories'
import { Logger } from '../../domain/interfaces/logger'
import { Express } from 'express'
import { UserRoutes } from './user'
import { Message } from '../../domain/entities/chat'
import { ChatRoutes } from './chat'
import { Config } from '../../../config/app'
import { ErrCode, HttpErrType, isHttpErr } from './error'

export const New = (opt: Options) => {
  const router = Router()

  router.get('/', (_, res) => res.send('Chat API :)'))

  opt.handler.use('/api/v1', router)

  const routerOptions = {
    handler: router,
    repository: opt.repository,
    services: opt.services,
    logger: opt.logger,
    config: opt.config,
  }

  new UserRoutes(routerOptions)
  new ChatRoutes(routerOptions)
}

export interface Options {
  handler: Express
  repository: Repository
  services: Services
  logger: Logger
  config: Config
}

export interface RouterOptions {
  handler: Router
  repository: Repository
  services: Services
  logger: Logger
  config: Config
}

export interface RouterContext {
  repository: Repository
  services: Services
  logger: Logger
  config: Config
}

export interface RegisterUserRequestBody {
  email: string
  password: string
  username: string
}

export interface RegisterUserResponseBody {
  authToken: string
}

export interface LoginUserRequestBody {
  email: string
  password: string
  username: string
}

export interface LoginUserResponseBody {
  authToken: string
}

export interface UploadImageRequestBody {
  file: Buffer
}

export interface ListMessagesRequestQuery {
  roomId: number
  page?: number
  size?: number
}

export interface ListMessagesResponseBody {
  messages: Message[]
}

export interface UserRoutesInterface {
  register: (
    req: Request<unknown, RegisterUserResponseBody, RegisterUserRequestBody>,
    res: Response
  ) => Promise<RegisterUserResponseBody>
  login: (req: Request<unknown, LoginUserResponseBody, LoginUserRequestBody>, res: Response) => void
  uploadImage: (req: Request<unknown, string, File>, res: Response) => void
}

export interface ChatRoutesInterface {
  listMessages: (
    req: Request<unknown, ListMessagesResponseBody, unknown, ListMessagesRequestQuery>,
    res: Response
  ) => void
}

export const authMiddleware =
  (opt: RouterOptions) =>
  async (req: Request<any, any, any, any> & { userId?: number }, res: Response, next: NextFunction) => {
    const logger = opt.logger.named('authMiddleware')

    try {
      const tokenStringRaw = req.headers.authorization

      if (!tokenStringRaw) {
        logger.info('empty authorization header')
        res.status(401).json({ message: 'empty auth token' })
      }

      const tokenArray = tokenStringRaw!.split(' ')
      if (tokenArray?.length != 2) {
        logger.info('malformed auth token')
        res.status(401).json({ message: 'malformed auth token' })
      }

      const token = tokenArray[1]
      const decoded = (await jwt.verify(token, opt.config.auth.tokenSecretKey)) as jwt.JwtPayload

      // save user id to req
      if (decoded.userId) {
        req.userId = Number(decoded.userId)
      }

      next()
    } catch (err) {
      if (err instanceof Error) {
        logger.error('failed to verify access token')

        if (err.name === 'TokenExpiredError') {
          res.status(401).send({ message: 'Token expired. Please login again.' })
        } else if (err.name === 'JsonWebTokenError') {
          res.status(401).send({ message: 'Invalid token. Please try again.' })
        } else {
          // Handle other errors
          console.error(err)
          res.status(500).send({ message: 'Internal server error.' })
        }
      }
    }
  }

export const errorHandler = (opt: RouterOptions, handler: RequestHandler) => {
  const logger = opt.logger.named('errorHandler')

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = await handler(req, res, next)

      res.status(200).json(body)
    } catch (err) {
      if (!isHttpErr(err)) {
        logger.error('Unknown error: ' + err)
        return res.status(500).json({ message: 'Unknown error' })
      }

      if (err.type === HttpErrType.Server) {
        return res.status(500).json({ message: err.message })
      }

      if (err.code === ErrCode.Validation) {
        // TODO: add additional info about validation error
        return res.status(422).json({ code: err.code, message: err.message })
      }

      res.status(422).json({ code: err.code, message: err.message })
    }
  }
}

// Extend express Request interface by adding custom fields
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number
    }
  }
}
