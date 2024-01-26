import { Request, Router } from 'express'
import Joi from 'joi'
import multer from 'multer'
import {
  LoginUserRequestBody,
  LoginUserResponseBody,
  RegisterUserRequestBody,
  RegisterUserResponseBody,
  RouterContext,
  RouterOptions,
  UserRoutesInterface,
  authMiddleware,
  errorHandler,
} from './controller'
import { Err } from '../../service'
import {
  HttpErrType,
  newHttpErr,
  newHttpErrFromExpected,
  newInvalidRequestBodyErr,
  newValidationHttpErr,
} from './error'
import { expectedErrs } from '../../service/error'

const storage = multer.memoryStorage()
const upload = multer({ storage })

export class UserRoutes implements UserRoutesInterface {
  public c: RouterContext

  constructor(opt: RouterOptions) {
    this.c = {
      logger: opt.logger,
      repository: opt.repository,
      services: opt.services,
      config: opt.config,
    }

    const r = Router()

    r.post('/register', errorHandler(opt, this.register))
    r.post('/login', this.login)
    r.post('/user/image', authMiddleware(opt), upload.single('file'), this.uploadImage)

    opt.handler.use('/', r)
  }

  register = async (req: Request<unknown, RegisterUserResponseBody, RegisterUserRequestBody>) => {
    const logger = this.c.logger.named('registerUser')

    // validate request body
    const validation = registerUserValidationSchema.validate(req.body)

    if (validation.error) {
      logger.info('invalid request body', validation.error)

      throw newInvalidRequestBodyErr(validation.error)
    }
    logger.debug('parsed request body', 'body', req.body)

    const { authToken } = await this.c.services.user.register(req.body).catch((err) => {
      if (Err.isExpected(err)) {
        logger.info('failed to register user', 'err', err)
        throw newHttpErrFromExpected(err)
      }

      logger.error('failed to register user', 'err', err)
      throw newHttpErr({ type: HttpErrType.Server, message: 'Failed to register user' })
    })
    logger.info('successfully registered user')

    return { authToken }
  }

  login = async (req: Request<unknown, LoginUserResponseBody, LoginUserRequestBody>) => {
    const logger = this.c.logger.named('loginUser')

    // validate request body
    const validation = loginUserValidationSchema.validate(req.body)

    if (validation.error) {
      logger.info('failed to parse body', validation.error)

      throw newInvalidRequestBodyErr(validation.error)
    }
    logger.debug('parsed request body', 'body', req.body)

    const { authToken } = await this.c.services.user.login(req.body).catch((err) => {
      if (Err.isExpected(err)) {
        logger.info('failed to login user', 'err', err)
        throw newHttpErrFromExpected(err)
      }

      logger.error('failed to login user', 'err', err)
      throw newHttpErr({ type: HttpErrType.Server, message: 'Failed to login user' })
    })
    logger.info('successfully login user')

    return { authToken }
  }

  uploadImage = async (req: Request<unknown, string, File>) => {
    const logger = this.c.logger.named('uploadUserImage')

    const allowedMimeTypes = ['image/jpeg', 'image/png']
    const maxAllowedSizeInBytes = this.c.config.fileUploading.maxSize
    const maxAllowedSizeInMB = maxAllowedSizeInBytes / 1024 / 1024

    const file = req.file

    if (!file) {
      logger.info('File is empty')
      throw newHttpErrFromExpected(expectedErrs.uploadFile.NoFileUploaded)
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      logger.info('File mime type is not allowed: ' + file.mimetype)
      throw newHttpErrFromExpected(expectedErrs.uploadFile.InvalidMimeType)
    }

    if (file.size > maxAllowedSizeInBytes) {
      logger.info('File size more than max allowed, size: ' + file.size)
      throw newValidationHttpErr(`Max allowed file size is ${maxAllowedSizeInMB}MB`)
    }

    const imageUrl = await this.c.services.user
      .uploadImage({
        userId: req.userId!,
        data: file.buffer,
      })
      .catch((err) => {
        if (Err.isExpected(err)) {
          logger.info('Failed to upload user image: ' + err)
          throw newHttpErrFromExpected(err)
        }

        logger.error('Failed to upload user image: ' + err)
        throw newHttpErr({ type: HttpErrType.Server, message: 'Failed to upload user image', details: err })
      })

    return { imageUrl }
  }
}

const registerUserValidationSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }),
  password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{4,30}$')).required(),
  username: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,15}$')).required(),
})

const loginUserValidationSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }),
  password: Joi.string().required(),
})
