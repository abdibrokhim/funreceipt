'use client'
// app/page.tsx
import React, { useRef, useEffect, useState, MouseEvent } from "react";
import Image from "next/image";
import Footer from "./components/Footer";
import { Analytics } from "@vercel/analytics/react"

export default function Home() {
  const [drawingColor, setDrawingColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState("2");
  const [isDrawing, setIsDrawing] = useState(false);

  const [showTextEditor, setShowTextEditor] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [strike, setStrike] = useState(false);

  // For draggable text editor:
  const [editorX, setEditorX] = useState(100); // default position
  const [editorY, setEditorY] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [dragOffsetY, setDragOffsetY] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const textEditorRef = useRef<HTMLDivElement | null>(null);

  const [lastX, setLastX] = useState<number | null>(null);
  const [lastY, setLastY] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    const imgElement = imageRef.current;
    if (imgElement && imgElement.complete) {
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
    } else if (imgElement) {
      imgElement.onload = () => {
        if (!canvasRef.current) return;
        canvasRef.current.width = imgElement.width;
        canvasRef.current.height = imgElement.height;
      };
    }
  }, []);

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (showTextEditor) return; // If text editor is open, don't draw
    setIsDrawing(true);
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLastX(x);
    setLastY(y);
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctxRef.current || showTextEditor) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const size = parseInt(brushSize, 10) || 3;
    ctxRef.current.strokeStyle = drawingColor;
    ctxRef.current.lineWidth = size;
    ctxRef.current.lineCap = "round";

    if (lastX !== null && lastY !== null) {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(lastX, lastY);
      ctxRef.current.lineTo(x, y);
      ctxRef.current.stroke();
    }

    setLastX(x);
    setLastY(y);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setLastX(null);
    setLastY(null);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDrawingColor(e.target.value);
  };

  const handleBrushSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Just ensure it's a number
    const val = e.target.value.replace(/[^0-9]/g, '');
    setBrushSize(val);
  };

  const downloadImage = () => {
    if (!canvasRef.current || !imageRef.current) return;

    // Create a temporary canvas to combine the image and the drawing
    const combinedCanvas = document.createElement("canvas");
    combinedCanvas.width = canvasRef.current.width;
    combinedCanvas.height = canvasRef.current.height;
    const combinedCtx = combinedCanvas.getContext("2d");
    if (!combinedCtx) return;

    // Draw the main image first
    combinedCtx.drawImage(imageRef.current, 0, 0);
    // Draw the user's drawing on top
    combinedCtx.drawImage(canvasRef.current, 0, 0);

    const dataUrl = combinedCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "my-drawing.png";
    link.click();
  };

  const applyTextToCanvas = () => {
    if (!ctxRef.current || !canvasRef.current) return;
    if (!textInput.trim()) {
      setShowTextEditor(false);
      return;
    }

    // Use the editor position as the text position
    // editorX, editorY corresponds to the panel's top-left corner.
    const x = editorX;
    const y = editorY;

    let fontWeight = bold ? "bold" : "normal";
    let fontStyle = italic ? "italic" : "normal";
    const fontSize = 16;
    const fontFamily = "sans-serif";
    ctxRef.current.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctxRef.current.fillStyle = drawingColor;
    ctxRef.current.textBaseline = "top";

    ctxRef.current.fillText(textInput, x, y);

    // Simulate underline and strike
    const textMetrics = ctxRef.current.measureText(textInput);
    const textHeight = fontSize; 
    if (underline) {
      const underlineY = y + textHeight + 2;
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(x, underlineY);
      ctxRef.current.lineTo(x + textMetrics.width, underlineY);
      ctxRef.current.strokeStyle = drawingColor;
      ctxRef.current.lineWidth = 1;
      ctxRef.current.stroke();
    }

    if (strike) {
      const strikeY = y + textHeight / 2;
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(x, strikeY);
      ctxRef.current.lineTo(x + textMetrics.width, strikeY);
      ctxRef.current.strokeStyle = drawingColor;
      ctxRef.current.lineWidth = 1;
      ctxRef.current.stroke();
    }

    // Hide editor after applying text
    setShowTextEditor(false);
    setTextInput("");
    setBold(false);
    setItalic(false);
    setUnderline(false);
    setStrike(false);
  };

  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragOffsetX(e.clientX - editorX);
    setDragOffsetY(e.clientY - editorY);
  };

  const onDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    // Update position based on mouse move
    const newX = e.clientX - dragOffsetX;
    const newY = e.clientY - dragOffsetY;
    setEditorX(newX);
    setEditorY(newY);
  };

  const endDrag = () => {
    setIsDragging(false);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] bg-[var(--bg-a)] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 font-[family-name:var(--font-geist-sans)]">
      <Analytics />
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-center relative">
        <div className="relative border border-[var(--text-c)] bg-transparent p-2">
          {/* Base image */}
          <Image
            ref={imageRef}
            src="/receipt.svg"
            alt="funreceipt"
            width={270}
            height={640}
            priority
            className="select-none"
          />
          {/* Drawing canvas overlay */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 cursor-[url('/pen-cursor.png'),_crosshair]"
            style={{ pointerEvents: "auto" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />

          {/* Text Editor Overlay (Modal) */}
{showTextEditor && (
  <div 
    className="fixed inset-0 z-20 flex items-center justify-center" 
    style={{ background: 'rgba(0,0,0,0.5)'}}
    onMouseMove={onDrag}
    onMouseUp={endDrag}
  >
    <div
      ref={textEditorRef}
      className="absolute w-80 shadow-2xl"
      style={{
        left: editorX,
        top: editorY,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={startDrag}
    >
      <div 
        className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-lg overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()} // prevent drag when interacting with editor inside
      >
        {/* Draggable Header */}
        <div 
          className="bg-white/10 p-3 cursor-move border-b border-white/20 flex items-center justify-between"
          onMouseDown={startDrag}
        >
          <span className="text-[var(--text-a)] text-sm">Text Editor</span>
          <button 
            onClick={() => setShowTextEditor(false)}
            className="text-[var(--text-a)] hover:text-red-500 transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Editor Content */}
        <div className="p-4 space-y-4">
          {/* Text Input */}
          <input
            type="text"
            placeholder="Type your text..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="text-sm w-full bg-white/10 border border-white/20 rounded-md text-[var(--text-a)] p-2 focus:outline-none focus:ring-1 focus:ring-[var(--text-b)] transition-all"
          />

          {/* Formatting Buttons */}
          <div className="flex items-center justify-center gap-2 text-sm">
            {[
              { 
                title: "Bold", 
                value: bold, 
                onClick: () => setBold(!bold),
                activeClass: "font-bold bg-white/20"
              },
              { 
                title: "Italic", 
                value: italic, 
                onClick: () => setItalic(!italic),
                activeClass: "italic bg-white/20"
              },
              { 
                title: "Underline", 
                value: underline, 
                onClick: () => setUnderline(!underline),
                activeClass: "underline bg-white/20"
              },
              { 
                title: "Strikethrough", 
                value: strike, 
                onClick: () => setStrike(!strike),
                activeClass: "line-through bg-white/20"
              }
            ].map((button) => (
              <button
                key={button.title}
                onClick={button.onClick}
                className={`w-8 h-8 rounded-md border border-white/20 text-[var(--text-a)] 
                  transition-all hover:bg-white/10 
                  ${button.value ? button.activeClass : ''}`}
                title={button.title}
              >
                {button.title[0]}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={applyTextToCanvas}
              className="flex-1 bg-green-500/20 border border-green-500/30 text-green-500 
                py-2 rounded-md hover:bg-green-500/30 transition-colors text-sm"
            >
              Apply
            </button>
            <button
              onClick={() => setShowTextEditor(false)}
              className="flex-1 bg-red-500/20 border border-red-500/30 text-red-500 
                py-2 rounded-md hover:bg-red-500/30 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
        </div>

{/* Toolbar */}
<div className="flex flex-row items-center gap-4 p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg w-full justify-between">
  {/* Color Picker and Brush Size Container */}
  <div className="flex items-center space-x-3">
    {/* Color Picker */}
    <div className="relative group">
    <input
      type="color"
      value={drawingColor}
      onChange={handleColorChange}
      className="w-10 h-10 p-0 border-none! outline-none! focus:outline-none! appearance-none bg-transparent cursor-pointer rounded-lg! input-none!"
    />
    </div>

    {/* Brush Size Input */}
    <div className="relative">
      <input
        type="text"
        value={brushSize}
        onChange={handleBrushSizeChange}
        className="w-12 text-sm rounded-lg p-2 bg-white/10 text-[var(--text-a)] 
          border border-white/20 focus:outline-none focus:ring-1 focus:ring-[var(--text-b)] 
          transition-all"
        title="Brush Size"
        placeholder="Size"
      />
    </div>
  </div>

  {/* Tool Action Buttons */}
  <div className="flex items-center space-x-3">
    {/* Text Editor Button */}
    <button
      onClick={() => setShowTextEditor(!showTextEditor)}
      className="group flex items-center justify-center w-10 h-10 rounded-lg 
        bg-white/10 border border-white/20 text-[var(--text-a)] 
        hover:bg-white/20 hover:border-white/30 transition-all"
      title="Text Editor"
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        className="group-hover:scale-110 transition-transform"
      >
        <path 
          fill="currentColor" 
          fillRule="evenodd" 
          d="M4 5.5a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V6h-6.5v13H15a.5.5 0 0 1 0 1H9a.5.5 0 0 1 0-1h2.5V6H5v2.5a.5.5 0 0 1-1 0z" 
          clipRule="evenodd"
        ></path>
      </svg>
    </button>

    {/* Download Button */}
    <button
      onClick={downloadImage}
      className="group flex items-center justify-center w-10 h-10 rounded-lg 
        bg-white/10 border border-white/20 text-[var(--text-a)] 
        hover:bg-white/20 hover:border-white/30 transition-all"
      title="Download Image"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        className="group-hover:scale-110 transition-transform"
      >
        <path 
          fill="currentColor" 
          d="M12 16l4-5h-3V4h-2v7H8z"
        />
        <path 
          fill="currentColor" 
          d="M20 18H4v-7H2v7c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-7h-2z"
        />
      </svg>
    </button>
  </div>
</div>
      </main>
        <Footer />
    </div>
  );
}
