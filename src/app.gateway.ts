import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';

@WebSocketGateway(3001)
export class AppGateway implements OnGatewayConnection {
  @WebSocketServer()
  wss;

  handleConnection(client) {
    client.emit('connection', 'Succesfully connected to server');
  }
}
