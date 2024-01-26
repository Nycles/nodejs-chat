import io from 'socket.io'

interface WebSocketI {
  wss: io.Server
}

export class WebSocketServer implements WebSocketI {
  public wss: io.Server

  constructor(server: any) {
    this.wss = new io.Server(server, {
      cors: { origin: '*' },
    })

    this.wss.on('connection', (socket) => {
      const url = socket.handshake.url

      console.log('WebSocket connection opened with URL:', url)
    })
  }
}
