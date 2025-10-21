import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow frontend to connect
  },
})
export class OrderGateway {
  @WebSocketServer()
  server: Server;

  /**
   * Called by service layer to send an update to all clients tracking this order.
   */
  sendOrderUpdate(orderId: string, data: any) {
    this.server.to(orderId).emit('orderUpdate', data);
  }

  /**
   * Called when a client subscribes to track a specific order.
   */
  @SubscribeMessage('trackOrder')
  handleTrackOrder(
    @MessageBody() orderId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(orderId);
    client.emit('joinedOrderRoom', { orderId });
  }

  /**
   * Optional: Leave room
   */
  @SubscribeMessage('leaveOrder')
  handleLeaveOrder(
    @MessageBody() orderId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(orderId);
    client.emit('leftOrderRoom', { orderId });
  }
}
