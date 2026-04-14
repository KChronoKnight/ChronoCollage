import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ActionBar } from './ActionBar';
import { GuideModal } from '../Guide/GuideModal';

export function Workspace() {
  const images = useAppStore((s) => s.images);
  const addImages = useAppStore((s) => s.addImages);
  const selectImage = useAppStore((s) => s.selectImage);
  const deselectAll = useAppStore((s) => s.deselectAll);
  const removeImage = useAppStore((s) => s.removeImage);
  const saveProject = useAppStore((s) => s.saveProject);
  const loadProject = useAppStore((s) => s.loadProject);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [dropHighlight, setDropHighlight] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [projectName, setProjectName] = useState('my-project');
  const [showGuide, setShowGuide] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const selectedImages = images.filter((i) => i.selected);

  // File drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDropHighlight(false);
      if (e.dataTransfer.files.length > 0) {
        addImages(Array.from(e.dataTransfer.files));
      }
    },
    [addImages]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setDropHighlight(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropHighlight(false);
    }
  }, []);

  // Marquee selection (viewport coordinates)
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only start marquee on background clicks (grid container or scroll area)
      if (!target.closest('[data-thumb]')) {
        deselectAll();
        setMarquee({ x1: e.clientX, y1: e.clientY, x2: e.clientX, y2: e.clientY });
      }
    },
    [deselectAll]
  );

  useEffect(() => {
    if (!marquee) return;
    const handleMove = (e: MouseEvent) => {
      setMarquee((m) => m ? { ...m, x2: e.clientX, y2: e.clientY } : null);
    };
    const handleUp = (e: MouseEvent) => {
      if (marquee && scrollRef.current) {
        const selRect = {
          left: Math.min(marquee.x1, e.clientX),
          right: Math.max(marquee.x1, e.clientX),
          top: Math.min(marquee.y1, e.clientY),
          bottom: Math.max(marquee.y1, e.clientY),
        };
        // Check intersection with each thumbnail element
        const thumbs = scrollRef.current.querySelectorAll('[data-thumb]');
        const selectedIds = new Set<string>();
        thumbs.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.left < selRect.right && r.right > selRect.left &&
              r.top < selRect.bottom && r.bottom > selRect.top) {
            const id = (el as HTMLElement).dataset.thumb;
            if (id) selectedIds.add(id);
          }
        });
        // Apply selection
        const store = useAppStore.getState();
        useAppStore.setState({
          images: store.images.map((i) => ({ ...i, selected: selectedIds.has(i.id) })),
        });
      }
      setMarquee(null);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [marquee]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const state = useAppStore.getState();

      // Preview navigation
      if (previewIndex !== null) {
        if (e.key === 'Escape' || (e.key === 'a' && !e.ctrlKey && !e.metaKey)) {
          setPreviewIndex(null);
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setPreviewIndex((prev) => prev !== null ? (prev + 1) % state.images.length : 0);
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setPreviewIndex((prev) => prev !== null ? (prev - 1 + state.images.length) % state.images.length : 0);
          return;
        }
        return;
      }

      // Don't process workspace shortcuts when a modal is open
      if (state.modalOpen || state.autoCollageOpen) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const sel = state.images.filter((i) => i.selected);
        sel.forEach((i) => removeImage(i.id));
      }
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        state.selectAll();
      }
      // A without modifier — fullscreen preview of selected image
      if (e.key === 'a' && !e.ctrlKey && !e.metaKey) {
        const sel = state.images.filter((i) => i.selected);
        if (sel.length === 1) {
          const idx = state.images.findIndex((i) => i.id === sel[0].id);
          setPreviewIndex(idx);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [removeImage, previewIndex]);

  // Marquee overlay position (viewport-relative, rendered in fixed overlay)
  const marqueeStyle = marquee ? {
    left: Math.min(marquee.x1, marquee.x2),
    top: Math.min(marquee.y1, marquee.y2),
    width: Math.abs(marquee.x2 - marquee.x1),
    height: Math.abs(marquee.y2 - marquee.y1),
  } : null;

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ background: '#242424', borderBottom: '1px solid #3a3a3a' }}
      >
        <div className="flex items-center gap-3">
          <img
            src="./logo.png"
            alt="Chrono Collage"
            className="h-7 w-7 object-contain"
            draggable={false}
          />
          <span className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-wide" style={{ color: '#e0e0e0' }}>
              CHRONO COLLAGE
            </span>
            <span className="text-[11px] tracking-wide font-light" style={{ color: '#888' }}>
              by ChronoKnight
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#888' }}>
            {images.length} image{images.length !== 1 ? 's' : ''}
            {selectedImages.length > 0 && ` · ${selectedImages.length} selected`}
          </span>
          <HeaderBtn label="+ Upload" onClick={() => fileInputRef.current?.click()} />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addImages(Array.from(e.target.files));
              e.target.value = '';
            }}
          />
          <HeaderBtn label="Load Project" onClick={() => projectInputRef.current?.click()} />
          <input
            ref={projectInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) loadProject(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <HeaderBtn label="Save Project" onClick={() => setShowSaveDialog(true)} />
          <HeaderBtn label="Guide" onClick={() => setShowGuide(true)} />
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 relative overflow-hidden">
        {/* Scrollable grid area */}
        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto"
          style={{
            background: dropHighlight ? '#252530' : '#1a1a1a',
            transition: 'background 0.2s',
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onMouseDown={handleCanvasMouseDown}
        >
          {/* Empty state */}
          {images.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full pointer-events-none">
              <div
                className="w-64 h-44 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 mb-4"
                style={{ borderColor: '#3a3a3a' }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-xs" style={{ color: '#666' }}>
                  Drop images here or click Upload
                </span>
              </div>
              <span className="text-[10px]" style={{ color: '#444' }}>
                JPG · PNG · WebP
              </span>
            </div>
          )}

          {/* Responsive grid of thumbnails */}
          {images.length > 0 && (
            <div
              className="grid gap-4 p-6"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                paddingBottom: 80,
              }}
            >
              {images.map((img) => (
                <div
                  key={img.id}
                  data-thumb={img.id}
                  className="relative select-none group cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectImage(img.id, e.shiftKey || e.ctrlKey || e.metaKey);
                  }}
                >
                  <div
                    className="rounded-lg overflow-hidden shadow-lg transition-all aspect-square"
                    style={{
                      border: img.selected ? '2px solid rgba(77,184,164,0.7)' : '2px solid transparent',
                      boxShadow: img.selected ? '0 0 12px rgba(77,184,164,0.25)' : '0 4px 12px rgba(0,0,0,0.4)',
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />
                  </div>
                  <div
                    className="mt-1 text-center truncate"
                    style={{ fontSize: 10, color: '#888' }}
                  >
                    {img.name}
                  </div>
                  {/* Delete button */}
                  <button
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    style={{
                      background: 'rgba(20,20,20,0.7)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#999',
                      fontSize: 9,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(220,60,60,0.8)';
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.borderColor = 'rgba(220,60,60,0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(20,20,20,0.7)';
                      e.currentTarget.style.color = '#999';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Marquee overlay (fixed to viewport) */}
        {marqueeStyle && (
          <div
            className="marquee fixed pointer-events-none"
            style={marqueeStyle}
          />
        )}

        {/* Action Bar — always visible */}
        <ActionBar />

        {/* Ko-fi link — bottom right */}
        <div
          className="absolute bottom-6 right-6 z-50 flex items-center px-1.5 py-1.5 rounded-lg shadow-2xl"
          style={{ background: 'rgba(30,30,30,0.85)', border: '1px solid #3a3a3a', backdropFilter: 'blur(12px)' }}
        >
          <a
            href="https://ko-fi.com/chronoknight"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[10px] font-medium transition-all"
            style={{ background: '#2E3035', color: '#999', border: '1px solid transparent', textDecoration: 'none' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(77,184,164,0.15)';
              e.currentTarget.style.color = '#4db8a4';
              e.currentTarget.style.borderColor = 'rgba(77,184,164,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2E3035';
              e.currentTarget.style.color = '#999';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <img src="./coffee.png" alt="" className="w-3 h-3 object-contain" draggable={false} />
            Gift me a coffee
          </a>
        </div>
      </div>

      {/* Fullscreen Image Preview */}
      {previewIndex !== null && images[previewIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={() => setPreviewIndex(null)}
        >
          <img
            src={images[previewIndex].url}
            alt="Preview"
            className="max-w-[95vw] max-h-[95vh] object-contain select-none"
            draggable={false}
          />
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
          >
            <span className="text-[11px]" style={{ color: '#888' }}>
              {images[previewIndex].name}
            </span>
            <span className="text-[10px]" style={{ color: '#555' }}>
              {previewIndex + 1} / {images.length} — Arrow keys to navigate, A to close
            </span>
          </div>
        </div>
      )}

      {/* Save Project Dialog */}
      {showSaveDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowSaveDialog(false)}
        >
          <div
            className="rounded-xl p-6 flex flex-col gap-4"
            style={{ background: '#242424', border: '1px solid #3a3a3a', width: 380 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-sm font-semibold tracking-wide" style={{ color: '#e0e0e0' }}>
              SAVE PROJECT
            </span>
            <div>
              <label className="text-[10px] font-semibold tracking-widest block mb-2" style={{ color: '#888' }}>
                PROJECT NAME
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && projectName.trim()) {
                    saveProject(projectName.trim());
                    setShowSaveDialog(false);
                  }
                }}
                autoFocus
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  color: '#e0e0e0',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(77,184,164,0.5)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#3a3a3a')}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                style={{ background: '#2E3035', color: '#999', border: '1px solid transparent' }}
                onClick={() => setShowSaveDialog(false)}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#363940'; e.currentTarget.style.color = '#ccc'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#2E3035'; e.currentTarget.style.color = '#999'; }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                style={{ background: 'rgba(77,184,164,0.15)', color: '#4db8a4', border: '1px solid rgba(77,184,164,0.3)' }}
                onClick={() => {
                  if (projectName.trim()) {
                    saveProject(projectName.trim());
                    setShowSaveDialog(false);
                  }
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(77,184,164,0.25)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(77,184,164,0.15)')}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}

function HeaderBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer"
      style={{ background: '#2E3035', color: '#999', border: '1px solid transparent' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(77,184,164,0.15)';
        e.currentTarget.style.color = '#4db8a4';
        e.currentTarget.style.borderColor = 'rgba(77,184,164,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#2E3035';
        e.currentTarget.style.color = '#999';
        e.currentTarget.style.borderColor = 'transparent';
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
