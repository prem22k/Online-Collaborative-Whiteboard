import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import UndoStack from './undoStack';

const Canvas = forwardRef(({ socket, queueSize, stackSize, onStackSizeChange }, ref) => {
  // useRef for the canvas element
  const canvasRef = useRef(null);
  // useRef for the UndoStack instance
  const undoStackRef = useRef(new UndoStack());
  // useRef for current stroke points array
  const currentStrokeRef = useRef([]);
  // useRef for all completed strokes array (for full redraw)
  const allStrokesRef = useRef([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  // Expose methods to the parent via useImperativeHandle
  useImperativeHandle(ref, () => ({
    // handle incoming remote strokes
    drawRemoteStroke: (strokeData) => {
      allStrokesRef.current.push(strokeData);
      undoStackRef.current.push(strokeData);
      
      redrawCanvas();
      
      // optionally update parent's stack size count if keeping in sync
      if (onStackSizeChange) {
        onStackSizeChange(undoStackRef.current.size());
      }
    },
    undoRemoteStroke: () => {
      undoStackRef.current.pop();
      allStrokesRef.current.pop();
      redrawCanvas();
      if (onStackSizeChange) {
        onStackSizeChange(undoStackRef.current.size());
      }
    }
  }));

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const drawLine = (p1, p2, strokeColor, lineWidth) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  };

  // Mouse event handlers
  const onMouseDown = (e) => {
    // start stroke, set isDrawing flag
    setIsDrawing(true);
    const pos = getCoordinates(e);
    currentStrokeRef.current = [{ ...pos }];
  };

  const onMouseMove = (e) => {
    // draw live if isDrawing
    if (!isDrawing) return;
    const pos = getCoordinates(e);
    const currentPoints = currentStrokeRef.current;
    const lastPos = currentPoints[currentPoints.length - 1];
    
    drawLine(lastPos, pos, color, brushSize);
    currentPoints.push({ ...pos });
  };

  const onMouseUp = () => {
    // finish stroke
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Ensure we actually drew something
    if (currentStrokeRef.current.length > 1) {
      const strokeData = {
        points: currentStrokeRef.current,
        color: color,
        brushSize: brushSize
      };

      // push to UndoStack
      undoStackRef.current.push(strokeData);
      // add to allStrokes
      allStrokesRef.current.push(strokeData);

      // emit 'draw' event via socket prop
      if (socket) {
        socket.emit('draw', strokeData);
      }

      // call onStackSizeChange prop with new size
      if (onStackSizeChange) {
        onStackSizeChange(undoStackRef.current.size());
      }
    }
    
    // clear current stroke buffer
    currentStrokeRef.current = [];
  };

  // A redrawCanvas() function that clears canvas and replays all strokes in allStrokes array
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // replay all strokes
    allStrokesRef.current.forEach((stroke) => {
      if (stroke.points && stroke.points.length > 1) {
        for (let i = 1; i < stroke.points.length; i++) {
          drawLine(
            stroke.points[i - 1], 
            stroke.points[i], 
            stroke.color, 
            stroke.brushSize
          );
        }
      }
    });
  };

  const handleUndo = () => {
    // Undo button: pop from UndoStack, remove last item from allStrokes
    const popped = undoStackRef.current.pop();
    if (popped) {
      // Actually pop from the end of allStrokes. 
      // (Assuming UndoStack tracks everything chronologically with allStrokes)
      allStrokesRef.current.pop();
      
      // call redrawCanvas()
      redrawCanvas();
      
      // emit 'undo' via socket
      if (socket) {
        socket.emit('undo');
      }

      // call onStackSizeChange
      if (onStackSizeChange) {
        onStackSizeChange(undoStackRef.current.size());
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'sans-serif', gap: '20px', padding: '20px' }}>
      
      {/* DSA Dashboard div */}
      <div style={{
        display: 'flex', gap: '40px', padding: '15px 30px', backgroundColor: '#1e272e', 
        color: '#d2dae2', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold'
      }}>
        <div>DSA Dashboard</div>
        <div>EventQueue Size: {queueSize ?? 0}</div>
        <div>UndoStack Size: {stackSize ?? 0}</div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', alignSelf: 'stretch', justifyContent: 'center' }}>
        <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          Color:
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)} 
            style={{ cursor: 'pointer', padding: '0', border: 'none', background: 'transparent' }}
          />
        </label>
        
        <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          Brush Size ({brushSize}px):
          <input 
            type="range" 
            min="1" 
            max="30" 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))} 
            style={{ cursor: 'pointer' }}
          />
        </label>

        <button 
          onClick={handleUndo}
          style={{
            padding: '10px 16px', backgroundColor: '#e74c3c', color: 'white', 
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          Undo
        </button>
      </div>

      <canvas 
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp} // Also fire mouse up when leaving the canvas bounds
        style={{
          border: '1px solid #bdc3c7', borderRadius: '4px', cursor: 'crosshair',
          backgroundColor: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
        }}
      />
    </div>
  );
});

export default Canvas;
