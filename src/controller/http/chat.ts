import Joi from 'joi'
import { Request, Router } from 'express'
import {
  ChatRoutesInterface,
  ListMessagesRequestQuery,
  ListMessagesResponseBody,
  RouterContext,
  RouterOptions,
  authMiddleware,
} from './controller'
import { HttpErrType, newHttpErr, newHttpErrFromExpected, newInvalidRequestBodyErr } from './error'
import { Err } from '../../service'

export class ChatRoutes implements ChatRoutesInterface {
  private c: RouterContext

  constructor(opt: RouterOptions) {
    this.c = {
      logger: opt.logger,
      repository: opt.repository,
      services: opt.services,
      config: opt.config,
    }

    const r = Router()

    r.get('/messages', authMiddleware(opt), this.listMessages)

    opt.handler.use('/chat', r)
  }

  listMessages = async (req: Request<unknown, ListMessagesResponseBody, unknown, ListMessagesRequestQuery>) => {
    const logger = this.c.logger.named('listMessages')

    const validation = listMessagesValidationSchema.validate(req.query, {
      convert: true,
    })

    const query = validation.value

    if (validation.error) {
      logger.info('failed to parse body', validation.error)

      throw newInvalidRequestBodyErr(validation.error)
    }
    logger.debug('parsed request body', 'body', req.body)

    const messages = await this.c.services.chat
      .listMessages({
        roomId: query.roomId,
        userId: req.userId!,
        page: query.page,
        size: query.size,
      })
      .catch((err) => {
        if (Err.isExpected(err)) {
          logger.info('failed to get chat messages', err)
          throw newHttpErrFromExpected(err)
        }

        logger.error('failed to get chat messages', err)
        throw newHttpErr({ type: HttpErrType.Server, message: 'Failed to get chat messages', details: err })
      })

    return { messages }
  }
}

const listMessagesValidationSchema = Joi.object({
  roomId: Joi.number().integer().positive().required(),
  page: Joi.number().integer().positive().optional(),
  size: Joi.number().integer().positive().optional(),
})
