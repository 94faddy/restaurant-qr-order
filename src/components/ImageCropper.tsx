// ===================================================
// FILE: ImageCropper.tsx
// PATH: src/components/ImageCropper.tsx
// FIXED: 
//   1. ใช้ Pointer Events API (ไม่มี passive error)
//   2. ไม่ให้ crop หลุดขอบรูปภาพ
//   3. จำกัด zoom ให้รูปครอบคลุม crop area เสมอ
// ===================================================

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number | null;
  minCropSize?: number;
  outputSize?: { width: number; height: number };
}

type DragMode = 'none' | 'image' | 'crop' | 'resize-nw' | 'resize-n' | 'resize-ne' | 'resize-e' | 'resize-se' | 'resize-s' | 'resize-sw' | 'resize-w';

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  minCropSize = 50,
  outputSize = { width: 400, height: 400 },
}: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  const [zoom, setZoom] = useState(1);
  const [imagePos, setImagePos] = useState({ x: 0, y: 0 });
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 200, height: 200 });
  
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [dragStart, setDragStart] = useState({ 
    pointerX: 0, 
    pointerY: 0, 
    imgX: 0, 
    imgY: 0,
    cropX: 0, 
    cropY: 0, 
    cropW: 0, 
    cropH: 0 
  });

  // คำนวณตำแหน่งและขนาดรูปบนหน้าจอ
  const getImageBounds = useCallback(() => {
    const scaledW = imageNaturalSize.width * zoom;
    const scaledH = imageNaturalSize.height * zoom;
    const imgLeft = (containerSize.width - scaledW) / 2 + imagePos.x;
    const imgTop = (containerSize.height - scaledH) / 2 + imagePos.y;
    const imgRight = imgLeft + scaledW;
    const imgBottom = imgTop + scaledH;
    
    return { imgLeft, imgTop, imgRight, imgBottom, scaledW, scaledH };
  }, [imageNaturalSize, zoom, containerSize, imagePos]);

  // โหลดรูปภาพ
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error('Failed to load image');
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // ตั้งค่าเริ่มต้นเมื่อรูปโหลดเสร็จ
  useEffect(() => {
    if (!imageLoaded || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;
    setContainerSize({ width: cw, height: ch });
    
    // ตั้งค่า crop area เริ่มต้น (กลางจอ)
    let cropW = Math.min(cw, ch) * 0.6;
    let cropH = aspectRatio ? cropW / aspectRatio : cropW;
    
    if (cropH > ch * 0.7) {
      cropH = ch * 0.7;
      cropW = aspectRatio ? cropH * aspectRatio : cropH;
    }
    
    const cropX = (cw - cropW) / 2;
    const cropY = (ch - cropH) / 2;
    
    setCropArea({ x: cropX, y: cropY, width: cropW, height: cropH });
    
    // คำนวณ zoom ให้รูปครอบคลุม crop area
    const scaleX = cropW / imageNaturalSize.width;
    const scaleY = cropH / imageNaturalSize.height;
    const initialZoom = Math.max(scaleX, scaleY) * 1.5;
    setZoom(initialZoom);
    
    setImagePos({ x: 0, y: 0 });
  }, [imageLoaded, imageNaturalSize, aspectRatio]);

  // ===== POINTER DOWN =====
  const handlePointerDown = useCallback((e: React.PointerEvent, mode: DragMode) => {
    e.preventDefault();
    e.stopPropagation();
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setDragMode(mode);
    setDragStart({
      pointerX: e.clientX,
      pointerY: e.clientY,
      imgX: imagePos.x,
      imgY: imagePos.y,
      cropX: cropArea.x,
      cropY: cropArea.y,
      cropW: cropArea.width,
      cropH: cropArea.height,
    });
  }, [imagePos, cropArea]);

  // ===== POINTER MOVE =====
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragMode === 'none') return;
    
    e.preventDefault();
    
    const dx = e.clientX - dragStart.pointerX;
    const dy = e.clientY - dragStart.pointerY;
    
    const { imgLeft, imgTop, imgRight, imgBottom } = getImageBounds();
    
    // ลากรูป - จำกัดไม่ให้ crop หลุดขอบรูป
    if (dragMode === 'image') {
      let newX = dragStart.imgX + dx;
      let newY = dragStart.imgY + dy;
      
      // คำนวณตำแหน่งรูปใหม่
      const scaledW = imageNaturalSize.width * zoom;
      const scaledH = imageNaturalSize.height * zoom;
      const newImgLeft = (containerSize.width - scaledW) / 2 + newX;
      const newImgTop = (containerSize.height - scaledH) / 2 + newY;
      const newImgRight = newImgLeft + scaledW;
      const newImgBottom = newImgTop + scaledH;
      
      // จำกัดให้ crop area อยู่ภายในรูปเสมอ
      if (newImgLeft > cropArea.x) {
        newX = cropArea.x - (containerSize.width - scaledW) / 2;
      }
      if (newImgTop > cropArea.y) {
        newY = cropArea.y - (containerSize.height - scaledH) / 2;
      }
      if (newImgRight < cropArea.x + cropArea.width) {
        newX = (cropArea.x + cropArea.width) - scaledW - (containerSize.width - scaledW) / 2;
      }
      if (newImgBottom < cropArea.y + cropArea.height) {
        newY = (cropArea.y + cropArea.height) - scaledH - (containerSize.height - scaledH) / 2;
      }
      
      setImagePos({ x: newX, y: newY });
      return;
    }
    
    // ลาก crop area - จำกัดให้อยู่ภายในรูป
    if (dragMode === 'crop') {
      let newX = dragStart.cropX + dx;
      let newY = dragStart.cropY + dy;
      
      // จำกัดให้อยู่ภายในรูป
      newX = Math.max(imgLeft, Math.min(newX, imgRight - cropArea.width));
      newY = Math.max(imgTop, Math.min(newY, imgBottom - cropArea.height));
      
      setCropArea(prev => ({ ...prev, x: newX, y: newY }));
      return;
    }
    
    // Resize crop area - จำกัดให้อยู่ภายในรูป
    if (dragMode.startsWith('resize-')) {
      const handle = dragMode.replace('resize-', '');
      
      let newX = dragStart.cropX;
      let newY = dragStart.cropY;
      let newW = dragStart.cropW;
      let newH = dragStart.cropH;
      
      // คำนวณตาม handle
      if (handle.includes('w')) {
        newX = Math.max(imgLeft, dragStart.cropX + dx);
        newW = dragStart.cropW - (newX - dragStart.cropX);
      }
      if (handle.includes('e')) {
        newW = Math.min(imgRight - dragStart.cropX, dragStart.cropW + dx);
      }
      if (handle.includes('n')) {
        newY = Math.max(imgTop, dragStart.cropY + dy);
        newH = dragStart.cropH - (newY - dragStart.cropY);
      }
      if (handle.includes('s')) {
        newH = Math.min(imgBottom - dragStart.cropY, dragStart.cropH + dy);
      }
      
      // รักษา aspect ratio
      if (aspectRatio) {
        if (handle === 'n' || handle === 's') {
          const centerX = newX + newW / 2;
          newW = newH * aspectRatio;
          newX = centerX - newW / 2;
          // ตรวจสอบไม่ให้เกินขอบรูป
          if (newX < imgLeft) {
            newX = imgLeft;
            newW = Math.min(newW, imgRight - imgLeft);
            newH = newW / aspectRatio;
          }
          if (newX + newW > imgRight) {
            newW = imgRight - newX;
            newH = newW / aspectRatio;
          }
        } else if (handle === 'e' || handle === 'w') {
          const centerY = newY + newH / 2;
          newH = newW / aspectRatio;
          newY = centerY - newH / 2;
          // ตรวจสอบไม่ให้เกินขอบรูป
          if (newY < imgTop) {
            newY = imgTop;
            newH = Math.min(newH, imgBottom - imgTop);
            newW = newH * aspectRatio;
          }
          if (newY + newH > imgBottom) {
            newH = imgBottom - newY;
            newW = newH * aspectRatio;
          }
        } else {
          // มุม
          newH = newW / aspectRatio;
          if (handle.includes('n')) {
            newY = dragStart.cropY + dragStart.cropH - newH;
          }
          // ตรวจสอบขอบ
          if (newY < imgTop) {
            newY = imgTop;
            newH = Math.min(dragStart.cropY + dragStart.cropH - imgTop, imgBottom - imgTop);
            newW = newH * aspectRatio;
          }
          if (newY + newH > imgBottom) {
            newH = imgBottom - newY;
            newW = newH * aspectRatio;
          }
        }
      }
      
      // จำกัดขนาดขั้นต่ำ
      if (newW < minCropSize) {
        newW = minCropSize;
        if (aspectRatio) newH = newW / aspectRatio;
        if (handle.includes('w')) {
          newX = dragStart.cropX + dragStart.cropW - minCropSize;
        }
      }
      if (newH < minCropSize) {
        newH = minCropSize;
        if (aspectRatio) newW = newH * aspectRatio;
        if (handle.includes('n')) {
          newY = dragStart.cropY + dragStart.cropH - minCropSize;
        }
      }
      
      // จำกัดไม่ให้เกินขอบรูป (final check)
      newX = Math.max(imgLeft, newX);
      newY = Math.max(imgTop, newY);
      if (newX + newW > imgRight) newW = imgRight - newX;
      if (newY + newH > imgBottom) newH = imgBottom - newY;
      
      setCropArea({ x: newX, y: newY, width: newW, height: newH });
    }
  }, [dragMode, dragStart, containerSize, imageNaturalSize, zoom, cropArea, aspectRatio, minCropSize, getImageBounds]);

  // ===== POINTER UP =====
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setDragMode('none');
  }, []);

  // ===== ZOOM CHANGE - จำกัดให้รูปครอบคลุม crop area เสมอ =====
  const handleZoomChange = useCallback((newZoom: number) => {
    // คำนวณ zoom ขั้นต่ำให้รูปครอบคลุม crop area
    const minZoomX = cropArea.width / imageNaturalSize.width;
    const minZoomY = cropArea.height / imageNaturalSize.height;
    const minZoom = Math.max(minZoomX, minZoomY) * 1.01; // เพิ่มนิดหน่อยเพื่อความปลอดภัย
    
    const clampedZoom = Math.max(minZoom, Math.min(3, newZoom));
    setZoom(clampedZoom);
    
    // ปรับตำแหน่งรูปให้ crop area ไม่หลุดขอบ
    const scaledW = imageNaturalSize.width * clampedZoom;
    const scaledH = imageNaturalSize.height * clampedZoom;
    const imgLeft = (containerSize.width - scaledW) / 2 + imagePos.x;
    const imgTop = (containerSize.height - scaledH) / 2 + imagePos.y;
    const imgRight = imgLeft + scaledW;
    const imgBottom = imgTop + scaledH;
    
    let newX = imagePos.x;
    let newY = imagePos.y;
    
    if (imgLeft > cropArea.x) {
      newX = cropArea.x - (containerSize.width - scaledW) / 2;
    }
    if (imgTop > cropArea.y) {
      newY = cropArea.y - (containerSize.height - scaledH) / 2;
    }
    if (imgRight < cropArea.x + cropArea.width) {
      newX = (cropArea.x + cropArea.width) - scaledW - (containerSize.width - scaledW) / 2;
    }
    if (imgBottom < cropArea.y + cropArea.height) {
      newY = (cropArea.y + cropArea.height) - scaledH - (containerSize.height - scaledH) / 2;
    }
    
    if (newX !== imagePos.x || newY !== imagePos.y) {
      setImagePos({ x: newX, y: newY });
    }
  }, [cropArea, imageNaturalSize, containerSize, imagePos]);

  // ===== CROP & EXPORT =====
  const handleCrop = useCallback(() => {
    if (!imageRef.current) {
      console.error('Image ref not found');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Canvas context not found');
      return;
    }

    const img = imageRef.current;
    
    // คำนวณตำแหน่งรูปบน container
    const scaledW = imageNaturalSize.width * zoom;
    const scaledH = imageNaturalSize.height * zoom;
    const imgScreenX = (containerSize.width - scaledW) / 2 + imagePos.x;
    const imgScreenY = (containerSize.height - scaledH) / 2 + imagePos.y;
    
    // คำนวณส่วนที่ต้อง crop จากรูปต้นฉบับ
    let sourceX = (cropArea.x - imgScreenX) / zoom;
    let sourceY = (cropArea.y - imgScreenY) / zoom;
    let sourceW = cropArea.width / zoom;
    let sourceH = cropArea.height / zoom;
    
    // ตรวจสอบให้อยู่ในขอบเขตรูปต้นฉบับ
    sourceX = Math.max(0, Math.min(sourceX, imageNaturalSize.width));
    sourceY = Math.max(0, Math.min(sourceY, imageNaturalSize.height));
    sourceW = Math.min(sourceW, imageNaturalSize.width - sourceX);
    sourceH = Math.min(sourceH, imageNaturalSize.height - sourceY);
    
    // กำหนดขนาด output
    canvas.width = outputSize.width;
    canvas.height = aspectRatio ? outputSize.width / aspectRatio : outputSize.height;
    
    // วาดพื้นหลังขาว (กรณีรูป PNG โปร่งใส)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceW, sourceH,
      0, 0, canvas.width, canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
        } else {
          console.error('Failed to create blob');
        }
      },
      'image/jpeg',
      0.92
    );
  }, [imageNaturalSize, zoom, containerSize, imagePos, cropArea, outputSize, aspectRatio, onCropComplete]);

  // Resize handle styles
  const handlePositions: Record<string, React.CSSProperties> = {
    'nw': { top: -8, left: -8, cursor: 'nw-resize' },
    'n': { top: -8, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
    'ne': { top: -8, right: -8, cursor: 'ne-resize' },
    'e': { top: '50%', right: -8, transform: 'translateY(-50%)', cursor: 'e-resize' },
    'se': { bottom: -8, right: -8, cursor: 'se-resize' },
    's': { bottom: -8, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
    'sw': { bottom: -8, left: -8, cursor: 'sw-resize' },
    'w': { top: '50%', left: -8, transform: 'translateY(-50%)', cursor: 'w-resize' },
  };

  // คำนวณ min zoom
  const minZoom = imageNaturalSize.width > 0 
    ? Math.max(cropArea.width / imageNaturalSize.width, cropArea.height / imageNaturalSize.height) * 1.01
    : 0.5;

  if (!imageLoaded) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">กำลังโหลดรูปภาพ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-white/80 hover:text-white px-4 py-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          ยกเลิก
        </button>
        
        <span className="text-white font-medium">ปรับขนาดรูปภาพ</span>
        
        <button
          onClick={handleCrop}
          className="flex items-center gap-2 bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          ใช้รูปนี้
        </button>
      </div>

      {/* Main Crop Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden touch-none select-none"
        style={{ cursor: dragMode === 'image' ? 'grabbing' : 'grab' }}
        onPointerDown={(e) => handlePointerDown(e, 'image')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Image */}
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Crop"
          className="absolute pointer-events-none select-none"
          style={{
            left: '50%',
            top: '50%',
            width: imageNaturalSize.width * zoom,
            height: imageNaturalSize.height * zoom,
            transform: `translate(-50%, -50%) translate(${imagePos.x}px, ${imagePos.y}px)`,
            maxWidth: 'none',
          }}
          draggable={false}
          crossOrigin="anonymous"
        />

        {/* Dark Overlay - 4 ส่วนรอบ crop area */}
        <div 
          className="absolute bg-black/60 pointer-events-none" 
          style={{ top: 0, left: 0, right: 0, height: Math.max(0, cropArea.y) }} 
        />
        <div 
          className="absolute bg-black/60 pointer-events-none" 
          style={{ bottom: 0, left: 0, right: 0, height: Math.max(0, containerSize.height - cropArea.y - cropArea.height) }} 
        />
        <div 
          className="absolute bg-black/60 pointer-events-none" 
          style={{ top: cropArea.y, left: 0, width: Math.max(0, cropArea.x), height: cropArea.height }} 
        />
        <div 
          className="absolute bg-black/60 pointer-events-none" 
          style={{ top: cropArea.y, right: 0, width: Math.max(0, containerSize.width - cropArea.x - cropArea.width), height: cropArea.height }} 
        />

        {/* Crop Frame */}
        <div
          className="absolute border-2 border-white shadow-lg"
          style={{
            left: cropArea.x,
            top: cropArea.y,
            width: cropArea.width,
            height: cropArea.height,
            cursor: dragMode === 'crop' ? 'grabbing' : 'move',
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            handlePointerDown(e, 'crop');
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Grid 3x3 */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/50" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/50" />
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/50" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/50" />
          </div>
          
          {/* Resize Handles */}
          {Object.entries(handlePositions).map(([pos, style]) => (
            <div
              key={pos}
              className="absolute w-5 h-5 bg-white rounded-full border-2 border-blue-500 z-10 hover:scale-110 transition-transform"
              style={style}
              onPointerDown={(e) => {
                e.stopPropagation();
                handlePointerDown(e, `resize-${pos}` as DragMode);
              }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
          ))}
        </div>

        {/* Size indicator */}
        <div 
          className="absolute bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none"
          style={{ 
            left: cropArea.x + cropArea.width / 2, 
            top: cropArea.y + cropArea.height + 12,
            transform: 'translateX(-50%)'
          }}
        >
          {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-black/50">
        <div className="max-w-md mx-auto">
          {/* Zoom */}
          <div className="flex items-center gap-3">
            <button 
              className="p-2 text-white/70 hover:text-white disabled:opacity-30"
              onClick={() => handleZoomChange(zoom - 0.1)}
              disabled={zoom <= minZoom}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            <input
              type="range"
              min={minZoom}
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:cursor-pointer"
            />
            
            <button 
              className="p-2 text-white/70 hover:text-white disabled:opacity-30"
              onClick={() => handleZoomChange(zoom + 0.1)}
              disabled={zoom >= 3}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            <span className="text-white/60 text-sm w-14 text-right">{Math.round(zoom * 100)}%</span>
          </div>
          
          {/* Instructions */}
          <p className="text-center text-white/50 text-sm mt-3">
            ลากรูปเพื่อเลื่อน • ลากกรอบเพื่อย้าย • ลากมุมเพื่อปรับขนาด
          </p>
        </div>
      </div>
    </div>
  );
}