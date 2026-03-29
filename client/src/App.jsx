import { useRef, useState } from 'react';
import Canvas from './components/Canvas';
import useSocket from './hooks/useSocket';
import useStatusPolling from './hooks/useStatusPolling';

function App() {
  const canvasRef = useRef(null);
  const socketRef = useSocket(canvasRef);
  const queueSize = useStatusPolling();
  const [stackSize, setStackSize] = useState(0);

  return (
    <div>
      <h1>Collaborative Whiteboard</h1>
      <Canvas
        ref={canvasRef}
        socket={socketRef.current}
        queueSize={queueSize}
        stackSize={stackSize}
        onStackSizeChange={setStackSize}
      />
    </div>
  );
}

export default App;
