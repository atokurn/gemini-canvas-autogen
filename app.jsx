import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Square, 
  Type, 
  PenTool, 
  Image as ImageIcon, 
  LayoutTemplate, 
  MousePointer2, 
  Hand, 
  MessageSquare, 
  Search, 
  Bell, 
  Share2, 
  MoreHorizontal, 
  Maximize2, 
  Minus, 
  Layers,
  Send,
  Sparkles,
  Download,
  X,
  Clock,
  Trash2,
  Eye,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  Eraser,
  Wand2,
  Crop,
  Maximize,
  ArrowUpRight,
  ScanLine,
  Scissors,
  User,
  Palette,
  Layout,
  Check,
  Copy,
  Pencil,
  ZoomIn,
  Undo2,
  Redo2,
  StickyNote,
  Upload,
  Circle as CircleIcon,
  Triangle,
  Star,
  ArrowRight as ArrowIcon,
  MessageSquare as MsgIcon,
  Menu,
  Pipette,
  AlignJustify,
  Move,
  CornerUpRight, 
  Grid,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Type as TypeIcon,
  Settings,
  Bold,
  Italic,
  Underline,
  SlidersHorizontal
} from 'lucide-react';

// --- API Configuration ---
const apiKey = ""; // Environment variable injected at runtime

// --- Constants ---
const ASPECT_RATIOS = [
  { label: "1:1", value: 1, icon: Square },
  { label: "16:9", value: 16/9, icon: Layout },
  { label: "9:16", value: 9/16, icon: Layout }, 
  { label: "4:3", value: 4/3, icon: Layout },
  { label: "3:4", value: 3/4, icon: Layout }
];

const ART_STYLES = [
  "None", "Photorealistic", "Cinematic", "Anime", "Digital Art", 
  "Oil Painting", "Pixel Art", "3D Render", "Minimalist"
];

const SHAPE_COLORS = [
    '#000000', '#ffffff', '#94a3b8', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', 'transparent'
];

const DEFAULT_SWATCHES = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#000000', '#ffffff'
];

const FONT_FAMILIES = [
  "Inter", "Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Verdana", "Impact", "Comic Sans MS"
];

const FONT_WEIGHTS = [
  { label: "Light", value: "300" },
  { label: "Regular", value: "400" },
  { label: "Medium", value: "500" },
  { label: "Bold", value: "700" },
  { label: "Black", value: "900" }
];

// --- Helper Components ---
const ToolbarBtn = ({ icon: Icon, label, onClick, isActive, danger = false }) => (
  <button 
    onClick={(e) => {
      e.stopPropagation();
      onClick && onClick();
    }}
    className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px] group relative
      ${danger 
        ? 'hover:bg-red-50 text-gray-600 hover:text-red-600' 
        : isActive 
          ? 'bg-indigo-100 text-indigo-700' 
          : 'hover:bg-indigo-50 text-gray-600 hover:text-indigo-600'
      }`}
  >
    <Icon size={18} strokeWidth={2} />
    <span className="text-[9px] font-medium opacity-80">{label}</span>
  </button>
);

// --- 1. Canvas Item Component ---
const CanvasItem = ({ 
  item, isSelected, onSelect, onMove, onResize, onDelete, 
  onUpdateDimensions, onInteractionEnd, onTextChange, 
  onShapeChange, onColorChange, onStrokeChange, onRadiusChange, onOpacityChange,
  onFontChange, onFontSizeChange, onTextAlignChange,
  scale 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null); 
  const [startDim, setStartDim] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [startMouse, setStartMouse] = useState({ x: 0, y: 0 });
  const [isEditingText, setIsEditingText] = useState(false); 
  
  // Local UI State
  const [showFillPicker, setShowFillPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);
  const [showFontFamily, setShowFontFamily] = useState(false);
  const [showFontWeight, setShowFontWeight] = useState(false);
  const [showTextSettings, setShowTextSettings] = useState(false);
  
  const itemRef = useRef(null);
  const textInputRef = useRef(null);
  const hasMovedRef = useRef(false);

  // Auto-focus text input
  useEffect(() => {
      if (isEditingText && textInputRef.current) {
          textInputRef.current.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(textInputRef.current);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
      }
  }, [isEditingText]);

  const handleImageLoad = (e) => {
     const natWidth = e.target.naturalWidth;
     const natHeight = e.target.naturalHeight;
     if (natWidth > 0 && natHeight > 0) {
         // Only update if significant difference to avoid jitter
         if (Math.abs(item.width - natWidth) > 1 || Math.abs(item.height - natHeight) > 1) {
             // Optional: Force update logic if needed, but for now let's trust the resize logic
             // onUpdateDimensions(item.id, natWidth, natHeight); 
         }
     }
  };

  const handleDownload = () => {
    if (item.type !== 'image') return;
    const link = document.createElement('a');
    link.href = item.src;
    link.download = `generated-ai-${item.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- MOUSE HANDLERS ---
  const handleMouseDown = (e) => {
    if (e.button === 0 && !isResizing && !isEditingText) { 
        e.stopPropagation(); 
        onSelect(item.id, e.shiftKey || e.ctrlKey);
        setIsDragging(true);
        hasMovedRef.current = false;
    }
  };

  const handleDoubleClick = (e) => {
      if (item.type === 'text') {
          e.stopPropagation();
          setIsEditingText(true);
          onSelect(item.id, false); 
      }
  };

  const handleResizeStart = (e, handle) => {
    e.stopPropagation(); 
    e.preventDefault();
    setIsResizing(true);
    setResizeHandle(handle);
    setStartMouse({ x: e.clientX, y: e.clientY });
    setStartDim({ width: item.width, height: item.height, x: item.x, y: item.y });
    hasMovedRef.current = false;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
        if (isDragging) {
            onMove(e.movementX / scale, e.movementY / scale);
            hasMovedRef.current = true;
        } else if (isResizing) {
            const deltaX = (e.clientX - startMouse.x) / scale;
            const deltaY = (e.clientY - startMouse.y) / scale;
            
            let newWidth = startDim.width;
            let newHeight = startDim.height;
            let newX = startDim.x;
            let newY = startDim.y;
            
            // --- RESIZE LOGIC ---
            
            // For Images: Lock Aspect Ratio
            if (item.type === 'image') {
                 const ratio = startDim.width / startDim.height;
                 
                 // Simple uniform scaling logic based on width change for simplicity on corners
                 if (resizeHandle.includes('e')) {
                     newWidth = Math.max(50, startDim.width + deltaX);
                     newHeight = newWidth / ratio;
                 } else if (resizeHandle.includes('w')) {
                     newWidth = Math.max(50, startDim.width - deltaX);
                     newHeight = newWidth / ratio;
                     newX = startDim.x + (startDim.width - newWidth);
                 } 
                 
                 // Handle vertical drags if horizontal didn't trigger much (simplified for corner drags)
                 // For corner drags, width usually drives height in restricted ratio resize
                 if (resizeHandle.includes('n')) {
                      newY = startDim.y + (startDim.height - newHeight);
                 }
            } else {
                // Free Resize for Shapes/Text Box
                if (resizeHandle.includes('e')) newWidth = Math.max(20, startDim.width + deltaX);
                if (resizeHandle.includes('w')) {
                    const proposedWidth = Math.max(20, startDim.width - deltaX);
                    newWidth = proposedWidth;
                    newX = startDim.x + (startDim.width - proposedWidth);
                }
                if (resizeHandle.includes('s')) newHeight = Math.max(20, startDim.height + deltaY);
                if (resizeHandle.includes('n')) {
                    const proposedHeight = Math.max(20, startDim.height - deltaY);
                    newHeight = proposedHeight;
                    newY = startDim.y + (startDim.height - proposedHeight);
                }
            }

            onResize(item.id, newWidth, newHeight, newX, newY);
            hasMovedRef.current = true;
        }
    };

    const handleMouseUp = () => {
        if ((isDragging || isResizing) && hasMovedRef.current) {
            onInteractionEnd();
        }
        setIsDragging(false);
        setIsResizing(false);
        setResizeHandle(null);
        hasMovedRef.current = false;
    };

    if (isDragging || isResizing) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, scale, onMove, onResize, startMouse, startDim, resizeHandle, item.id, onInteractionEnd, item.type]);

  // --- RENDER CONTENT ---
  const renderContent = () => {
    const commonStyle = {
        width: '100%',
        height: '100%',
        backgroundColor: item.color || 'transparent',
        border: `${item.strokeWidth || 0}px solid ${item.strokeColor || 'transparent'}`,
        opacity: (item.opacity !== undefined ? item.opacity : 100) / 100,
    };

    switch (item.type) {
      case 'image':
        return <img src={item.src} alt="Content" onLoad={handleImageLoad} className="w-full h-full object-fill select-none pointer-events-none" style={{ opacity: commonStyle.opacity }} />;
      
      case 'shape':
        const radius = item.shapeType === 'rectangle' ? (item.radius || 0) : (item.shapeType === 'circle' ? '50%' : '0');
        if (item.shapeType === 'circle' || item.shapeType === 'rectangle') {
             return <div style={{ ...commonStyle, borderRadius: radius }} />;
        } 
        else if (['triangle', 'star', 'arrow', 'message'].includes(item.shapeType)) {
             const pathD = item.shapeType === 'triangle' ? "M 50 0 L 100 100 L 0 100 Z" :
                           item.shapeType === 'star' ? "M50 0 L61 35 L98 35 L68 57 L79 91 L50 70 L21 91 L32 57 L2 35 L39 35 Z" :
                           item.shapeType === 'arrow' ? "M 0 35 L 60 35 L 60 10 L 100 50 L 60 90 L 60 65 L 0 65 Z" :
                           "M 10 10 H 90 A 10 10 0 0 1 100 20 V 70 A 10 10 0 0 1 90 80 H 30 L 10 95 V 80 A 10 10 0 0 1 0 70 V 20 A 10 10 0 0 1 10 10 Z";
             return (
                 <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible', opacity: commonStyle.opacity }}>
                     <path d={pathD} fill={item.color || '#e0e7ff'} stroke={item.strokeColor || 'transparent'} strokeWidth={item.strokeWidth || 0} />
                 </svg>
             );
        }
        return <div style={{ ...commonStyle, borderRadius: radius }} />;

      case 'text':
        return (
          <div className="w-full h-full flex items-center p-1 relative" style={{ opacity: commonStyle.opacity }}>
              {item.withShape && (
                  <div className="absolute inset-0 -z-10" style={{ backgroundColor: item.color || 'transparent', borderRadius: item.shapeType === 'circle' ? '50%' : '8px', border: `${item.strokeWidth || 0}px solid ${item.strokeColor || 'transparent'}` }}></div>
              )}
             <div
                ref={textInputRef}
                contentEditable={isEditingText}
                suppressContentEditableWarning
                className={`w-full outline-none leading-tight bg-transparent ${isEditingText ? 'cursor-text' : 'cursor-grab'}`}
                style={{ 
                    fontSize: `${item.fontSize || 20}px`, 
                    fontFamily: item.fontFamily || 'Inter',
                    fontWeight: item.fontWeight || '400',
                    textAlign: item.textAlign || 'center',
                    color: item.textColor || '#000000',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    userSelect: isEditingText ? 'text' : 'none'
                }}
                onMouseDown={(e) => {
                    if (isEditingText) e.stopPropagation(); 
                }}
                onBlur={(e) => { 
                    if (onTextChange) onTextChange(item.id, e.target.innerText); 
                    setIsEditingText(false);
                    onInteractionEnd(); 
                }}
             >
                {item.text}
             </div>
          </div>
        );
      case 'path':
        return (
          <svg width="100%" height="100%" viewBox={`0 0 ${item.width} ${item.height}`} style={{ overflow: 'visible', opacity: commonStyle.opacity }}>
             <path d={item.pathData} stroke={item.color || "#000"} strokeWidth={item.strokeWidth || 3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default: return null;
    }
  };

  return (
    <div
      ref={itemRef}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => e.stopPropagation()}
      className={`absolute group ${isDragging ? 'cursor-grabbing' : isEditingText ? 'cursor-text' : 'cursor-grab'} ${isSelected ? 'z-50' : 'z-10'}`}
      style={{ left: item.x, top: item.y, width: item.width, height: item.height, transformOrigin: 'top left' }}
    >
      {/* --- CONTEXT TOOLBARS --- */}
      
      {/* 1. IMAGE TOOLBAR (RESTORED MISSING ITEMS) */}
      {isSelected && !isResizing && !isDragging && !isEditingText && item.type === 'image' && (
        <div 
            onMouseDown={(e) => e.stopPropagation()} 
            className="absolute bg-white rounded-xl shadow-2xl border border-gray-200 p-1.5 flex items-center gap-1 z-[60] animate-in fade-in zoom-in duration-200 origin-bottom"
            style={{ top: `-${90 / scale}px`, left: `50%`, transform: `translateX(-50%) scale(${1 / scale})`, transformOrigin: 'bottom center' }}
        >
            <ToolbarBtn icon={ScanLine} label="Upscale" onClick={() => alert("Upscale...")} />
            <ToolbarBtn icon={Eraser} label="Remover" onClick={() => alert("Remover...")} />
            <ToolbarBtn icon={Wand2} label="Edit" onClick={() => alert("Mode edit...")} />
            <div className="w-px h-8 bg-gray-200 mx-1"></div>
            <ToolbarBtn icon={Maximize} label="Expand" onClick={() => alert("Generative Expand...")} />
            <ToolbarBtn icon={Crop} label="Crop" onClick={() => alert("Mode Crop...")} />
            <div className="w-px h-8 bg-gray-200 mx-1"></div>
            <ToolbarBtn icon={Download} label="Save" onClick={handleDownload} />
            <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="ml-1 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X size={16} /></button>
        </div>
      )}

      {/* 2. SHAPE TOOLBAR */}
      {isSelected && !isResizing && !isDragging && !isEditingText && item.type === 'shape' && (
        <div 
            onMouseDown={(e) => e.stopPropagation()} 
            className="absolute bg-white rounded-xl shadow-2xl border border-gray-200 px-3 py-2 flex items-center gap-3 z-[60] animate-in fade-in zoom-in duration-200 origin-bottom"
            style={{ top: `-${65 / scale}px`, left: `50%`, transform: `translateX(-50%) scale(${1 / scale})`, transformOrigin: 'bottom center' }}
        >
            {/* Fill Color */}
            <div className="relative flex items-center">
                <button onClick={() => { setShowFillPicker(!showFillPicker); setShowStrokePicker(false); }} className="w-7 h-7 rounded-full border border-gray-300 shadow-sm hover:scale-105 transition-transform" style={{ backgroundColor: item.color || 'transparent' }} title="Fill Color" />
                {showFillPicker && (
                    <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-xl border border-gray-200 grid grid-cols-5 gap-1 w-32 z-50">
                        {SHAPE_COLORS.map(c => ( <button key={c} onClick={() => { onColorChange(item.id, c); setShowFillPicker(false); }} className={`w-5 h-5 rounded-full border border-gray-200 ${item.color === c ? 'ring-2 ring-indigo-500' : ''}`} style={{ backgroundColor: c, backgroundImage: c === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none', backgroundSize: '4px 4px' }} /> ))}
                    </div>
                )}
            </div>
            {/* Stroke */}
            <div className="relative flex items-center">
                <button onClick={() => { setShowStrokePicker(!showStrokePicker); setShowFillPicker(false); }} className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center bg-white" title="Stroke Color"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.strokeColor || 'transparent' }} /></button>
                {showStrokePicker && (
                    <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-32">
                        <div className="grid grid-cols-5 gap-1 mb-2">{SHAPE_COLORS.map(c => (<button key={c} onClick={() => { onStrokeChange(item.id, c, item.strokeWidth || 2); setShowStrokePicker(false); }} className={`w-5 h-5 rounded-full border border-gray-200 ${item.strokeColor === c ? 'ring-2 ring-indigo-500' : ''}`} style={{ backgroundColor: c }} />))}</div>
                         <input type="range" min="0" max="20" step="1" value={item.strokeWidth || 0} onChange={(e) => onStrokeChange(item.id, item.strokeColor, parseInt(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                )}
            </div>
            {item.shapeType === 'rectangle' && ( <div className="flex items-center gap-1 group relative bg-gray-50 px-1.5 py-1 rounded-md border border-gray-200"><CornerUpRight size={14} className="text-gray-500" /><input type="number" value={item.radius || 0} onChange={(e) => onRadiusChange(item.id, parseInt(e.target.value))} className="w-8 text-xs bg-transparent outline-none text-right font-medium text-gray-600" /></div> )}
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-1 rounded-md border border-gray-200"><span className="text-[10px] font-bold text-gray-400">W</span><input type="number" value={Math.round(item.width)} onChange={(e) => onUpdateDimensions(item.id, parseInt(e.target.value), item.height)} className="w-10 text-xs bg-transparent outline-none text-right font-medium text-gray-600" /></div>
                <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-1 rounded-md border border-gray-200"><span className="text-[10px] font-bold text-gray-400">H</span><input type="number" value={Math.round(item.height)} onChange={(e) => onUpdateDimensions(item.id, item.width, parseInt(e.target.value))} className="w-10 text-xs bg-transparent outline-none text-right font-medium text-gray-600" /></div>
            </div>
            <div className="w-px h-6 bg-gray-200"></div>
             <div className="flex items-center gap-1 group relative bg-gray-50 px-1.5 py-1 rounded-md border border-gray-200" title="Opacity"><Grid size={14} className="text-gray-400 opacity-50" /><input type="number" min="0" max="100" value={item.opacity !== undefined ? item.opacity : 100} onChange={(e) => onOpacityChange(item.id, parseInt(e.target.value))} className="w-8 text-xs bg-transparent outline-none text-right font-medium text-gray-600" /><span className="text-[10px] text-gray-400">%</span></div>
            <div className="w-px h-6 bg-gray-200"></div>
            <button onClick={handleDownload} className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded transition-colors" title="Download"><Download size={16} /></button>
        </div>
      )}

      {/* 3. TEXT CONTROL PANEL (UPDATED) */}
      {isSelected && !isResizing && !isDragging && item.type === 'text' && (
          <>
          <div 
            onMouseDown={(e) => e.stopPropagation()} 
            className="absolute bg-white rounded-xl shadow-2xl border border-gray-200 px-2 py-1.5 flex items-center gap-2 z-[60] animate-in fade-in zoom-in duration-200 origin-bottom"
            style={{ top: `-${70 / scale}px`, left: `50%`, transform: `translateX(-50%) scale(${1 / scale})`, transformOrigin: 'bottom center' }}
          >
              {/* Text Color */}
              <div className="relative flex items-center">
                    <button onClick={() => { setShowFillPicker(!showFillPicker); setShowStrokePicker(false); }} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:scale-105 transition-transform" style={{ backgroundColor: item.textColor || '#000000' }} title="Text Color" />
                    {showFillPicker && (
                        <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-xl border border-gray-200 grid grid-cols-5 gap-1 w-32 z-50">
                             {SHAPE_COLORS.map(c => (<button key={c} onClick={() => { onColorChange(item.id, c); setShowFillPicker(false); }} className={`w-5 h-5 rounded-full border border-gray-200`} style={{ backgroundColor: c }} />))}
                        </div>
                    )}
              </div>

              {/* Background Color */}
              <div className="relative flex items-center">
                    <button onClick={() => { setShowStrokePicker(!showStrokePicker); setShowFillPicker(false); }} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors" title="Background Color">
                       <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: item.strokeColor || 'transparent' }}></div>
                    </button>
                    {showStrokePicker && (
                         <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-32">
                            <div className="grid grid-cols-5 gap-1 mb-2">{SHAPE_COLORS.map(c => (<button key={c} onClick={() => { onStrokeChange(item.id, c, item.strokeWidth || 0); setShowStrokePicker(false); }} className={`w-5 h-5 rounded-full border border-gray-200 ${item.strokeColor === c ? 'ring-2 ring-indigo-500' : ''}`} style={{ backgroundColor: c }} />))}</div>
                        </div>
                    )}
              </div>

              <div className="w-px h-6 bg-gray-200"></div>

              {/* Font Family */}
              <div className="relative">
                 <button onClick={() => setShowFontFamily(!showFontFamily)} className="flex items-center gap-1 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 w-28 justify-between hover:border-gray-300">
                    <span className="truncate">{item.fontFamily || 'Inter'}</span>
                    <ChevronDown size={12} />
                 </button>
                 {showFontFamily && (
                     <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-200 max-h-40 overflow-y-auto z-50">
                         {FONT_FAMILIES.map(font => (
                             <button key={font} onClick={() => { onFontChange(item.id, font); setShowFontFamily(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700 font-medium" style={{ fontFamily: font }}>{font}</button>
                         ))}
                     </div>
                 )}
              </div>

              {/* Font Weight */}
              <div className="relative">
                 <button onClick={() => setShowFontWeight(!showFontWeight)} className="flex items-center gap-1 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 w-24 justify-between hover:border-gray-300">
                    <span className="truncate">{FONT_WEIGHTS.find(w => w.value === (item.fontWeight || '400'))?.label || 'Regular'}</span>
                    <ChevronDown size={12} />
                 </button>
                 {showFontWeight && (
                     <div className="absolute top-full left-0 mt-1 w-24 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                         {FONT_WEIGHTS.map(w => (
                             <button key={w.value} onClick={() => { onFontChange(item.id, undefined, w.value); setShowFontWeight(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700">{w.label}</button>
                         ))}
                     </div>
                 )}
              </div>
              
              <div className="w-px h-6 bg-gray-200"></div>

              {/* More Options Toggle */}
              <button 
                 onClick={(e) => { e.stopPropagation(); setShowTextSettings(!showTextSettings); }}
                 className={`p-1.5 rounded transition-colors ${showTextSettings ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                 <MoreHorizontal size={16} />
              </button>
              
               <div className="w-px h-5 bg-gray-200"></div>

               <div className="flex items-center gap-1"><Grid size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{item.opacity || 100}%</span></div>
               <button onClick={() => {}} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded ml-1"><Download size={16} /></button>
          </div>
          
          {/* Secondary Text Panel */}
          {showTextSettings && (
              <div 
                 onMouseDown={(e) => e.stopPropagation()} 
                 className="absolute bg-white rounded-xl shadow-xl border border-gray-200 px-2 py-1 flex items-center gap-2 z-[59] animate-in fade-in slide-in-from-top-1 duration-200"
                 style={{ 
                     top: `${(item.height + 10) / scale}px`, 
                     left: `50%`, 
                     transform: `translateX(-50%) scale(${1 / scale})`, 
                     transformOrigin: 'top center' 
                 }}
              >
                   <div className="flex items-center gap-1 bg-white px-1.5 py-1 rounded-md border border-gray-200 hover:border-gray-300 w-20">
                       <input 
                          type="number" 
                          value={item.fontSize || 20} 
                          onChange={(e) => onFontSizeChange(item.id, parseInt(e.target.value))}
                          className="w-full text-xs bg-transparent outline-none text-left font-medium text-gray-700"
                       />
                       <span className="text-[10px] text-gray-400">px</span>
                   </div>

                   <div className="flex items-center gap-1">
                       <button onClick={() => onTextAlignChange(item.id, 'left')} className={`p-1 rounded hover:bg-gray-100 ${item.textAlign === 'left' ? 'text-black' : 'text-gray-400'}`}><AlignLeft size={16} /></button>
                       <button onClick={() => onTextAlignChange(item.id, 'center')} className={`p-1 rounded hover:bg-gray-100 ${(!item.textAlign || item.textAlign === 'center') ? 'text-black' : 'text-gray-400'}`}><AlignCenter size={16} /></button>
                       <button onClick={() => onTextAlignChange(item.id, 'right')} className={`p-1 rounded hover:bg-gray-100 ${item.textAlign === 'right' ? 'text-black' : 'text-gray-400'}`}><AlignRight size={16} /></button>
                   </div>
                   
                   <div className="w-px h-4 bg-gray-200"></div>
                   <button className="p-1 text-gray-500 hover:text-black hover:bg-gray-100 rounded"><Settings size={16} /></button>
              </div>
          )}
          </>
      )}

      {/* PATH TOOLBAR */}
      {isSelected && !isResizing && !isDragging && item.type === 'path' && (
           <div 
           onMouseDown={(e) => e.stopPropagation()} 
           className="absolute -top-10 right-0 bg-white rounded-lg shadow-md border border-gray-200 p-1 z-[60]"
           style={{ transform: `scale(${1 / scale})`, transformOrigin: 'bottom right' }}
        >
           <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
       </div>
      )}

      <div className={`relative w-full h-full transition-all duration-200 group ${isSelected ? 'ring-2 ring-indigo-500 shadow-lg' : ''}`}>
        {renderContent()}
        {isSelected && (
            <>
                <div onMouseDown={(e) => handleResizeStart(e, 'nw')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-500 rounded-full cursor-nw-resize z-50" style={{ transform: `scale(${1/scale})` }} />
                <div onMouseDown={(e) => handleResizeStart(e, 'ne')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-500 rounded-full cursor-ne-resize z-50" style={{ transform: `scale(${1/scale})` }} />
                <div onMouseDown={(e) => handleResizeStart(e, 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-500 rounded-full cursor-sw-resize z-50" style={{ transform: `scale(${1/scale})` }} />
                <div onMouseDown={(e) => handleResizeStart(e, 'se')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-500 rounded-full cursor-se-resize z-50" style={{ transform: `scale(${1/scale})` }} />
            </>
        )}
      </div>
      
      {isSelected && (
        <div className="absolute -bottom-6 right-0 text-[10px] text-gray-500 font-medium font-mono tracking-tight select-none bg-white/80 px-1 rounded" style={{ transform: `scale(${1/scale})`, transformOrigin: 'top right' }}>
          {Math.round(item.width)} × {Math.round(item.height)}
        </div>
      )}
    </div>
  );
};

// --- 2. Main Application ---
export default function AICanvasApp() {
  // ... (State and Refs - SAME)
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [canvasItems, setCanvasItems] = useState([]);
  
  const [history, setHistory] = useState([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]); 
  const [selectedStyle, setSelectedStyle] = useState("None");
  
  const [showRatioMenu, setShowRatioMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showGeneratorSidebar, setShowGeneratorSidebar] = useState(true); 
  const [chatHistory, setChatHistory] = useState([]); 
  const [showLayersHistorySidebar, setShowLayersHistorySidebar] = useState(true); 
  const [previewImage, setPreviewImage] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTopLeftMenu, setShowTopLeftMenu] = useState(false); 
  const [showShapeMenu, setShowShapeMenu] = useState(false); 

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectionBox, setSelectionBox] = useState(null); 
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [activeTool, setActiveTool] = useState('pointer'); 
  const [currentPath, setCurrentPath] = useState([]); 
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempItem, setTempItem] = useState(null); 

  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(5); 
  const [showColorPicker, setShowColorPicker] = useState(false);

  const canvasAreaRef = useRef(null);
  const selectionStartRef = useRef(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const previousToolRef = useRef('pointer');
  const canvasItemsRef = useRef(canvasItems);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const pendingToolRef = useRef(null);

  const topLeftMenuRef = useRef(null);
  const shapeMenuRef = useRef(null);
  const ratioMenuRef = useRef(null);
  const styleMenuRef = useRef(null);
  const colorPickerRef = useRef(null); 

  useEffect(() => { canvasItemsRef.current = canvasItems; }, [canvasItems]);
  useEffect(() => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }, [chatHistory]);

  // ... (Click Outside Logic - SAME)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTopLeftMenu && topLeftMenuRef.current && !topLeftMenuRef.current.contains(event.target)) setShowTopLeftMenu(false);
      if (showShapeMenu && shapeMenuRef.current && !shapeMenuRef.current.contains(event.target)) setShowShapeMenu(false);
      if (showRatioMenu && ratioMenuRef.current && !ratioMenuRef.current.contains(event.target)) setShowRatioMenu(false);
      if (showStyleMenu && styleMenuRef.current && !styleMenuRef.current.contains(event.target)) setShowStyleMenu(false);
      if (showColorPicker && colorPickerRef.current && !colorPickerRef.current.contains(event.target)) setShowColorPicker(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTopLeftMenu, showShapeMenu, showRatioMenu, showStyleMenu, showColorPicker]);

  // ... (Actions & Helpers - SAME)
  const addToHistory = (newItems) => {
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(newItems);
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
  };

  const onInteractionEnd = () => { addToHistory(canvasItemsRef.current); };

  const addItem = (newItem) => {
      const newItems = [...canvasItems, newItem];
      setCanvasItems(newItems);
      addToHistory(newItems);
      setActiveTool('pointer');
      setShowShapeMenu(false); 
  };

  const getCenterPos = (w, h) => {
      const wrapper = canvasAreaRef.current;
      const centerX = wrapper ? ((wrapper.offsetWidth - w) / 2 - panOffset.x) / (zoom / 100) : 400;
      const centerY = wrapper ? ((wrapper.offsetHeight - h) / 2 - panOffset.y) / (zoom / 100) : 300;
      return { x: centerX, y: centerY };
  };

  // --- Actions ---
  const setCreationMode = (toolType, extraProps = {}) => {
      setActiveTool('creating');
      pendingToolRef.current = { type: toolType, ...extraProps };
      setShowShapeMenu(false);
      setSelectedIds(new Set()); 
  };

  const handleAddShapeType = (type, withText = false) => {
      setCreationMode(withText ? 'text' : 'shape', {
          shapeType: type,
          color: '#94a3b8',
          strokeColor: 'transparent',
          strokeWidth: 0,
          radius: 8,
          opacity: 100,
          withShape: withText
      });
  };

  const handleAddText = () => {
      // Changed to "click to type" mode via creation mode
      setActiveTool('creating');
      pendingToolRef.current = { 
          type: 'text',
          text: "Type Here",
          fontSize: 32,
          fontFamily: 'Inter',
          fontWeight: '400',
          textAlign: 'left',
          strokeColor: 'rgba(0,0,0,0)', 
          textColor: '#000000',
          withShape: false
      };
      setSelectedIds(new Set());
  };

  const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              // Create a temporary image to get natural dimensions
              const img = new Image();
              img.onload = () => {
                  const baseSize = 300; // Standard size baseline
                  let newWidth = baseSize;
                  let newHeight = baseSize;
                  
                  // Calculate aspect ratio
                  const ratio = img.width / img.height;

                  if (img.width > img.height) {
                      // Landscape
                      newWidth = baseSize;
                      newHeight = baseSize / ratio;
                  } else {
                      // Portrait or Square
                      newHeight = baseSize;
                      newWidth = baseSize * ratio;
                  }

                  const { x, y } = getCenterPos(newWidth, newHeight);
                  
                  addItem({ 
                      id: Date.now(), 
                      type: 'image', 
                      x, 
                      y, 
                      width: newWidth, 
                      height: newHeight, 
                      src: event.target.result, 
                      prompt: "Uploaded Image" 
                  });
              };
              img.src = event.target.result;
          };
          reader.readAsDataURL(file);
      }
      e.target.value = null; 
  };

  // --- Drawing ---
  const startDrawing = (e) => { const rect = canvasAreaRef.current.getBoundingClientRect(); const x = (e.clientX - rect.left - panOffset.x) / (zoom/100); const y = (e.clientY - rect.top - panOffset.y) / (zoom/100); setIsDrawing(true); setCurrentPath([{ x, y }]); };
  const continueDrawing = (e) => { if (!isDrawing) return; const rect = canvasAreaRef.current.getBoundingClientRect(); const x = (e.clientX - rect.left - panOffset.x) / (zoom/100); const y = (e.clientY - rect.top - panOffset.y) / (zoom/100); setCurrentPath(prev => [...prev, { x, y }]); };
  const finishDrawing = () => { if (!isDrawing) return; setIsDrawing(false); if (currentPath.length > 2) { const xs = currentPath.map(p => p.x); const ys = currentPath.map(p => p.y); const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys); const width = maxX - minX; const height = maxY - minY; const pathData = `M ${currentPath.map(p => `${p.x - minX} ${p.y - minY}`).join(' L ')}`; addItem({ id: Date.now(), type: 'path', x: minX, y: minY, width: Math.max(width, 20), height: Math.max(height, 20), pathData: pathData, color: strokeColor, strokeWidth: strokeWidth }); setActiveTool('pen'); } setCurrentPath([]); };

  // --- Item Updates ---
  const handleSelectItem = (id, multiSelect) => { if (activeTool !== 'pointer') return; if (multiSelect) { const newSelected = new Set(selectedIds); if (newSelected.has(id)) newSelected.delete(id); else newSelected.add(id); setSelectedIds(newSelected); } else { if (!selectedIds.has(id)) setSelectedIds(new Set([id])); else if (selectedIds.size > 1) setSelectedIds(new Set([id])); } };
  const handleMoveItem = (deltaX, deltaY) => setCanvasItems(prev => prev.map(item => selectedIds.has(item.id) ? { ...item, x: item.x + deltaX, y: item.y + deltaY } : item));
  const handleResizeItem = (id, w, h, x, y) => setCanvasItems(prev => prev.map(item => item.id === id ? { ...item, width: w, height: h, x, y } : item));
  const handleUpdateDimensions = (id, w, h) => setCanvasItems(prev => prev.map(item => item.id === id ? { ...item, width: w, height: h } : item));
  const handleTextChange = (id, newText) => setCanvasItems(prev => prev.map(item => item.id === id ? { ...item, text: newText } : item));
  const handleShapeChange = (id, type) => { setCanvasItems(prev => prev.map(item => item.id === id ? { ...item, shapeType: type } : item)); onInteractionEnd(); };
  const handleColorChange = (id, color) => { 
      setCanvasItems(prev => prev.map(item => {
          if (item.id === id) {
              if (item.type === 'text') return { ...item, textColor: color };
              return { ...item, color: color };
          }
          return item;
      })); 
      onInteractionEnd(); 
  };
  const handleStrokeChange = (id, color, width) => { setCanvasItems(prev => prev.map(item => item.id === id ? { ...item, strokeColor: color, strokeWidth: width } : item)); onInteractionEnd(); };
  const handleRadiusChange = (id, radius) => { setCanvasItems(prev => prev.map(item => item.id === id ? { ...item, radius: radius } : item)); onInteractionEnd(); };
  const handleOpacityChange = (id, opacity) => { setCanvasItems(prev => prev.map(item => item.id === id ? { ...item, opacity: opacity } : item)); onInteractionEnd(); };
  
  const handleFontChange = (id, family, weight) => { setCanvasItems(prev => prev.map(item => item.id === id ? { ...item, ...(family && { fontFamily: family }), ...(weight && { fontWeight: weight }) } : item)); onInteractionEnd(); };
  const handleFontSizeChange = (id, size) => { setCanvasItems(prev => prev.map(item => item.id === id ? { ...item, fontSize: size } : item)); onInteractionEnd(); };
  const handleTextAlignChange = (id, align) => { setCanvasItems(prev => prev.map(item => item.id === id ? { ...item, textAlign: align } : item)); onInteractionEnd(); };

  const handleDeleteItem = (id) => { const newItems = canvasItems.filter(item => item.id !== id); setCanvasItems(newItems); setSelectedIds(prev => { const newSet = new Set(prev); newSet.delete(id); return newSet; }); addToHistory(newItems); };
  const handleDeleteSelected = () => { if (selectedIds.size === 0) return; const newItems = canvasItemsRef.current.filter(item => !selectedIds.has(item.id)); setCanvasItems(newItems); setSelectedIds(new Set()); addToHistory(newItems); };
  const handleUndo = () => { if (historyStep > 0) { const newStep = historyStep - 1; setHistoryStep(newStep); setCanvasItems(history[newStep]); setSelectedIds(new Set()); } };
  const handleRedo = () => { if (historyStep < history.length - 1) { const newStep = historyStep + 1; setHistoryStep(newStep); setCanvasItems(history[newStep]); setSelectedIds(new Set()); } };
  const handleZoom = (deltaOrFactor, centerPoint = null) => {
    let factor = Math.abs(deltaOrFactor) < 2 ? deltaOrFactor : (deltaOrFactor > 0 ? 1.1 : 0.9);
    setZoom(prevZoom => { const newZoom = Math.min(Math.max(prevZoom * factor, 10), 500); if (centerPoint) { const mouseX = centerPoint.x; const mouseY = centerPoint.y; setPanOffset(prevPan => { const actualFactor = newZoom / prevZoom; return { x: mouseX - (mouseX - prevPan.x) * actualFactor, y: mouseY - (mouseY - prevPan.y) * actualFactor }; }); } else { if (canvasAreaRef.current) { const rect = canvasAreaRef.current.getBoundingClientRect(); const centerX = rect.width / 2; const centerY = rect.height / 2; const actualFactor = newZoom / prevZoom; setPanOffset(prevPan => ({ x: centerX - (centerX - prevPan.x) * actualFactor, y: centerY - (centerY - prevPan.y) * actualFactor })); } } return newZoom; });
  };
  const handleDuplicate = () => { if (selectedIds.size === 0) return; const newItems = []; const newSelectedIds = new Set(); canvasItems.forEach(item => { if (selectedIds.has(item.id)) { const newItem = { ...item, id: Date.now() + Math.random(), x: item.x + 20, y: item.y + 20 }; newItems.push(newItem); newSelectedIds.add(newItem.id); } }); if (newItems.length > 0) { const updatedItems = [...canvasItems, ...newItems]; setCanvasItems(updatedItems); setSelectedIds(newSelectedIds); addToHistory(updatedItems); } };
  const handleZoomToFit = () => { if (canvasItems.length === 0) { setZoom(100); setPanOffset({x: 0, y: 0}); return; } let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity; canvasItems.forEach(item => { minX = Math.min(minX, item.x); minY = Math.min(minY, item.y); maxX = Math.max(maxX, item.x + item.width); maxY = Math.max(maxY, item.y + item.height); }); const padding = 50; const width = maxX - minX + padding * 2; const height = maxY - minY + padding * 2; const wrapper = canvasAreaRef.current; if (!wrapper) return; const containerWidth = wrapper.offsetWidth; const containerHeight = wrapper.offsetHeight; const scaleX = containerWidth / width; const scaleY = containerHeight / height; const newScale = Math.min(scaleX, scaleY, 1); const newZoom = Math.floor(newScale * 100); const contentCenterX = minX + (maxX - minX) / 2; const contentCenterY = minY + (maxY - minY) / 2; const viewCenterX = containerWidth / 2; const viewCenterY = containerHeight / 2; const newPanX = viewCenterX - contentCenterX * newScale; const newPanY = viewCenterY - contentCenterY * newScale; setZoom(newZoom); setPanOffset({ x: newPanX, y: newPanY }); };
  const handleGenerate = async () => { if (!inputValue.trim()) return; const promptText = inputValue; setInputValue(""); let finalPrompt = promptText; if (selectedStyle !== "None") finalPrompt += `, in ${selectedStyle} style`; const newChatEntryUser = { id: Date.now(), role: 'user', text: finalPrompt }; setChatHistory(prev => [...prev, newChatEntryUser]); setLoading(true); try { const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instances: [{ prompt: finalPrompt }], parameters: { sampleCount: 1, aspectRatio: selectedRatio.label } }) }); if (!response.ok) throw new Error(`API Error: ${response.status}`); const result = await response.json(); const base64Image = result.predictions?.[0]?.bytesBase64Encoded; if (base64Image) { const imageUrl = `data:image/png;base64,${base64Image}`; let baseWidth = 300, baseHeight = 300; if (selectedRatio.value > 1) baseHeight = baseWidth / selectedRatio.value; else baseWidth = 300 * selectedRatio.value; let startX, startY; const currentItems = canvasItemsRef.current; if (currentItems.length > 0) { const lastItem = currentItems[currentItems.length - 1]; startX = lastItem.x + lastItem.width + 40; startY = lastItem.y; } else { const wrapper = canvasAreaRef.current; startX = wrapper ? ((wrapper.offsetWidth - baseWidth) / 2 - panOffset.x) / (zoom / 100) : 400; startY = wrapper ? ((wrapper.offsetHeight - baseHeight) / 2 - panOffset.y) / (zoom / 100) : 300; } const newItem = { id: Date.now(), type: 'image', src: imageUrl, x: startX, y: startY, width: baseWidth, height: baseHeight, prompt: finalPrompt }; const newItems = [...currentItems, newItem]; setCanvasItems(newItems); addToHistory(newItems); setChatHistory(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: "Gambar berhasil dibuat!", img: imageUrl }]); const wrapper = canvasAreaRef.current; if (wrapper) { const scale = zoom / 100; const vCenterX = wrapper.offsetWidth / 2; const vCenterY = wrapper.offsetHeight / 2; const itemCenterX = startX + baseWidth / 2; const itemCenterY = startY + baseHeight / 2; setPanOffset({ x: vCenterX - (itemCenterX * scale), y: vCenterY - (itemCenterY * scale) }); } } } catch (error) { console.error("Failed:", error); setChatHistory(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: "Maaf, gagal membuat gambar." }]); } finally { setLoading(false); } };

  // --- Global Inputs (Toolbar Click Unselect) ---
  const onToolbarClick = (callback) => { setSelectedIds(new Set()); if (callback) callback(); };
  const handleCanvasMouseDown = (e) => {
      if (activeTool === 'hand' || e.button === 1) { setIsPanning(true); panStartRef.current = { x: e.clientX, y: e.clientY }; return; }
      if (activeTool === 'pen') { startDrawing(e); return; }
      if (activeTool === 'creating') {
          // NEW LOGIC: CLICK TO ADD (No Drag needed for Text/Shapes)
          const rect = canvasAreaRef.current.getBoundingClientRect();
          const x = (e.clientX - rect.left - panOffset.x) / (zoom/100);
          const y = (e.clientY - rect.top - panOffset.y) / (zoom/100);
          
          // Center the object on cursor
          const width = pendingToolRef.current.width || 200; 
          const height = pendingToolRef.current.height || (pendingToolRef.current.type === 'text' ? 50 : 200);

          const newItem = {
              ...pendingToolRef.current,
              id: Date.now(),
              x: x - width/2,
              y: y - height/2,
              width: width,
              height: height
          };
          
          addItem(newItem);
          // For Text, auto select to edit maybe? For now just pointer
          return;
      }
      if (activeTool === 'pointer' && e.button === 0) {
          if (!e.shiftKey && !e.ctrlKey) setSelectedIds(new Set());
          const rect = canvasAreaRef.current.getBoundingClientRect();
          const x = (e.clientX - rect.left - panOffset.x) / (zoom/100);
          const y = (e.clientY - rect.top - panOffset.y) / (zoom/100);
          selectionStartRef.current = { x, y };
          setSelectionBox({ x, y, width: 0, height: 0 });
      }
  };

  const handleCanvasMouseMove = (e) => {
      if (isPanning) { const deltaX = e.clientX - panStartRef.current.x; const deltaY = e.clientY - panStartRef.current.y; setPanOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY })); panStartRef.current = { x: e.clientX, y: e.clientY }; return; }
      if (isDrawing) { continueDrawing(e); return; }
      // Creating drag logic removed as requested ("tanpa perlu drag")
      if (selectionStartRef.current) { const rect = canvasAreaRef.current.getBoundingClientRect(); const currentX = (e.clientX - rect.left - panOffset.x) / (zoom/100); const currentY = (e.clientY - rect.top - panOffset.y) / (zoom/100); const startX = selectionStartRef.current.x; const startY = selectionStartRef.current.y; setSelectionBox({ x: Math.min(startX, currentX), y: Math.min(startY, currentY), width: Math.abs(currentX - startX), height: Math.abs(currentY - startY) }); }
  };

  const handleCanvasMouseUp = () => {
      setIsPanning(false);
      if (isDrawing) { finishDrawing(); return; }
      if (selectionStartRef.current && selectionBox) { const newSelectedIds = new Set(selectedIds); canvasItems.forEach(item => { const itemCenterX = item.x + item.width / 2; const itemCenterY = item.y + item.height / 2; if (itemCenterX >= selectionBox.x && itemCenterX <= selectionBox.x + selectionBox.width && itemCenterY >= selectionBox.y && itemCenterY <= selectionBox.y + selectionBox.height) newSelectedIds.add(item.id); }); setSelectedIds(newSelectedIds); }
      selectionStartRef.current = null; setSelectionBox(null);
  };

  useEffect(() => { const handleKeyDown = (e) => { if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) return; if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); return; } if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')) { e.preventDefault(); handleRedo(); return; } if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); handleDeleteSelected(); return; } if (e.code === 'Space' && !e.repeat && activeTool !== 'hand') { e.preventDefault(); previousToolRef.current = activeTool; setActiveTool('hand'); } if (e.key.toLowerCase() === 'v') setActiveTool('pointer'); if (e.key.toLowerCase() === 'h') setActiveTool('hand'); if (e.key.toLowerCase() === 'p') setActiveTool('pen'); }; const handleKeyUp = (e) => { if (e.code === 'Space' && activeTool === 'hand') setActiveTool(previousToolRef.current); }; window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp); return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); }; }, [activeTool, historyStep, selectedIds, history]);
  useEffect(() => { const canvasEl = canvasAreaRef.current; if (!canvasEl) return; const handleWheel = (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); const rect = canvasEl.getBoundingClientRect(); const factor = e.deltaY < 0 ? 1.1 : 0.9; handleZoom(factor, { x: e.clientX - rect.left, y: e.clientY - rect.top }); } }; canvasEl.addEventListener('wheel', handleWheel, { passive: false }); return () => canvasEl.removeEventListener('wheel', handleWheel); }, []);

  const RatioIcon = selectedRatio.icon;

  return (
    <div className="flex h-screen w-full bg-[#F9FAFB] overflow-hidden font-sans text-slate-800 select-none">
      {/* PREVIEW MODAL ... */}
      {previewImage && ( <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}><button className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20" onClick={() => setPreviewImage(null)}><X size={24} /></button><img src={previewImage} alt="Preview" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} /></div> )}
      {/* TEMPLATE MODAL ... */}
      {showTemplateModal && ( <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in zoom-in duration-200" onClick={() => setShowTemplateModal(false)}><div className="bg-white w-[500px] h-[300px] rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center text-center" onClick={(e) => e.stopPropagation()}><LayoutTemplate size={48} className="text-indigo-200 mb-4" /><h2 className="text-xl font-bold text-gray-800 mb-2">Template Belum Tersedia</h2><p className="text-gray-500">Fitur template akan segera hadir.</p><button onClick={() => setShowTemplateModal(false)} className="mt-6 px-6 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">Tutup</button></div></div> )}

      {/* LEFT SIDEBAR */}
      <div className={`bg-white shadow-xl border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden relative z-40 ${showLayersHistorySidebar ? 'w-[280px]' : 'w-0 border-none'}`}>
          <div className="w-[280px] h-full flex flex-col"> 
            <div className="p-4 flex items-center justify-between border-b border-gray-100"><div className="flex items-center gap-2"><Clock size={16} className="text-gray-500" /><h2 className="text-sm font-semibold text-gray-800">History</h2></div><button onClick={() => setShowLayersHistorySidebar(false)} className="text-gray-400 hover:text-black"><ChevronsLeft size={18} /></button></div>
            <div className="flex-1 overflow-y-auto p-3 bg-white">
              {canvasItems.length === 0 ? <div className="text-center py-8 text-gray-400 text-xs">Belum ada layer</div> : <div className="space-y-2">{[...canvasItems].reverse().map((item, index) => (<div key={item.id} onClick={() => setSelectedIds(new Set([item.id]))} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer group transition-all ${selectedIds.has(item.id) ? 'bg-indigo-50 border border-indigo-100 shadow-sm' : 'hover:bg-gray-50 border border-transparent'}`}><div className="w-9 h-9 bg-gray-100 rounded border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400">{item.type === 'image' ? <img src={item.src} className="w-full h-full object-cover" alt="thumb" /> : item.type === 'text' ? <TypeIcon size={16} /> : item.type === 'shape' ? <Square size={16} /> : <PenTool size={16} />}</div><div className="flex-1 min-w-0"><div className="text-xs font-medium text-gray-700 truncate">{item.type === 'image' ? 'Image' : item.type === 'text' ? 'Text' : item.type === 'shape' ? 'Shape' : 'Path'} #{canvasItems.length - index}</div><div className="text-[10px] text-gray-400 truncate">{item.prompt || item.text || item.shapeType || 'Item'}</div></div><button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"><Trash2 size={12} /></button></div>))}</div>}
            </div>
          </div>
      </div>

      {/* CENTER CANVAS */}
      <div className="relative flex-1 h-full overflow-hidden flex flex-col transition-all duration-300">
        {/* Top Bar... */}
        <div className="absolute top-4 left-16 z-10 flex items-center gap-2 text-sm text-gray-500">
          <div className="relative" ref={topLeftMenuRef}>
              <div className="flex items-center gap-2 cursor-pointer hover:text-black px-2 py-1 rounded hover:bg-black/5 transition-colors" onClick={() => setShowTopLeftMenu(!showTopLeftMenu)}>
                <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-white text-[10px] font-bold">LO</div><span className="font-semibold text-black">Untitled</span><ChevronRight size={14} className={`text-gray-300 transition-transform ${showTopLeftMenu ? 'rotate-90' : ''}`} />
              </div>
              {showTopLeftMenu && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-1 z-[100] animate-in fade-in slide-in-from-top-2 flex flex-col">
                      <button className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 rounded-lg text-gray-700 flex items-center justify-between group" onClick={() => { fileInputRef.current.click(); setShowTopLeftMenu(false); }}><span>Import Images</span></button>
                      <div className="h-px bg-gray-100 my-1"></div>
                      <button className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 rounded-lg text-gray-700 flex items-center justify-between group" onClick={() => { handleUndo(); setShowTopLeftMenu(false); }}><span>Undo</span><span className="text-gray-400 text-[10px]">Ctrl + Z</span></button>
                      <button className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 rounded-lg text-gray-700 flex items-center justify-between group" onClick={() => { handleRedo(); setShowTopLeftMenu(false); }}><span>Redo</span><span className="text-gray-400 text-[10px]">Ctrl + Shift + Z</span></button>
                      <button className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 rounded-lg text-gray-700 flex items-center justify-between group" onClick={() => { handleDuplicate(); setShowTopLeftMenu(false); }}><span>Duplicate Selection</span><span className="text-gray-400 text-[10px]">Ctrl + D</span></button>
                      <div className="h-px bg-gray-100 my-1"></div>
                      <button className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 rounded-lg text-gray-700 flex items-center justify-between group" onClick={() => { handleZoomToFit(); setShowTopLeftMenu(false); }}><span>Zoom to fit</span><span className="text-gray-400 text-[10px]">Shift + 1</span></button>
                      <button className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 rounded-lg text-gray-700 flex items-center justify-between group" onClick={() => { handleZoom(1.1); setShowTopLeftMenu(false); }}><span>Zoom in</span><span className="text-gray-400 text-[10px]">Ctrl + +</span></button>
                      <button className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 rounded-lg text-gray-700 flex items-center justify-between group" onClick={() => { handleZoom(0.9); setShowTopLeftMenu(false); }}><span>Zoom out</span><span className="text-gray-400 text-[10px]">Ctrl + -</span></button>
                  </div>
              )}
          </div>
          <span className="text-gray-300">/</span><span>Drafts</span>
        </div>

        {/* Draw Panel */}
        {activeTool === 'pen' && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="bg-white p-1 rounded-xl shadow-lg border border-gray-200 flex items-center gap-2 pr-3 pl-1.5 h-10">
                   <div className="relative" ref={colorPickerRef}>
                       <button onClick={() => setShowColorPicker(!showColorPicker)} className="w-7 h-7 rounded-full border-2 border-gray-200 flex items-center justify-center hover:scale-105 transition-transform" style={{ backgroundColor: strokeColor }} />
                       {showColorPicker && (
                           <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 z-[60] animate-in fade-in zoom-in-95">
                               <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-gray-500">Stroke</span><button onClick={() => setShowColorPicker(false)}><X size={14} className="text-gray-400 hover:text-black" /></button></div>
                               <div className="flex flex-wrap gap-1.5 mb-3">{DEFAULT_SWATCHES.map(c => (<button key={c} onClick={() => setStrokeColor(c)} className={`w-5 h-5 rounded-full border border-gray-200 hover:scale-110 transition-transform`} style={{ backgroundColor: c }} />))}</div>
                           </div>
                       )}
                   </div>
                   <div className="w-px h-5 bg-gray-200"></div>
                   <div className="flex items-center gap-2 group"><AlignJustify size={16} className="text-gray-400" /><input type="number" value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="w-8 text-xs font-medium text-gray-700 outline-none bg-transparent text-right" /><span className="text-xs text-gray-400">px</span></div>
                </div>
            </div>
        )}
        
        {/* Toolbar */}
        <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20 flex flex-col gap-2 bg-white p-1.5 rounded-xl shadow-lg border border-gray-100">
          <ToolbarBtn icon={Plus} label="Upload" onClick={() => onToolbarClick(() => fileInputRef.current.click())} /><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          <div className="h-px bg-gray-200 mx-1 my-1"></div>
          <div className="relative" ref={shapeMenuRef}>
            <ToolbarBtn icon={Square} label="Shape" onClick={() => onToolbarClick(() => setShowShapeMenu(!showShapeMenu))} isActive={activeTool === 'creating' && pendingToolRef.current?.type === 'shape'} />
            {showShapeMenu && (
                <div className="absolute left-full top-0 ml-3 w-48 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 animate-in fade-in slide-in-from-left-2 grid grid-cols-4 gap-1">
                    <button onClick={() => handleAddShapeType('rectangle')} className="p-2 hover:bg-gray-100 rounded-lg flex justify-center items-center text-gray-600 hover:text-indigo-600"><Square size={18} /></button>
                    <button onClick={() => handleAddShapeType('circle')} className="p-2 hover:bg-gray-100 rounded-lg flex justify-center items-center text-gray-600 hover:text-indigo-600"><CircleIcon size={18} /></button>
                    <button onClick={() => handleAddShapeType('triangle')} className="p-2 hover:bg-gray-100 rounded-lg flex justify-center items-center text-gray-600 hover:text-indigo-600"><Triangle size={18} /></button>
                    <button onClick={() => handleAddShapeType('star')} className="p-2 hover:bg-gray-100 rounded-lg flex justify-center items-center text-gray-600 hover:text-indigo-600"><Star size={18} /></button>
                    <button onClick={() => { setActiveTool('pen'); setShowShapeMenu(false); }} className="p-2 hover:bg-gray-100 rounded-lg flex justify-center items-center text-gray-600 hover:text-indigo-600"><PenTool size={18} /></button>
                    <div className="col-span-4 text-[10px] font-bold text-gray-400 uppercase mt-2 mb-1 px-1">Shape with Text</div>
                    <button onClick={() => handleAddShapeType('rectangle', true)} className="p-2 hover:bg-gray-100 rounded-lg flex justify-center items-center text-gray-600 hover:text-indigo-600"><Square size={18} /></button>
                    <button onClick={() => handleAddShapeType('circle', true)} className="p-2 hover:bg-gray-100 rounded-lg flex justify-center items-center text-gray-600 hover:text-indigo-600"><CircleIcon size={18} /></button>
                    <button onClick={() => handleAddShapeType('message', true)} className="p-2 hover:bg-gray-100 rounded-lg flex justify-center items-center text-gray-600 hover:text-indigo-600"><MsgIcon size={18} /></button>
                    <button onClick={() => handleAddShapeType('arrow', true)} className="p-2 hover:bg-gray-100 rounded-lg flex justify-center items-center text-gray-600 hover:text-indigo-600 transform rotate-180"><ArrowIcon size={18} /></button>
                    <button onClick={() => handleAddShapeType('arrow', true)} className="p-2 hover:bg-gray-100 rounded-lg flex justify-center items-center text-gray-600 hover:text-indigo-600"><ArrowIcon size={18} /></button>
                </div>
            )}
          </div>
          <ToolbarBtn icon={Type} label="Text" onClick={() => onToolbarClick(handleAddText)} isActive={activeTool === 'creating' && pendingToolRef.current?.type === 'text'} />
          <ToolbarBtn icon={PenTool} label="Draw" onClick={() => onToolbarClick(() => setActiveTool(activeTool === 'pen' ? 'pointer' : 'pen'))} isActive={activeTool === 'pen'} />
          <ToolbarBtn icon={LayoutTemplate} label="Layout" onClick={() => onToolbarClick(() => setShowTemplateModal(true))} />
        </div>
        {/* Canvas */}
        <div ref={canvasAreaRef} className="w-full h-full bg-[#F9FAFB] relative overflow-hidden" style={{ cursor: activeTool === 'hand' ? (isPanning ? 'grabbing' : 'grab') : activeTool === 'pen' || activeTool === 'creating' ? 'crosshair' : 'default', backgroundImage: 'radial-gradient(#E5E7EB 1px, transparent 1px)', backgroundSize: `${20 * (zoom/100)}px ${20 * (zoom/100)}px`, backgroundPosition: `${panOffset.x}px ${panOffset.y}px` }} onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp}>
          <div style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100})`, transformOrigin: '0 0', width: '100%', height: '100%', transition: isPanning || isDrawing || activeTool === 'creating' ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              {canvasItems.map(item => (
                <CanvasItem key={item.id} item={item} isSelected={selectedIds.has(item.id)} onSelect={handleSelectItem} onMove={handleMoveItem} onResize={handleResizeItem} onDelete={handleDeleteItem} onUpdateDimensions={handleUpdateDimensions} onInteractionEnd={onInteractionEnd} onTextChange={handleTextChange} onShapeChange={handleShapeChange} onColorChange={handleColorChange} onStrokeChange={handleStrokeChange} onRadiusChange={handleRadiusChange} onOpacityChange={handleOpacityChange} onFontChange={handleFontChange} onFontSizeChange={handleFontSizeChange} onTextAlignChange={handleTextAlignChange} scale={zoom / 100} />
              ))}
              {isDrawing && currentPath.length > 1 && <svg style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 9999 }}><path d={`M ${currentPath.map(p => `${p.x} ${p.y}`).join(' L ')}`} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              {tempItem && <div className="absolute border-2 border-indigo-500 border-dashed z-[100]" style={{ left: tempItem.x, top: tempItem.y, width: tempItem.width, height: tempItem.height, backgroundColor: 'rgba(99, 102, 241, 0.1)' }} />}
              {selectionBox && <div className="absolute border border-indigo-500 bg-indigo-500/10 z-50 pointer-events-none" style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.width, height: selectionBox.height }} />}
          </div>
        </div>
        {/* Bottom Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-white rounded-full shadow-lg border border-gray-200 p-1 flex gap-1">
          <button onClick={() => onToolbarClick(() => setActiveTool('pointer'))} className={`p-2.5 rounded-full transition-colors ${activeTool === 'pointer' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-black'}`}><MousePointer2 size={18} /></button>
          <button onClick={() => onToolbarClick(() => setActiveTool('hand'))} className={`p-2.5 rounded-full transition-colors ${activeTool === 'hand' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-black'}`}><Hand size={18} /></button>
          <div className="w-px bg-gray-200 mx-1 my-2"></div>
          <button className="p-2.5 text-gray-500 hover:text-black rounded-full"><MessageSquare size={18} /></button>
        </div>
        <div className="absolute bottom-6 left-6 z-20 flex gap-3 items-end">
           <div className="bg-white rounded-lg shadow-md border border-gray-200 flex items-center p-1 h-[38px]"><button onClick={() => setShowLayersHistorySidebar(!showLayersHistorySidebar)} className={`p-1.5 rounded transition-colors h-full flex items-center justify-center ${showLayersHistorySidebar ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}><ChevronsRight size={16} className={showLayersHistorySidebar ? "rotate-180" : ""} /></button><span className="text-xs font-medium px-2 text-gray-600 w-6 text-center select-none">{canvasItems.length}</span><button className="p-1.5 text-gray-400 h-full flex items-center justify-center"><Layers size={14} /></button></div>
           <div className="bg-white rounded-lg shadow-md border border-gray-200 flex items-center p-1 h-[38px]"><button className="p-1.5 hover:bg-gray-100 rounded text-gray-600 h-full flex items-center justify-center" onClick={() => handleZoom(0.9)}><Minus size={14} /></button><span className="text-xs font-medium px-2 min-w-[3rem] text-center text-gray-600 select-none">{Math.round(zoom)}%</span><button className="p-1.5 hover:bg-gray-100 rounded text-gray-600 h-full flex items-center justify-center" onClick={() => handleZoom(1.1)}><Plus size={14} /></button></div>
        </div>
      </div>
      {/* Right Sidebar ... */}
      <div className={`w-[400px] h-full bg-white border-l border-gray-200 flex flex-col shadow-xl relative z-30 transition-transform duration-300 ease-out ${showGeneratorSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* ... */}
           <div className="p-4 flex items-center justify-between border-b border-gray-100">
             <div className="flex items-center gap-3"><div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-xs">AI</div><span className="font-semibold text-sm">Gemini Generator</span></div>
             <div className="flex items-center gap-2 text-gray-400"><X size={18} className="hover:text-black cursor-pointer" onClick={() => setShowGeneratorSidebar(false)} /></div>
          </div>
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
            <div className="space-y-4 mb-6">
                {chatHistory.length === 0 ? (
                    <div className="text-center py-10 opacity-50"><div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600"><Sparkles size={24} /></div><h3 className="font-medium text-gray-900">Mulai Berkreasi</h3></div>
                ) : (
                    chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-800 text-white' : 'bg-indigo-600 text-white'}`}>{msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}</div>
                            <div className={`group relative max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-white border border-gray-200 shadow-sm rounded-tr-none' : 'bg-indigo-50 text-indigo-900 rounded-tl-none'}`}>
                                <p>{msg.text}</p>
                                {msg.img && (
                                    <div className="relative group/img cursor-pointer" onClick={() => setPreviewImage(msg.img)}>
                                        <img src={msg.img} alt="result" className="mt-2 rounded-lg w-full border border-indigo-100 hover:brightness-90 transition-all" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"><div className="bg-black/50 text-white p-2 rounded-full backdrop-blur-sm"><ZoomIn size={20} /></div></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
          </div>
           <div className="p-4 border-t border-gray-100 bg-white">
             <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 pb-12">
               <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }} placeholder="Jelaskan gambar yang ingin Anda buat..." className="w-full bg-transparent p-4 pr-12 text-sm text-gray-700 placeholder-gray-400 focus:outline-none resize-none h-24 rounded-2xl bg-white z-10 relative" />
               <div className="absolute bottom-3 left-3 flex items-center gap-2 z-20">
                  <div className="relative" ref={ratioMenuRef}>
                    <button onClick={() => { setShowRatioMenu(!showRatioMenu); setShowStyleMenu(false); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 transition-colors"><RatioIcon size={14} />{selectedRatio.label}</button>
                    {showRatioMenu && (
                        <div className="absolute bottom-full mb-2 left-0 w-32 bg-white rounded-xl shadow-xl border border-gray-200 p-1 z-30 animate-in fade-in slide-in-from-bottom-2">{ASPECT_RATIOS.map((r) => (<button key={r.label} onClick={() => { setSelectedRatio(r); setShowRatioMenu(false); }} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left ${selectedRatio.label === r.label ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'}`}><r.icon size={14} />{r.label}</button>))}</div>
                    )}
                  </div>
                  <div className="relative" ref={styleMenuRef}>
                    <button onClick={() => { setShowStyleMenu(!showStyleMenu); setShowRatioMenu(false); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedStyle !== "None" ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}><Palette size={14} />{selectedStyle === "None" ? "Style" : selectedStyle}</button>
                    {showStyleMenu && (
                        <div className="absolute bottom-full mb-2 left-0 w-40 bg-white rounded-xl shadow-xl border border-gray-200 p-1 z-30 animate-in fade-in slide-in-from-bottom-2 max-h-48 overflow-y-auto">{ART_STYLES.map((style) => (<button key={style} onClick={() => { setSelectedStyle(style); setShowStyleMenu(false); }} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left ${selectedStyle === style ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'}`}>{style}</button>))}</div>
                    )}
                  </div>
               </div>
               <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
                 <button onClick={() => handleGenerate()} disabled={loading || !inputValue.trim()} className={`p-2 rounded-full text-white shadow-md transition-all duration-200 flex items-center justify-center ${loading || !inputValue.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-black hover:bg-gray-800 hover:scale-105 active:scale-95'}`}>{loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} className="ml-0.5" />}</button>
               </div>
             </div>
          </div>
      </div>
      {!showGeneratorSidebar && <div className="absolute right-6 top-6 z-30"><button onClick={() => setShowGeneratorSidebar(true)} className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition-transform hover:scale-110 border border-gray-100"><LayoutTemplate size={20} className="text-gray-700" /></button></div>}
    </div>
  );
}
