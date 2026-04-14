import type { ImageItem, AspectRatio } from '../types';
import { ASPECT_RATIOS } from '../types';

interface LayoutRect {
  x: number;
  y: number;
  w: number;
  h: number;
  imageIndex: number;
}

export function computeAutoLayout(
  images: ImageItem[],
  aspectRatio: AspectRatio,
  containerWidth: number,
  gapSize: number = 0
): { layout: LayoutRect[]; canvasW: number; canvasH: number } {
  const ar = ASPECT_RATIOS[aspectRatio];
  const canvasW = containerWidth;
  const canvasH = Math.round(containerWidth * (ar.h / ar.w));

  if (images.length === 0) return { layout: [], canvasW, canvasH };
  if (images.length === 1) {
    return {
      layout: [{ x: gapSize, y: gapSize, w: canvasW - gapSize * 2, h: canvasH - gapSize * 2, imageIndex: 0 }],
      canvasW,
      canvasH,
    };
  }

  const n = images.length;
  const innerW = canvasW - gapSize * 2;
  const innerH = canvasH - gapSize * 2;

  const targetImgsPerRow = Math.max(1, Math.round(Math.sqrt(n * (ar.w / ar.h))));
  const actualRowCount = Math.ceil(n / targetImgsPerRow);
  const rowH = (innerH - gapSize * (actualRowCount - 1)) / actualRowCount;

  const layout: LayoutRect[] = [];
  let idx = 0;

  for (let r = 0; r < actualRowCount && idx < n; r++) {
    const remainingRows = actualRowCount - r;
    const remainingImages = n - idx;
    const rowImageCount = Math.ceil(remainingImages / remainingRows);
    const rowImages = images.slice(idx, idx + rowImageCount);

    const totalAR = rowImages.reduce(
      (sum, img) => sum + img.width / img.height,
      0
    );
    const availW = innerW - gapSize * (rowImages.length - 1);
    let x = gapSize;
    const y = gapSize + r * (rowH + gapSize);

    for (let c = 0; c < rowImages.length; c++) {
      const imgAR = rowImages[c].width / rowImages[c].height;
      const w = c === rowImages.length - 1
        ? canvasW - gapSize - x
        : Math.round((imgAR / totalAR) * availW);
      layout.push({
        x,
        y,
        w,
        h: rowH,
        imageIndex: idx + c,
      });
      x += w + gapSize;
    }
    idx += rowImageCount;
  }

  return { layout, canvasW, canvasH };
}
