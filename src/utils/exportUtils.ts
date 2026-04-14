import { ASPECT_RATIOS } from '../types';
import { useAppStore } from '../store/useAppStore';

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function addCanvasToWorkspace(canvas: HTMLCanvasElement) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const file = new File([blob], `collage-${Date.now()}.png`, { type: 'image/png' });
    useAppStore.getState().addImages([file]);
  }, 'image/png');
}

type ExportMode = '4k' | 'original' | 'clipboard';

function getTargetSize(mode: ExportMode, images: { width: number; height: number }[], arW: number, arH: number) {
  if (mode === '4k') {
    if (arW >= arH) {
      return { w: 3840, h: Math.round(3840 * (arH / arW)) };
    } else {
      return { w: Math.round(3840 * (arW / arH)), h: 3840 };
    }
  }
  // Original quality: based on smallest source image
  if (images.length === 0) return { w: 1920, h: Math.round(1920 * (arH / arW)) };
  const minDim = Math.min(...images.map((i) => Math.min(i.width, i.height)));
  // Scale so that the smallest image isn't upscaled
  // Use minDim as a reference for cell size, then compute total
  const cellCount = Math.max(images.length, 1);
  const gridSide = Math.ceil(Math.sqrt(cellCount));
  const longEdge = minDim * gridSide;
  const clamped = Math.min(longEdge, 7680); // cap at 8K
  if (arW >= arH) {
    return { w: clamped, h: Math.round(clamped * (arH / arW)) };
  } else {
    return { w: Math.round(clamped * (arW / arH)), h: clamped };
  }
}

export async function exportCollage(mode: ExportMode = '4k') {
  const state = useAppStore.getState();
  const { placedImages, columns, rows, gap, aspectRatio, images, gapColor } = state;
  const ar = ASPECT_RATIOS[aspectRatio];

  const imgDims = placedImages.map((p) => {
    const img = images.find((i) => i.id === p.imageId);
    return img ? { width: img.width, height: img.height } : { width: 1024, height: 1024 };
  });

  const { w: canvasW, h: canvasH } = getTargetSize(mode, imgDims, ar.w, ar.h);

  const scaledGap = Math.round(gap * (canvasW / 800));
  const totalGapW = scaledGap * (columns + 1);
  const totalGapH = scaledGap * (rows + 1);
  const cellW = (canvasW - totalGapW) / columns;
  const cellH = (canvasH - totalGapH) / rows;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e1e1e';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Gap color
  ctx.fillStyle = gapColor;
  for (let i = 0; i <= rows; i++) {
    const y = i * (cellH + scaledGap);
    ctx.fillRect(0, y, canvasW, scaledGap);
  }
  for (let j = 0; j <= columns; j++) {
    const x = j * (cellW + scaledGap);
    ctx.fillRect(x, 0, scaledGap, canvasH);
  }

  for (const placed of placedImages) {
    const img = images.find((i) => i.id === placed.imageId);
    if (!img) continue;

    const htmlImg = await loadHtmlImage(img.url);
    const destX = scaledGap + (placed.gridCol - 1) * (cellW + scaledGap);
    const destY = scaledGap + (placed.gridRow - 1) * (cellH + scaledGap);
    const destW = placed.colSpan * cellW + (placed.colSpan - 1) * scaledGap;
    const destH = placed.rowSpan * cellH + (placed.rowSpan - 1) * scaledGap;

    const imgAR = htmlImg.naturalWidth / htmlImg.naturalHeight;
    const destAR = destW / destH;
    const zoom = placed.zoom || 1;
    let srcW: number, srcH: number, srcX: number, srcY: number;

    if (imgAR > destAR) {
      srcH = htmlImg.naturalHeight / zoom;
      srcW = srcH * destAR;
      srcX = ((htmlImg.naturalWidth - srcW) * placed.panX) / 100;
      srcY = ((htmlImg.naturalHeight - srcH) * placed.panY) / 100;
    } else {
      srcW = htmlImg.naturalWidth / zoom;
      srcH = srcW / destAR;
      srcX = ((htmlImg.naturalWidth - srcW) * placed.panX) / 100;
      srcY = ((htmlImg.naturalHeight - srcH) * placed.panY) / 100;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(destX, destY, destW, destH);
    ctx.clip();
    ctx.drawImage(htmlImg, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
    ctx.restore();
  }

  if (mode === 'clipboard') {
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      } catch (e) {
        console.error('Clipboard write failed:', e);
      }
    }, 'image/png');
  } else {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const suffix = mode === 'original' ? 'original' : '4k';
      a.download = `chrono-collage-${suffix}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  // Add collage to workspace
  addCanvasToWorkspace(canvas);
}

export async function exportAutoCollage(
  imageItems: { url: string; width: number; height: number }[],
  layout: { x: number; y: number; w: number; h: number }[],
  canvasW: number,
  canvasH: number,
  _gap?: number,
  mode: ExportMode = '4k',
  gapColor: string = '#ffffff'
) {
  let scale: number;
  if (mode === 'original') {
    const minDim = imageItems.length > 0
      ? Math.min(...imageItems.map((i) => Math.min(i.width, i.height)))
      : 1024;
    const gridSide = Math.ceil(Math.sqrt(imageItems.length || 1));
    const targetLong = Math.min(minDim * gridSide, 7680);
    scale = targetLong / Math.max(canvasW, canvasH);
  } else {
    scale = 3840 / Math.max(canvasW, canvasH);
  }

  const outW = Math.round(canvasW * scale);
  const outH = Math.round(canvasH * scale);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = gapColor;
  ctx.fillRect(0, 0, outW, outH);

  for (let i = 0; i < layout.length; i++) {
    const item = layout[i];
    const img = imageItems[i];
    if (!img) continue;

    const htmlImg = await loadHtmlImage(img.url);
    const dx = Math.round(item.x * scale);
    const dy = Math.round(item.y * scale);
    const dw = Math.round(item.w * scale);
    const dh = Math.round(item.h * scale);

    const imgAR = htmlImg.naturalWidth / htmlImg.naturalHeight;
    const cellAR = dw / dh;
    let srcW: number, srcH: number, srcX: number, srcY: number;
    if (imgAR > cellAR) {
      srcH = htmlImg.naturalHeight;
      srcW = srcH * cellAR;
      srcX = (htmlImg.naturalWidth - srcW) / 2;
      srcY = 0;
    } else {
      srcW = htmlImg.naturalWidth;
      srcH = srcW / cellAR;
      srcX = 0;
      srcY = (htmlImg.naturalHeight - srcH) / 2;
    }

    ctx.drawImage(htmlImg, srcX, srcY, srcW, srcH, dx, dy, dw, dh);
  }

  if (mode === 'clipboard') {
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      } catch (e) {
        console.error('Clipboard write failed:', e);
      }
    }, 'image/png');
  } else {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const suffix = mode === 'original' ? 'original' : '4k';
      a.download = `chrono-collage-auto-${suffix}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  // Add collage to workspace
  addCanvasToWorkspace(canvas);
}
