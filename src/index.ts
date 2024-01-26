import express from 'express'
import { createServer } from 'http'
import { Pool } from 'pg'
import cors from 'cors'
import * as httpController from './controller/http'
import * as wsController from './controller/websocket'
import * as service from './service'
import { config } from '../config/app'
import { UserRepository, ChatRepository } from './adapters/database'
import { Repository } from './domain/repositories'
import { NewWinston } from './adapters/logger'
import { Logger } from './domain/interfaces/logger'
import { WebSocketServer } from './adapters/frameworks/ws'
import { Apis } from './service/apis'
import { AwsS3 } from './api/aws-s3'

const logger: Logger = NewWinston()

const postgresDB = new Pool(config.postgres)

postgresDB
  .connect()
  .then(() => {
    logger.info('Connected to PostgreSQL')
  })
  .catch((err) => {
    logger.error('Error connecting to PostgreSQL', err)
  })

const app = express()
const httpServer = createServer(app)

const { wss } = new WebSocketServer(httpServer)

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const apis: Apis = {
  file: new AwsS3(config, logger),
}

const repository: Repository = {
  user: new UserRepository(postgresDB),
  chat: new ChatRepository(postgresDB),
}

const serviceOptions = { apis, repository, logger, config }

const services: service.Services = {
  user: new service.UserService(serviceOptions),
  chat: new service.ChatService(serviceOptions),
}

const httpControllerOptions: httpController.Options = {
  handler: app,
  repository,
  services,
  logger,
  config,
}

const wsControllerOptions: wsController.Options = {
  server: wss,
  repository,
  services,
  logger,
  config,
}

httpController.New(httpControllerOptions)
wsController.New(wsControllerOptions)

httpServer.listen(config.port, () => {
  logger.info(`Server is running on port: ${config.port}`)
})
