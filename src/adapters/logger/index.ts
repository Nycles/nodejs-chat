import winston from 'winston'

export const NewWinston = (options?: winston.LoggerOptions) => {
  const defaultOptions = {
    level: 'debug',
    format: winston.format.simple(),
    transports: [new winston.transports.Console()],
    ...options,
  }

  const logger = winston.createLogger(defaultOptions)

  const customMethods = {
    named(name: string) {
      const currentFormat = logger.format

      const updatedFormat = winston.format.combine(
        winston.format.label({ label: name }),
        currentFormat
      )

      const newLogger = NewWinston({
        ...logger,
        format: updatedFormat,
      })

      return newLogger
    },
  }

  return Object.assign(logger, customMethods)
}
