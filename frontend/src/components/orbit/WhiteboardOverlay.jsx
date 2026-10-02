import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil, Highlighter, Eraser, Minus, ArrowRight,
  Square, Circle, StickyNote, Type, Image as ImageIcon,
  Undo2, Redo2, Layers, Download, Share2, Maximize,
  Trash2, MoveUp, MoveDown, Palette, MousePointer2, X,
  Plus, Minus as MinusIcon, RefreshCw
} from "lucide-react";
import { useEffect, useRef, useState, useCallback, memo } from "react";

const ToolButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-xl transition-all relative group ${
      active ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white hover:bg-white/5"
    }`}
  >
    <Icon size={20} />
    <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[10px] font-black uppercase tracking-widest text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 shadow-2xl">
      {label}
    </span>
  </button>
);

export default function WhiteboardOverlay({ room, onUpdate, onClose }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#ffffff");
  const [size, setSize] = useState(4);
  const [fill, setFill] = useState(false);
  const [elements, setElements] = useState(room?.whiteboard || []);
  const [redoStack, setRedoStack] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState(null);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width) / zoom;
    const y = (e.clientY - rect.top) * (canvas.height / rect.height) / zoom;

    setIsDrawing(true);
    const id = Date.now();
    
    if (tool === "pen" || tool === "highlighter" || tool === "eraser") {
      const newElement = { id, type: tool, points: [[x, y]], color, size };
      setCurrentElement(newElement);
    } else {
      const newElement = { id, type: tool, x, y, w: 0, h: 0, color, size, fill };
      setCurrentElement(newElement);
    }
  };

  const draw = (e) => {
    if (!isDrawing || !currentElement) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width) / zoom;
    const y = (e.clientY - rect.top) * (canvas.height / rect.height) / zoom;

    if (currentElement.type === "pen" || currentElement.type === "highlighter" || currentElement.type === "eraser") {
      setCurrentElement(prev => ({
        ...prev,
        points: [...prev.points, [x, y]]
      }));
    } else {
      setCurrentElement(prev => ({
        ...prev,
        w: x - prev.x,
        h: y - prev.y
      }));
    }
  };

  const stopDrawing = () => {
    if (currentElement) {
      const updatedElements = [...elements, currentElement];
      setElements(updatedElements);
      onUpdate(updatedElements);
      setRedoStack([]);
    }
    setIsDrawing(false);
    setCurrentElement(null);
  };

  const undo = () => {
    if (elements.length === 0) return;
    const last = elements[elements.length - 1];
    setRedoStack(prev => [...prev, last]);
    const updated = elements.slice(0, -1);
    setElements(updated);
    onUpdate(updated);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    const updated = [...elements, last];
    setElements(updated);
    onUpdate(updated);
  };

  // Tools configuration
  const tools = [
    { id: "pen", icon: Pencil, label: "Pencil" },
    { id: "highlighter", icon: Highlighter, label: "Highlighter" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
    { id: "line", icon: Minus, label: "Line" },
    { id: "rect", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" }
  ];

  const colors = ["#ffffff", "#ff4b4b", "#4bff4b", "#4b4bff", "#ffff4b", "#ff4bff", "#4bffff"];
  const sizes = [2, 4, 8, 16, 32];

  useEffect(() => {
    if (room?.whiteboard) setElements(room.whiteboard);
  }, [room?.whiteboard]);

  const drawElement = useCallback((ctx, el) => {
    ctx.strokeStyle = el.color;
    ctx.fillStyle = el.color;
    ctx.lineWidth = el.size;
    ctx.globalAlpha = el.type === "highlighter" ? 0.4 : 1.0;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (el.type === "pen" || el.type === "highlighter" || el.type === "eraser") {
      if (el.type === "eraser") ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      el.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
      });
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    } else if (el.type === "line") {
      ctx.beginPath();
      ctx.moveTo(el.x, el.y);
      ctx.lineTo(el.x + (el.w || 0), el.y + (el.h || 0));
      ctx.stroke();
    } else if (el.type === "rect") {
      if (el.fill) ctx.fillRect(el.x, el.y, el.w, el.h);
      else ctx.strokeRect(el.x, el.y, el.w, el.h);
    } else if (el.type === "circle") {
      ctx.beginPath();
      const r = Math.sqrt((el.w || 0) ** 2 + (el.h || 0) ** 2);
      ctx.arc(el.x, el.y, r, 0, 2 * Math.PI);
      if (el.fill) ctx.fill(); else ctx.stroke();
    }
  }, []);

  const render = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.save();
    ctx.scale(zoom, zoom);

    elements.forEach(el => drawElement(ctx, el));
    if (currentElement) drawElement(ctx, currentElement);

    ctx.restore();
  }, [elements, currentElement, zoom, drawElement]);

  useEffect(() => {
    render();
  }, [elements, currentElement, zoom, render]);

  const clear = () => {
    if (window.confirm("Clear the board?")) {
      setElements([]);
      onUpdate([], true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="fixed inset-4 z-[200] bg-[#0a0a0f]/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
    >
      {/* Header Toolbar */}
      <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/20">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
          {tools.map(t => (
            <ToolButton
              key={t.id}
              active={tool === t.id}
              onClick={() => setTool(t.id)}
              icon={t.icon}
              label={t.label}
            />
          ))}
        </div>

        <div className="flex items-center gap-4">
          {/* Color & Size Selectors */}
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
            <div className="flex gap-1 px-2 border-r border-white/10">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-lg transition-transform hover:scale-110 active:scale-90 ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-1 px-2">
              {sizes.map(s => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all ${size === s ? 'bg-white text-black' : 'text-white/40'}`}
                >
                  <div className="rounded-full bg-current" style={{ width: s/2, height: s/2 }} />
                </button>
              ))}
            </div>
            <button
              onClick={() => setFill(!fill)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${fill ? 'bg-white text-black' : 'text-white/40 hover:bg-white/5'}`}
            >
              Fill
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={undo} className="p-3 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition"><Undo2 size={20} /></button>
            <button onClick={redo} className="p-3 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition"><Redo2 size={20} /></button>
            <button onClick={clear} className="p-3 rounded-2xl text-red-400 hover:bg-red-400/10 transition"><Trash2 size={20} /></button>
            <div className="w-px h-8 bg-white/10 mx-2" />
            <button onClick={onClose} className="p-3 rounded-2xl text-white/20 hover:text-white hover:bg-white/5 transition"><X size={24} /></button>
          </div>
        </div>
      </div>

      {/* Drawing Area */}
      <div className="flex-1 relative cursor-crosshair overflow-hidden group">
        <canvas
          ref={canvasRef}
          width={window.innerWidth * 2}
          height={window.innerHeight * 2}
          className="absolute inset-0 w-full h-full"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        
        {/* Zoom Controls */}
        <div className="absolute bottom-8 left-8 flex items-center gap-4 bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 rounded-xl hover:bg-white/5 transition"><MinusIcon size={14} /></button>
            <span className="text-[10px] font-black text-white w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-2 rounded-xl hover:bg-white/5 transition"><Plus size={14} /></button>
          </div>
          <button onClick={() => setZoom(1)} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition">
            <RefreshCw size={12} /> Reset
          </button>
        </div>
      </div>
    </motion.div>
  );
}
