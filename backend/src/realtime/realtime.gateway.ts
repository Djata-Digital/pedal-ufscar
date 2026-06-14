import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private userSockets = new Map<string, string>();

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }

    console.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('register-user')
  registerUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId?: string; userType?: string },
  ) {
    if (data?.userId) {
      this.userSockets.set(data.userId, client.id);
      client.join(`user:${data.userId}`);
    }

    if (data?.userType === 'admin' || data?.userType === 'operator') {
      client.join('admins');
    }

    client.emit('registered', {
      ok: true,
      socketId: client.id,
    });
  }

  emitToAdmins(event: string, payload?: any) {
    this.server.to('admins').emit(event, payload || {});
  }

  emitToUser(userId: string, event: string, payload?: any) {
    this.server.to(`user:${userId}`).emit(event, payload || {});
  }

  emitToAll(event: string, payload?: any) {
    this.server.emit(event, payload || {});
  }
}