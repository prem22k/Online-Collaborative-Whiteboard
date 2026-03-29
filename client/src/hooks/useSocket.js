import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../utils/constants';

export default function useSocket(canvasRef) {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SERVER_URL);

    socketRef.current.on('draw', (data) => {
      canvasRef.current?.drawRemoteStroke(data);
    });

    socketRef.current.on('undo', (data) => {
      canvasRef.current?.triggerRemoteUndo(data);
    });

    return () => {
      socketRef.current.off('draw');
      socketRef.current.off('undo');
      socketRef.current.disconnect();
    };
  }, []);

  return socketRef;
}
