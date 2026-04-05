import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import UndoStack from '../utils/UndoStack';

const DPR = window.devicePixelRatio || 1;
const BASE_WIDTH = 1000;
const BASE_HEIGHT = 600;
const ASPECT = BASE_HEIGHT / BASE_WIDTH;

/** Convert a touch/mouse event to canvas-relative coordinates using cached rect. */
const getCanvasCoords = (canvas, e, cachedRect) => {
  let rect = cachedRect;
  if (!rect) {
    rect = canvas.getBoundingClientRect();
  }
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

  // Throttle socket emissions to ~30fps while drawing locally at full speed
  const lastEmitTime = useRef(0);
  const lastEmittedPos = useRef({ x: null, y: null });
  const EMIT_INTERVAL = 33; // ~30fps throttle for network emissions

  // Cached bounding rect — recalculated only on resize, not every mousemove
  const cachedRect = useRef(null);

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
    cachedRect.current = null;
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
    cachedRect.current = canvasRef.current.getBoundingClientRect();
    const { x, y } = getCanvasCoords(canvasRef.current, e, cachedRect.current);
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    isDrawing.current = true;
    currentStrokeId.current = Date.now() + Math.random().toString(36).substring(7);
    lastEmittedPos.current = { x: null, y: null };
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const { x, y } = getCanvasCoords(canvasRef.current, e, cachedRect.current);

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

    // Throttle socket emissions to ~30fps to reduce bandwidth and server load
    const now = Date.now();
    if (socket && now - lastEmitTime.current >= EMIT_INTERVAL) {
      const emitStartX = lastEmittedPos.current.x ?? lastX;
      const emitStartY = lastEmittedPos.current.y ?? lastY;

      socket.emit('draw', {
        ...strokeData,
        startX: emitStartX,
        startY: emitStartY,
      });
      lastEmitTime.current = now;
      lastEmittedPos.current = { x, y };
    }

    contextRef.current.lastX = x;
    contextRef.current.lastY = y;
  };

  const finishDrawing = (e) => {
    if (e) e.preventDefault();
    contextRef.current.closePath();
    if (isDrawing.current) {
      // Always emit the final segment so remote users see the complete stroke
      if (socket && contextRef.current.lastX != null) {
        const emitStartX = lastEmittedPos.current.x ?? contextRef.current.lastX;
        const emitStartY = lastEmittedPos.current.y ?? contextRef.current.lastY;
        socket.emit('draw', {
          strokeId: currentStrokeId.current,
          userId: socket.id,
          startX: emitStartX,
          startY: emitStartY,
          endX: contextRef.current.lastX,
          endY: contextRef.current.lastY,
          color: '#3b82f6',
          width: 4
        });
      }
      undoStack.current.push(currentStrokeId.current);
      onStackSizeChange(undoStack.current.size());
      if (addLogEntry) addLogEntry({ user: username || 'Anonymous', action: 'drew a stroke' });
    }
    isDrawing.current = false;
    contextRef.current.lastX = null;
    contextRef.current.lastY = null;
    cachedRect.current = null;
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

  const handleClear = () => {
    allStrokes.current = [];
    undoStack.current = new UndoStack();
    onStackSizeChange(0);
    redrawAllStrokes();
    if (socket) socket.emit('clear');
    if (addLogEntry) addLogEntry({ user: username || 'Anonymous', action: 'cleared the board' });
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
    <div className="canvas-wrap">
      <div className="canvas-header">
        <span>Queue: {queueSize}</span>
        <span>Stack: {stackSize}</span>
      </div>

      <canvas
        className="drawing-canvas"
        style={{ height: canvasHeight }}
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

      <div className="canvas-controls">
        <button
          className="btn btn-undo"
          onClick={handleUndo}
          disabled={stackSize === 0}
        >
          Undo
        </button>
        <button
          className="btn btn-clear"
          onClick={handleClear}
        >
          Clear Board
        </button>
      </div>
    </div>
  );
});

export default Canvas;
