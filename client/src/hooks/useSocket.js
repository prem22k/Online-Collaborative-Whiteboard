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

    return () => {
      socketInstance.off('draw');
      socketInstance.off('undo');
      socketInstance.off('clear');
      socketInstance.disconnect();
    };
  }, []);

  return socket;
}
