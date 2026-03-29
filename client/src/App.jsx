import { useRef, useState, useEffect } from 'react';
import Canvas from './components/Canvas';
import ActivityLog from './components/ActivityLog';
import useSocket from './hooks/useSocket';
import useStatusPolling from './hooks/useStatusPolling';

function App() {
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
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Collaborative Whiteboard</h1>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
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

export default App;
