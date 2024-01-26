export interface Logger {
  named(name: string): Logger
  log(message: string, ...deps: any)
  debug(message: string, ...deps: any)
  info(message: string, ...deps: any)
  warn(message: string, ...deps: any)
  error(message: string, ...deps: any)
}
