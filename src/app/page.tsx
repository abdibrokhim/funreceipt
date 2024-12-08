'use client'

// app/page.tsx
import React, { useRef, useEffect, useState, MouseEvent } from "react";
import Image from "next/image";
import Footer from "./components/Footer";

export default function Home() {
  const [drawingColor, setDrawingColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);

  const [showTextEditor, setShowTextEditor] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [strike, setStrike] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

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

    ctxRef.current.strokeStyle = drawingColor;
    ctxRef.current.lineWidth = brushSize;
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
    setBrushSize(Number(e.target.value));
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

    // Position text at a default place. Let's say top-left corner offset.
    const x = 50;
    const y = 50;

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

  return (
    <div className="grid grid-rows-[20px_1fr_20px] bg-[var(--bg-a)] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start relative">
        <div className="relative border border-[var(--text-b)] bg-transparent p-2">
          {/* Base image */}
          <Image
            ref={imageRef}
            src="/funreceipt.svg"
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
          {/* Text Editor Overlay */}
          {showTextEditor && (
            <div className="absolute top-10 left-10 border border-[var(--text-b)] bg-transparent p-4 flex flex-col gap-3 z-10">
              <input
                type="text"
                placeholder="Type your text..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="bg-transparent border border-[var(--text-b)] text-[var(--text-a)] p-1 focus:outline-none focus:ring-0"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBold(!bold)}
                  className={`border border-[var(--text-b)] bg-transparent text-[var(--text-a)] p-1 ${
                    bold ? "font-bold" : "font-normal"
                  }`}
                  title="Bold"
                >
                  B
                </button>
                <button
                  onClick={() => setItalic(!italic)}
                  className={`border border-[var(--text-b)] bg-transparent text-[var(--text-a)] p-1 ${
                    italic ? "italic" : "normal"
                  }`}
                  title="Italic"
                >
                  I
                </button>
                <button
                  onClick={() => setUnderline(!underline)}
                  className={`border border-[var(--text-b)] bg-transparent text-[var(--text-a)] p-1 ${
                    underline ? "underline" : "no-underline"
                  }`}
                  title="Underline"
                >
                  U
                </button>
                <button
                  onClick={() => setStrike(!strike)}
                  className={`border border-[var(--text-b)] bg-transparent text-[var(--text-a)] p-1 ${
                    strike ? "line-through" : "no-underline"
                  }`}
                  title="Strikethrough"
                >
                  S
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={applyTextToCanvas}
                  className="border border-[var(--text-b)] bg-transparent text-[var(--text-a)] p-1 px-2"
                >
                  Apply
                </button>
                <button
                  onClick={() => setShowTextEditor(false)}
                  className="border border-[var(--text-b)] bg-transparent text-[var(--text-a)] p-1 px-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-row items-center gap-4 p-4 rounded-md bg-transparent border border-[var(--text-b)] w-full justify-between flex-wrap">
          {/* Brush Tools */}
          <div className="flex items-center gap-2 bg-transparent border border-[var(--text-b)] p-2 rounded-md">
            <input
              type="color"
              value={drawingColor}
              onChange={handleColorChange}
              className="w-8 h-8 p-0 border-none outline-none bg-transparent cursor-pointer rounded-full"
            />
            <input
              type="number"
              min={1}
              max={50}
              value={brushSize}
              onChange={handleBrushSizeChange}
              className="w-12 text-sm p-1 bg-transparent text-[var(--text-a)] border border-[var(--text-b)] focus:outline-none"
              title="Brush Size"
            />
          </div>

          {/* Text Mode Button */}
          <button
            onClick={() => setShowTextEditor(!showTextEditor)}
            className="bg-transparent border border-[var(--text-b)] text-[var(--text-a)] py-1 px-3 hover:bg-[var(--ring)] transition-colors"
          >
            {showTextEditor ? "Close Text Editor" : "Open Text Editor"}
          </button>

          {/* Download Button */}
          <button
            onClick={downloadImage}
            className="flex items-center justify-center py-2 px-4 sm:px-8 text-sm rounded-full transition-colors bg-transparent border border-[var(--text-b)] text-[var(--text-a)] hover:bg-[var(--ring)]"
          >
            <span className="mr-2">Download</span>
            <Image
              aria-hidden
              src="/download.svg"
              alt="Download Icon"
              width={20}
              height={20}
            />
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
