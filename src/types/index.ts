export interface ImageItem {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
  name: string;
  // Position on workspace
  x: number;
  y: number;
  selected: boolean;
}

export interface PlacedImage {
  placementId: string;
  imageId: string;
  gridCol: number;
  gridRow: number;
  colSpan: number;
  rowSpan: number;
  panX: number;
  panY: number;
  zoom: number;
}

export type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '21:9';

export const ASPECT_RATIOS: Record<AspectRatio, { w: number; h: number }> = {
  '1:1': { w: 1, h: 1 },
  '4:3': { w: 4, h: 3 },
  '3:4': { w: 3, h: 4 },
  '16:9': { w: 16, h: 9 },
  '9:16': { w: 9, h: 16 },
  '21:9': { w: 21, h: 9 },
};
