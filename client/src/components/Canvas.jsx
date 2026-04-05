import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import UndoStack from '../utils/UndoStack';

const DPR = window.devicePixelRatio || 1;
const BASE_WIDTH = 1000;
const BASE_HEIGHT = 600;
const ASPECT = BASE_HEIGHT / BASE_WIDTH;

const styles = {
  container: {
    fontFamily: 'sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 0,
    flex: '1 1 auto',
    maxWidth: BASE_WIDTH,
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: '8px',
    fontSize: '13px',
    color: '#333',
    flexWrap: 'wrap',
    gap: '4px',
  },
  canvas: {
    border: '1px solid #000',
    cursor: 'crosshair',
    backgroundColor: '#fff',
    width: '100%',
    touchAction: 'none',
  },
  controls: {
    marginTop: '10px',
    display: 'flex',
    width: '100%',
    gap: '10px',
  },
  button: {
    padding: '10px 16px',
    fontFamily: 'sans-serif',
    fontSize: '15px',
    border: '1px solid #666',
    backgroundColor: '#eee',
    cursor: 'pointer',
    borderRadius: '6px',
    flex: 1,
    minHeight: '44px',
  },
};

/** Convert a touch/mouse event to canvas-relative coordinates. */
const getCanvasCoords = (canvas, e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = BASE_WIDTH / rect.width;
  const scaleY = BASE_HEIGHT / rect.height;
  let clientX, clientY;

  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
};

const Canvas = forwardRef(({ socket, queueSize, stackSize, onStackSizeChange, username, addLogEntry }, ref) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  // State Refs for drawing loop
  const isDrawing = useRef(false);
  const currentStrokeId = useRef(null);

  // Data Structures
  const undoStack = useRef(new UndoStack());
  const allStrokes = useRef([]);

  // Responsive canvas height derived from current width
  const [canvasHeight, setCanvasHeight] = useState('auto');

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const displayWidth = parent.clientWidth;
    const displayHeight = Math.round(displayWidth * ASPECT);
    canvas.style.height = displayHeight + 'px';
    setCanvasHeight(displayHeight + 'px');
  }, []);

  // Initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = BASE_WIDTH * DPR;
    canvas.height = BASE_HEIGHT * DPR;
    canvas.style.width = '100%';

    const ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    contextRef.current = ctx;

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Expose receiving methods to App.jsx
  useImperativeHandle(ref, () => ({
    drawRemoteStroke: (data) => {
      drawLineSegment(data.startX, data.startY, data.endX, data.endY, data.color, data.width);
      allStrokes.current.push({ ...data, isRemote: true });
    },
    triggerRemoteUndo: (undoData) => {
      allStrokes.current = allStrokes.current.filter(
        stroke => stroke.strokeId !== undoData.targetStrokeId
      );
      redrawAllStrokes();
    },
    triggerRemoteClear: () => {
      allStrokes.current = [];
      undoStack.current = new UndoStack();
      onStackSizeChange(0);
      redrawAllStrokes();
    }
  }));

  const drawLineSegment = (x1, y1, x2, y2, color = '#3b82f6', width = 4) => {
    const ctx = contextRef.current;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
  };

  const redrawAllStrokes = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    allStrokes.current.forEach(stroke => {
      drawLineSegment(stroke.startX, stroke.startY, stroke.endX, stroke.endY, stroke.color, stroke.width);
    });
  };

  // --- Unified drawing handlers (mouse + touch) ---

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(canvasRef.current, e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    isDrawing.current = true;
    currentStrokeId.current = Date.now() + Math.random().toString(36).substring(7);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const { x, y } = getCanvasCoords(canvasRef.current, e);

    const lastX = contextRef.current.lastX || x;
    const lastY = contextRef.current.lastY || y;

    drawLineSegment(lastX, lastY, x, y, '#3b82f6', 4);

    const strokeData = {
      strokeId: currentStrokeId.current,
      userId: socket?.id || 'local',
      startX: lastX,
      startY: lastY,
      endX: x,
      endY: y,
      color: '#3b82f6',
      width: 4
    };

    allStrokes.current.push(strokeData);
    if (socket) socket.emit('draw', strokeData);

    contextRef.current.lastX = x;
    contextRef.current.lastY = y;
  };

  const finishDrawing = (e) => {
    if (e) e.preventDefault();
    contextRef.current.closePath();
    if (isDrawing.current) {
      undoStack.current.push(currentStrokeId.current);
      onStackSizeChange(undoStack.current.size());
      if (addLogEntry) addLogEntry({ user: username || 'Anonymous', action: 'drew a stroke' });
    }
    isDrawing.current = false;
    contextRef.current.lastX = null;
    contextRef.current.lastY = null;
  };

  const handleUndo = () => {
    if (undoStack.current.isEmpty()) return;

    const targetStrokeId = undoStack.current.pop();
    onStackSizeChange(undoStack.current.size());

    allStrokes.current = allStrokes.current.filter(
      stroke => stroke.strokeId !== targetStrokeId
    );

    redrawAllStrokes();

    if (socket) socket.emit('undo', { userId: socket.id, targetStrokeId });
    if (addLogEntry) addLogEntry({ user: username || 'Anonymous', action: 'performed undo' });
  };

  // Listen for Ctrl+Z globally
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>Queue: {queueSize}</div>
        <div>Undo Stack: {stackSize}</div>
      </div>

      <canvas
        style={{ ...styles.canvas, height: canvasHeight }}
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={finishDrawing}
        onTouchCancel={finishDrawing}
      />

      <div style={styles.controls}>
        <button
          style={styles.button}
          onClick={handleUndo}
          disabled={stackSize === 0}
        >
          Undo
        </button>
        <button
          style={styles.button}
          onClick={() => {
            allStrokes.current = [];
            undoStack.current = new UndoStack();
            onStackSizeChange(0);
            redrawAllStrokes();
            if (socket) socket.emit('clear');
            if (addLogEntry) addLogEntry({ user: username || 'Anonymous', action: 'cleared the board' });
          }}
        >
          Clear Board
        </button>
      </div>
    </div>
  );
});

export default Canvas;
