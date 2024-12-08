'use client';

// app/page.tsx
import React, { useRef, useEffect, useState, MouseEvent } from "react";
import Image from "next/image";
import Footer from "./components/Footer";

export default function Home() {
  const [drawingColor, setDrawingColor] = useState("#ffffff");
  const [isDrawing, setIsDrawing] = useState(false);
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
    setIsDrawing(true);
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLastX(x);
    setLastY(y);
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctxRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctxRef.current.strokeStyle = drawingColor;
    ctxRef.current.lineWidth = 3;
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

  const loader = () => {
    return (
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
    );
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] bg-[var(--bg-a)] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start relative">
        <div className="relative">
          {/* Base image */}
          <Image
            ref={imageRef}
            src="/funreceipt.svg"
            alt="funreceipt"
            width={270}
            height={640}
            priority
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
        </div>

        {/* Toolbar */}
        <div className="flex flex-row items-center gap-4 p-4 rounded-md bg-[var(--bg-a)] shadow-md w-full justify-between">
          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <label htmlFor="colorPicker" className="text-[var(--text-b)]">
              Brush Color:
            </label>
            <input
              id="colorPicker"
              type="color"
              value={drawingColor}
              onChange={handleColorChange}
              className="w-8 h-8 p-0 border-none outline-none bg-transparent cursor-pointer"
            />
          </div>

          {/* Download Button (your provided style) */}
          <button
            onClick={downloadImage}
            className={`flex items-center justify-center py-2 px-4 sm:px-8 text-sm md:text-sm rounded-full shadow transition-colors 
              cursor-pointer bg-[var(--violet)] hover:bg-[var(--ring)] text-[var(--text-a)]`}
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
