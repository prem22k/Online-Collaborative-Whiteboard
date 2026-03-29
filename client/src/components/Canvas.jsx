import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import UndoStack from '../utils/UndoStack';

const styles = {
  container: {
    fontFamily: 'sans-serif',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '1000px',
    marginBottom: '10px',
    fontSize: '14px',
    color: '#333'
  },
  canvas: {
    border: '1px solid #000',
    cursor: 'crosshair',
    backgroundColor: '#fff'
  },
  controls: {
    marginTop: '10px',
    display: 'flex',
    width: '1000px',
    gap: '10px'
  },
  button: {
    padding: '6px 12px',
    fontFamily: 'sans-serif',
    fontSize: '14px',
    border: '1px solid #666',
    backgroundColor: '#eee',
    cursor: 'pointer'
  }
};

const Canvas = forwardRef(({ socket, queueSize, stackSize, onStackSizeChange }, ref) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  
  // State Refs for drawing loop
  const isDrawing = useRef(false);
  const currentStrokeId = useRef(null);
  
  // Data Structures
  const undoStack = useRef(new UndoStack());     // Local history
  const allStrokes = useRef([]);                 // Global history (both local and remote)

  // Initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 1000 * 2; // Support high-DPI screens
    canvas.height = 600 * 2;
    canvas.style.width = '1000px';
    canvas.style.height = '600px';

    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#3b82f6'; // Bright blue default
    ctx.lineWidth = 4;
    contextRef.current = ctx;
  }, []);

  // Expose receiving methods to App.jsx
  useImperativeHandle(ref, () => ({
    drawRemoteStroke: (data) => {
      // 1. Physically draw line
      drawLineSegment(data.startX, data.startY, data.endX, data.endY, data.color, data.width);
      
      // 2. Add to global history
      allStrokes.current.push({ ...data, isRemote: true });
    },
    triggerRemoteUndo: (undoData) => {
      // Remove the last stroke that belongs to the user who requested undo
      const strokes = allStrokes.current;
      for (let i = strokes.length - 1; i >= 0; i--) {
        if (strokes[i].userId === undoData.userId) {
          strokes.splice(i, 1);
          redrawAllStrokes();
          break;
        }
      }
    }
  }));

  // Helper physically draws a line segment on Context
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

  // Helper physically clears screen and redraws global tracking array
  const redrawAllStrokes = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    allStrokes.current.forEach(stroke => {
      drawLineSegment(stroke.startX, stroke.startY, stroke.endX, stroke.endY, stroke.color, stroke.width);
    });
  };

  // --- HTML5 Mouse Event Listeners ---

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    isDrawing.current = true;
    
    // Generate a unique ID for this stroke group
    currentStrokeId.current = Date.now() + Math.random().toString(36).substring(7);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing.current) return;
    
    const { offsetX, offsetY } = nativeEvent;
    // We need the previous position to create a segment line
    const lastX = contextRef.current.lastX || offsetX;
    const lastY = contextRef.current.lastY || offsetY;

    // Draw Locally
    drawLineSegment(lastX, lastY, offsetX, offsetY, '#3b82f6', 4);

    // Package the segment
    const strokeData = {
      strokeId: currentStrokeId.current,
      userId: socket?.id || 'local',
      startX: lastX,
      startY: lastY,
      endX: offsetX,
      endY: offsetY,
      color: '#3b82f6',
      width: 4
    };

    // Save to global tracking and emit
    allStrokes.current.push(strokeData);
    if (socket) socket.emit('draw', strokeData);

    contextRef.current.lastX = offsetX;
    contextRef.current.lastY = offsetY;
  };

  const finishDrawing = () => {
    contextRef.current.closePath();
    if (isDrawing.current) {
      // Mark stroke as completed and push ID to local LIFO stack
      undoStack.current.push(currentStrokeId.current);
      onStackSizeChange(undoStack.current.size()); // Update Dashboard UI
    }
    isDrawing.current = false;
    contextRef.current.lastX = null;
    contextRef.current.lastY = null;
  };

  const handleUndo = () => {
    if (undoStack.current.isEmpty()) return;

    // 1. Pop LIFO UndoStack (getting the Stroke ID to remove)
    const targetStrokeId = undoStack.current.pop();
    onStackSizeChange(undoStack.current.size());

    // 2. Remove all segments of that stroke from the global tracking array
    allStrokes.current = allStrokes.current.filter(
      stroke => stroke.strokeId !== targetStrokeId
    );

    // 3. Clear and render Canvas with updated tracking array
    redrawAllStrokes();

    // 4. Broadcast the Undo operation
    if (socket) socket.emit('undo', { userId: socket.id, targetStrokeId });
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
        <div>Queue (FIFO) length: {queueSize}</div>
        <div>Undo Stack (LIFO) length: {stackSize}</div>
      </div>

      <canvas
        style={styles.canvas}
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing}
      />

      <div style={styles.controls}>
        <button 
          style={styles.button} 
          onClick={handleUndo} 
          disabled={stackSize === 0}
        >
          Undo (Ctrl+Z)
        </button>
        <button 
          style={styles.button} 
          onClick={() => {
            allStrokes.current = [];
            undoStack.current = new UndoStack();
            onStackSizeChange(0);
            redrawAllStrokes();
          }}
        >
          Clear Board
        </button>
      </div>

    </div>
  );
});

export default Canvas;
