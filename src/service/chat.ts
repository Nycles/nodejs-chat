import { Options, ChatServiceInterface, ListMessagesOptions, CreateMessageOptions, UpdateMessageOptions } from '.'

export class ChatService implements ChatServiceInterface {
  constructor(private c: Options) {}

  listMessages = async (opt: ListMessagesOptions) => {
    const logger = this.c.logger.named('listMessagesService')

    try {
      logger.debug('args', opt)

      const room = await this.c.repository.chat.getRoom(opt.roomId).catch((err) => {
        logger.error('failed to get chat room from db', err)
        throw new Error('Failed to get chat room')
      })

      const isUserRoomParticipant = room?.participants?.find(({ id }) => id === opt.userId)

      if (!isUserRoomParticipant) {
        logger.info('user is not a chat participant')
        throw new Error('User should be a chat participant to get messages')
      }

      const messages = await this.c.repository.chat
        .listMessages({
          roomId: opt.roomId,
          page: opt.page,
          size: opt.size,
        })
        .catch((err) => {
          logger.error('failed to get chat messages from db', err)
          throw new Error('Failed to get chat messages')
        })

      return { messages: messages || [] }
    } catch (err) {
      logger.info('failed to get chat messages', err)

      if (err instanceof Error) {
        throw new Error(`Failed to get chat messages: ${err.message}`)
      }

      throw new Error('Failed to get chat messages')
    }
  }

  createMessage = async (opt: CreateMessageOptions) => {
    const logger = this.c.logger.named('createMessageService')

    try {
      logger.debug('args', opt)

      const room = await this.c.repository.chat.getRoom(opt.roomId).catch((err) => {
        logger.error('failed to get chat room', err)
        throw new Error(`Failed to get chat room ${err}`)
      })

      if (!room) {
        logger.info('chat room not exists')
        throw new Error(`Chat room not exists`)
      }

      const isUserRoomParticipant = room?.participants?.find(({ id }) => id === opt.userId)

      if (!isUserRoomParticipant) {
        logger.info('user is not chat room participant')
        throw new Error('User is not chat room participant')
      }

      const message = await this.c.repository.chat
        .createMessage({
          roomId: opt.roomId,
          content: opt.content,
          createdBy: opt.userId,
        })
        .catch((err) => {
          logger.error('failed to create a message', err)
          throw new Error(`Failed to create a message ${err}`)
        })

      return { room, message }
    } catch (err) {
      logger.info('failed to create message', err)

      if (err instanceof Error) {
        throw new Error(`Failed to create message: ${err.message}`)
      }

      throw new Error('Failed to create message')
    }
  }

  updateMessage = async (opt: UpdateMessageOptions) => {
    const logger = this.c.logger.named('updateMessageService')

    try {
      logger.debug('args', opt)

      let message = await this.c.repository.chat.getMessage(opt.messageId).catch((err) => {
        logger.error('failed to get message', err)
        throw new Error(`Failed to get message ${err}`)
      })

      if (!message) {
        logger.info('message not exists')
        throw new Error('Message not exists')
      }

      if (message.createdBy !== opt.userId) {
        logger.info('user is not message creator')
        throw new Error('User is not message creator')
      }

      const room = await this.c.repository.chat.getRoom(message.roomId).catch((err) => {
        logger.error('failed to get chat room', err)
        throw new Error(`Failed to get chat room ${err}`)
      })

      if (!room) {
        logger.info('chat room not exists')
        throw new Error(`Chat room not exists`)
      }

      const isUserStillRoomParticipant = room?.participants?.find(({ id }) => id === opt.userId)

      if (!isUserStillRoomParticipant) {
        logger.info('user is not chat room participant')
        throw new Error('User is not chat room participant')
      }

      message = await this.c.repository.chat
        .updateMessage({
          id: message.id,
          content: opt.content,
        })
        .catch((err) => {
          logger.error('failed to update message', err)
          throw new Error(`Failed to update message ${err}`)
        })

      return { room, message }
    } catch (err) {
      logger.info('failed to update message', err)

      if (err instanceof Error) {
        throw new Error(`Failed to update message: ${err.message}`)
      }

      throw new Error('Failed to update message')
    }
  }
}
