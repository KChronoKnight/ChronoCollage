import { create } from 'zustand';
import type { ImageItem, PlacedImage, AspectRatio } from '../types';

interface AppState {
  // Workspace images
  images: ImageItem[];
  addImages: (files: File[]) => Promise<void>;
  removeImage: (id: string) => void;
  updateImagePosition: (id: string, x: number, y: number) => void;
  selectImage: (id: string, multi?: boolean) => void;
  selectAll: () => void;
  deselectAll: () => void;
  selectInRect: (x1: number, y1: number, x2: number, y2: number) => void;
  getSelectedImages: () => ImageItem[];

  // Manual collage modal
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;

  // Collage settings
  aspectRatio: AspectRatio;
  setAspectRatio: (ar: AspectRatio) => void;
  columns: number;
  rows: number;
  setColumns: (n: number) => void;
  setRows: (n: number) => void;
  gap: number;
  setGap: (g: number) => void;
  gapColor: string;
  setGapColor: (c: string) => void;

  // Placed images on grid
  placedImages: PlacedImage[];
  placeImage: (imageId: string, col: number, row: number) => void;
  removeFromGrid: (placementId: string) => void;
  updatePlacedImage: (placementId: string, updates: Partial<PlacedImage>) => void;
  resetGrid: () => void;

  // Undo/Redo
  undoStack: PlacedImage[][];
  redoStack: PlacedImage[][];
  undo: () => void;
  redo: () => void;

  // Auto collage
  autoCollageOpen: boolean;
  setAutoCollageOpen: (open: boolean) => void;

  // Project save/load
  saveProject: (name: string) => Promise<void>;
  loadProject: (file: File) => Promise<void>;
}

let nextId = 0;
let nextPlacementId = 0;

function loadImage(file: File): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ url, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

function loadImageFromDataUrl(dataUrl: string): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Failed to create blob')); return; }
        const url = URL.createObjectURL(blob);
        resolve({ url, width: img.naturalWidth, height: img.naturalHeight });
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper: push current placedImages to undo stack
function withUndo(state: AppState): { undoStack: PlacedImage[][]; redoStack: PlacedImage[][] } {
  return {
    undoStack: [...state.undoStack, [...state.placedImages]],
    redoStack: [],
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  images: [],

  addImages: async (files: File[]) => {
    const newImages: ImageItem[] = [];
    for (const file of files) {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) continue;
      try {
        const { url, width, height } = await loadImage(file);
        const id = `img-${nextId++}-${Date.now()}`;
        newImages.push({
          id, file, url, width, height,
          name: file.name,
          x: 0, y: 0, selected: false,
        });
      } catch (e) {
        console.error('Failed to load image:', file.name, e);
      }
    }
    set((s) => ({ images: [...s.images, ...newImages] }));
  },

  removeImage: (id) => {
    set((s) => {
      const img = s.images.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.url);
      return {
        images: s.images.filter((i) => i.id !== id),
        placedImages: s.placedImages.filter((p) => p.imageId !== id),
      };
    });
  },

  updateImagePosition: (id, x, y) => {
    set((s) => ({
      images: s.images.map((i) => (i.id === id ? { ...i, x, y } : i)),
    }));
  },

  selectImage: (id, multi) => {
    set((s) => ({
      images: s.images.map((i) => {
        if (i.id === id) return { ...i, selected: !multi ? true : !i.selected };
        if (!multi) return { ...i, selected: false };
        return i;
      }),
    }));
  },

  selectAll: () => {
    set((s) => ({ images: s.images.map((i) => ({ ...i, selected: true })) }));
  },

  deselectAll: () => {
    set((s) => ({ images: s.images.map((i) => ({ ...i, selected: false })) }));
  },

  selectInRect: (x1, y1, x2, y2) => {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const thumbW = 160;
    const thumbH = 120;
    set((s) => ({
      images: s.images.map((i) => {
        const intersects =
          i.x < maxX && (i.x + thumbW) > minX &&
          i.y < maxY && (i.y + thumbH) > minY;
        return { ...i, selected: intersects };
      }),
    }));
  },

  getSelectedImages: () => get().images.filter((i) => i.selected),

  modalOpen: false,
  openModal: () => set({ modalOpen: true }),
  closeModal: () => set({ modalOpen: false, placedImages: [], undoStack: [], redoStack: [] }),

  aspectRatio: '4:3',
  setAspectRatio: (ar) => set({ aspectRatio: ar }),
  columns: 3,
  rows: 3,
  setColumns: (n) => {
    const clamped = Math.max(1, Math.min(10, n));
    set((s) => ({
      columns: clamped,
      ...withUndo(s),
      placedImages: s.placedImages.filter(
        (p) => p.gridCol + p.colSpan - 1 <= clamped
      ),
    }));
  },
  setRows: (n) => {
    const clamped = Math.max(1, Math.min(10, n));
    set((s) => ({
      rows: clamped,
      ...withUndo(s),
      placedImages: s.placedImages.filter(
        (p) => p.gridRow + p.rowSpan - 1 <= clamped
      ),
    }));
  },
  gap: 0,
  setGap: (g) => set({ gap: g }),
  gapColor: '#ffffff',
  setGapColor: (c) => set({ gapColor: c }),

  placedImages: [],

  placeImage: (imageId, col, row) => {
    const placementId = `place-${nextPlacementId++}`;
    set((s) => ({
      ...withUndo(s),
      placedImages: [
        ...s.placedImages,
        { placementId, imageId, gridCol: col, gridRow: row, colSpan: 1, rowSpan: 1, panX: 50, panY: 50, zoom: 1 },
      ],
    }));
  },

  removeFromGrid: (placementId) => {
    set((s) => ({
      ...withUndo(s),
      placedImages: s.placedImages.filter((p) => p.placementId !== placementId),
    }));
  },

  updatePlacedImage: (placementId, updates) => {
    set((s) => ({
      placedImages: s.placedImages.map((p) =>
        p.placementId === placementId ? { ...p, ...updates } : p
      ),
    }));
  },

  resetGrid: () => set((s) => ({ ...withUndo(s), placedImages: [] })),

  // Undo/Redo
  undoStack: [],
  redoStack: [],

  undo: () => {
    set((s) => {
      if (s.undoStack.length === 0) return s;
      const prev = s.undoStack[s.undoStack.length - 1];
      return {
        undoStack: s.undoStack.slice(0, -1),
        redoStack: [...s.redoStack, [...s.placedImages]],
        placedImages: prev,
      };
    });
  },

  redo: () => {
    set((s) => {
      if (s.redoStack.length === 0) return s;
      const next = s.redoStack[s.redoStack.length - 1];
      return {
        redoStack: s.redoStack.slice(0, -1),
        undoStack: [...s.undoStack, [...s.placedImages]],
        placedImages: next,
      };
    });
  },

  autoCollageOpen: false,
  setAutoCollageOpen: (open) => set({ autoCollageOpen: open }),

  // Project save/load
  saveProject: async (name: string) => {
    const state = get();
    const imageData: { id: string; name: string; width: number; height: number; dataUrl: string; selected: boolean }[] = [];
    for (const img of state.images) {
      const dataUrl = await fileToDataUrl(img.file);
      imageData.push({ id: img.id, name: img.name, width: img.width, height: img.height, dataUrl, selected: img.selected });
    }
    const project = {
      version: 1,
      images: imageData,
      placedImages: state.placedImages,
      aspectRatio: state.aspectRatio,
      columns: state.columns,
      rows: state.rows,
      gap: state.gap,
      gapColor: state.gapColor,
    };
    const json = JSON.stringify(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  loadProject: async (file: File) => {
    try {
      const text = await file.text();
      const project = JSON.parse(text);
      if (project.version !== 1) throw new Error('Unsupported project version');

      // Revoke old URLs
      const state = get();
      state.images.forEach((img) => URL.revokeObjectURL(img.url));

      // Recreate images from data URLs
      const newImages: ImageItem[] = [];
      for (const imgData of project.images) {
        const { url, width, height } = await loadImageFromDataUrl(imgData.dataUrl);
        // Create a file from the data URL for future saves
        const resp = await fetch(imgData.dataUrl);
        const blob = await resp.blob();
        const imgFile = new File([blob], imgData.name, { type: blob.type });
        newImages.push({
          id: imgData.id,
          file: imgFile,
          url, width, height,
          name: imgData.name,
          x: 0, y: 0,
          selected: imgData.selected || false,
        });
      }

      // Update nextId and nextPlacementId
      const maxImgId = project.images.reduce((max: number, img: { id: string }) => {
        const n = parseInt(img.id.split('-')[1] || '0');
        return Math.max(max, n);
      }, 0);
      nextId = maxImgId + 1;

      const maxPlaceId = (project.placedImages || []).reduce((max: number, p: { placementId: string }) => {
        const n = parseInt(p.placementId.split('-')[1] || '0');
        return Math.max(max, n);
      }, 0);
      nextPlacementId = maxPlaceId + 1;

      set({
        images: newImages,
        placedImages: project.placedImages || [],
        aspectRatio: project.aspectRatio || '4:3',
        columns: project.columns || 3,
        rows: project.rows || 3,
        gap: project.gap || 0,
        gapColor: project.gapColor || '#ffffff',
        undoStack: [],
        redoStack: [],
        modalOpen: false,
        autoCollageOpen: false,
      });
    } catch (e) {
      console.error('Failed to load project:', e);
      alert('Failed to load project file.');
    }
  },
}));
