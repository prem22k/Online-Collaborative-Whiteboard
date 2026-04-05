import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../utils/constants';

export default function useSocket(canvasRef) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = io(SERVER_URL);
    setSocket(socketInstance);

    socketInstance.on('draw', (data) => {
      canvasRef.current?.drawRemoteStroke(data);
    });

    socketInstance.on('undo', (data) => {
      canvasRef.current?.triggerRemoteUndo(data);
    });

    socketInstance.on('clear', () => {
      canvasRef.current?.triggerRemoteClear();
    });

    // Keep-alive: ping server every 10 minutes to prevent Render free tier spin-down
    const keepAlive = setInterval(() => {
      if (socketInstance.connected) {
        socketInstance.emit('ping');
      }
    }, 10 * 60 * 1000);

    return () => {
      clearInterval(keepAlive);
      socketInstance.off('draw');
      socketInstance.off('undo');
      socketInstance.off('clear');
      socketInstance.disconnect();
    };
  }, []);

  return socket;
}
