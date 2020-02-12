import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';

@WebSocketGateway(3001)
export class AppGateway implements OnGatewayConnection {
  @WebSocketServer()
  wss;

  private logger = new Logger('AppGateway');

  handleConnection(client) {
    this.logger.log('New client connected');
    client.emit('connection', 'Succesfully connected to server');
  }
}
