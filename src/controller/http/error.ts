import { Err } from '../../service'

export enum HttpErrType {
  Client = 'client',
  Server = 'server',
}

export enum ErrCode {
  Validation = 'validation',
}

interface HttpErr {
  type: HttpErrType
  message: string
  code?: string
  details?: Error
}

export const newHttpErr = (err: HttpErr): HttpErr => {
  return err
}

export const newHttpErrFromExpected = (err: Error): HttpErr => {
  return {
    type: HttpErrType.Client,
    message: err.message,
    code: Err.getCode(err),
  }
}

export const newValidationHttpErr = (message: string, err?: Error): HttpErr => {
  return {
    type: HttpErrType.Client,
    message: message,
    code: ErrCode.Validation,
    details: err,
  }
}

export const newInvalidRequestBodyErr = (err: Error): HttpErr => {
  return newValidationHttpErr('invalid request body', err)
}

export const newInvalidRequestQueryErr = (err: Error): HttpErr => {
  return newValidationHttpErr('invalid request query', err)
}

export const newInvalidPathParamsErr = (err: Error): HttpErr => {
  return newValidationHttpErr('invalid request path params', err)
}

export const isHttpErr = (obj: any): obj is HttpErr => {
  return typeof obj === 'object' && 'message' in obj && 'code' in obj
}
