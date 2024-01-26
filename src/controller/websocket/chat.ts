import {
  ChatEventsInterface,
  UpdateMessageData,
  EventsOptions,
  CreateMessageData,
  eventError,
  EventErrorType,
  isEventError,
  authMiddleware,
} from './controller'

export class ChatEvents implements ChatEventsInterface {
  private c: EventsOptions

  constructor(opt: EventsOptions) {
    this.c = opt

    this.c.socket.on('message', authMiddleware(opt)).on('message', this.createMessage)
    this.c.socket.on('message_update', authMiddleware(opt)).on('message_update', this.updateMessage)
  }

  createMessage = async (data: CreateMessageData) => {
    const logger = this.c.logger.named('createMessage')

    try {
      const userId = this.c.socket.data.userId
      const users = this.c.socket.data.users

      console.log('userId:', userId, 'users', users.keys(), 'args:', data)

      const { room, message } = await this.c.services.chat
        .createMessage({
          roomId: data.roomId,
          userId,
          content: data.content,
        })
        .catch((err) => {
          logger.error('failed to create new message', err)
          throw eventError({ type: EventErrorType.Server, message: 'Failed to create new message', details: err })
        })

      // send message to all connected room participants
      room?.participants?.map(({ id }) => {
        if (id !== userId) {
          const socket = users.get(id!)

          if (socket) {
            socket.emit('message', message)
          }
        }
      })
    } catch (err) {
      let error = new Error('Failed to send new message')

      if (isEventError(err)) {
        error = err
      }

      this.c.socket.emit('error', error)
    }
  }

  updateMessage = async (data: UpdateMessageData) => {
    const logger = this.c.logger.named('updateMessage')

    try {
      const userId = this.c.socket.data.userId
      const users = this.c.socket.data.users

      console.log('userId:', userId, 'users', users.keys(), 'args:', data)

      const { room, message } = await this.c.services.chat
        .updateMessage({
          messageId: data.messageId,
          userId,
          content: data.content,
        })
        .catch((err) => {
          logger.error('failed to update message', err)
          throw eventError({ type: EventErrorType.Server, message: 'Failed to update message', details: err })
        })

      // update message for all connected room participants
      room?.participants?.map(({ id }) => {
        if (id !== userId) {
          const socket = users.get(id!)

          if (socket) {
            socket.emit('message_update', message)
          }
        }
      })
    } catch (err) {
      this.c.socket.emit('error', {
        message: 'Failed to update message',
        details: err,
      })
    }
  }
}
