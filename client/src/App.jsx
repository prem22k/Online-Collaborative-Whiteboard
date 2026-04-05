import { useRef, useState, useEffect } from 'react';
import Canvas from './components/Canvas';
import ActivityLog from './components/ActivityLog';
import useSocket from './hooks/useSocket';
import useStatusPolling from './hooks/useStatusPolling';

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'sans-serif',
    minWidth: 0,
    overflow: 'hidden',
  },
  title: {
    fontSize: 'clamp(18px, 4vw, 28px)',
    marginBottom: '10px',
  },
  body: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: '20px',
  },
};

export default function App() {
  const canvasRef = useRef(null);
  const socket = useSocket(canvasRef);
  const queueSize = useStatusPolling();
  const [stackSize, setStackSize] = useState(0);
  const [username, setUsername] = useState('');
  const [activityLog, setActivityLog] = useState([]);

  useEffect(() => {
    if (!socket) return;
    const onActivity = (entry) => {
      setActivityLog((prev) => [...prev, entry]);
    };
    socket.on('activity', onActivity);
    return () => socket.off('activity', onActivity);
  }, [socket]);

  const addLogEntry = (entry) => {
    const entryWithTimestamp = { ...entry, timestamp: Date.now() };
    setActivityLog((prev) => [...prev, entryWithTimestamp]);
    if (socket) socket.emit('activity', entryWithTimestamp);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Collaborative Whiteboard</h1>
      <div style={styles.body}>
        <Canvas
          ref={canvasRef}
          socket={socket}
          queueSize={queueSize}
          stackSize={stackSize}
          onStackSizeChange={setStackSize}
          username={username}
          addLogEntry={addLogEntry}
        />
        <ActivityLog
          username={username}
          onUsernameChange={setUsername}
          activityLog={activityLog}
        />
      </div>
    </div>
  );
}
