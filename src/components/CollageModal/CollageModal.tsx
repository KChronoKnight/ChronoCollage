import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { AspectRatio } from '../../types';
import { ASPECT_RATIOS } from '../../types';
import { exportCollage } from '../../utils/exportUtils';
import { ColorPicker } from '../ColorPicker/ColorPicker';

export function CollageModal() {
  const closeModal = useAppStore((s) => s.closeModal);
  const images = useAppStore((s) => s.images);
  const selectedImages = images.filter((i) => i.selected);
  const placedImages = useAppStore((s) => s.placedImages);
  const placeImage = useAppStore((s) => s.placeImage);
  const removeFromGrid = useAppStore((s) => s.removeFromGrid);
  const updatePlacedImage = useAppStore((s) => s.updatePlacedImage);
  const resetGrid = useAppStore((s) => s.resetGrid);
  const aspectRatio = useAppStore((s) => s.aspectRatio);
  const setAspectRatio = useAppStore((s) => s.setAspectRatio);
  const columns = useAppStore((s) => s.columns);
  const rows = useAppStore((s) => s.rows);
  const setColumns = useAppStore((s) => s.setColumns);
  const setRows = useAppStore((s) => s.setRows);
  const gap = useAppStore((s) => s.gap);
  const setGap = useAppStore((s) => s.setGap);
  const gapColor = useAppStore((s) => s.gapColor);
  const setGapColor = useAppStore((s) => s.setGapColor);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);

  const [activePlacement, setActivePlacement] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null);
  const [resizing, setResizing] = useState<{ placementId: string; corner: string } | null>(null);
  const [panning, setPanning] = useState<string | null>(null);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const gridRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const [gridSize, setGridSize] = useState<{ w: number; h: number }>({ w: 600, h: 450 });

  // Calculate grid pixel dimensions from container + aspect ratio
  useEffect(() => {
    const el = centerRef.current;
    if (!el) return;
    const calc = () => {
      const pad = 48; // p-6 = 24px each side
      const maxW = el.clientWidth - pad;
      const maxH = el.clientHeight - pad;
      const arVal = ASPECT_RATIOS[aspectRatio];
      const ratio = arVal.w / arVal.h;
      let w = maxW;
      let h = w / ratio;
      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }
      setGridSize({ w: Math.round(w), h: Math.round(h) });
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspectRatio]);

  // Undo/Redo keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // Count how many times each image is placed
  const placementCounts = new Map<string, number>();
  placedImages.forEach((p) => {
    placementCounts.set(p.imageId, (placementCounts.get(p.imageId) || 0) + 1);
  });

  // Sidebar images: all selected images
  const sidebarImages = selectedImages;

  // Get cell dimensions for resize calculations
  const getCellFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!gridRef.current) return null;
      const rect = gridRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const cellW = rect.width / columns;
      const cellH = rect.height / rows;
      const col = Math.max(1, Math.min(columns, Math.floor(x / cellW) + 1));
      const row = Math.max(1, Math.min(rows, Math.floor(y / cellH) + 1));
      return { col, row };
    },
    [columns, rows]
  );

  // Handle drop from sidebar
  const handleCellDrop = useCallback(
    (e: React.DragEvent, col: number, row: number) => {
      e.preventDefault();
      const imageId = e.dataTransfer.getData('imageId');
      if (imageId) {
        // Check if cell is already occupied by any placement
        const occupied = placedImages.find(
          (p) =>
            col >= p.gridCol &&
            col < p.gridCol + p.colSpan &&
            row >= p.gridRow &&
            row < p.gridRow + p.rowSpan
        );
        if (!occupied) {
          placeImage(imageId, col, row);
        }
      }
      setHoverCell(null);
    },
    [placeImage, placedImages]
  );

  // Resize handling
  useEffect(() => {
    if (!resizing) return;
    const handleMove = (e: MouseEvent) => {
      const cell = getCellFromPoint(e.clientX, e.clientY);
      if (!cell) return;
      const placed = placedImages.find((p) => p.placementId === resizing.placementId);
      if (!placed) return;

      let newCol = placed.gridCol;
      let newRow = placed.gridRow;
      let newColSpan = placed.colSpan;
      let newRowSpan = placed.rowSpan;

      const corner = resizing.corner;
      if (corner.includes('e')) {
        newColSpan = Math.max(1, cell.col - placed.gridCol + 1);
      }
      if (corner.includes('w')) {
        const rightEdge = placed.gridCol + placed.colSpan - 1;
        newCol = Math.min(cell.col, rightEdge);
        newColSpan = rightEdge - newCol + 1;
      }
      if (corner.includes('s')) {
        newRowSpan = Math.max(1, cell.row - placed.gridRow + 1);
      }
      if (corner.includes('n')) {
        const bottomEdge = placed.gridRow + placed.rowSpan - 1;
        newRow = Math.min(cell.row, bottomEdge);
        newRowSpan = bottomEdge - newRow + 1;
      }

      // Bounds check
      if (newCol + newColSpan - 1 > columns) newColSpan = columns - newCol + 1;
      if (newRow + newRowSpan - 1 > rows) newRowSpan = rows - newRow + 1;

      updatePlacedImage(resizing.placementId, {
        gridCol: newCol,
        gridRow: newRow,
        colSpan: Math.max(1, newColSpan),
        rowSpan: Math.max(1, newRowSpan),
      });
    };
    const handleUp = () => setResizing(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [resizing, placedImages, columns, rows, getCellFromPoint, updatePlacedImage]);

  // Pan handling
  useEffect(() => {
    if (!panning) return;
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      const sensitivity = 0.3;
      const newPanX = Math.max(0, Math.min(100, panStart.current.panX - dx * sensitivity));
      const newPanY = Math.max(0, Math.min(100, panStart.current.panY - dy * sensitivity));
      updatePlacedImage(panning, { panX: newPanX, panY: newPanY });
    };
    const handleUp = () => setPanning(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [panning, updatePlacedImage]);

  // Build grid cells
  const cells: React.ReactNode[] = [];
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= columns; c++) {
      const placed = placedImages.find(
        (p) => c >= p.gridCol && c < p.gridCol + p.colSpan && r >= p.gridRow && r < p.gridRow + p.rowSpan
      );
      // Only render the top-left cell of a placed image; skip others covered by it
      if (placed && (c !== placed.gridCol || r !== placed.gridRow)) continue;

      const isHover = hoverCell?.col === c && hoverCell?.row === r;

      if (placed) {
        const img = images.find((i) => i.id === placed.imageId);
        if (!img) continue;
        const isActive = activePlacement === placed.placementId;

        cells.push(
          <div
            key={`${c}-${r}`}
            className="relative overflow-hidden"
            style={{
              gridColumn: `${placed.gridCol} / span ${placed.colSpan}`,
              gridRow: `${placed.gridRow} / span ${placed.rowSpan}`,
              border: isActive ? '2px solid rgba(77,184,164,0.6)' : '1px solid #3a3a3a',
              cursor: panning === placed.placementId ? 'grabbing' : 'default',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setActivePlacement(placed.placementId);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              removeFromGrid(placed.placementId);
              setActivePlacement(null);
            }}
            onWheel={(e) => {
              e.stopPropagation();
              const delta = e.deltaY > 0 ? -0.08 : 0.08;
              const newZoom = Math.max(1, Math.min(5, placed.zoom + delta));
              updatePlacedImage(placed.placementId, { zoom: newZoom });
            }}
          >
            <img
              src={img.url}
              alt={img.name}
              className="w-full h-full pointer-events-none select-none"
              style={{
                objectFit: 'cover',
                objectPosition: `${placed.panX}% ${placed.panY}%`,
                transform: `scale(${placed.zoom})`,
                transformOrigin: `${placed.panX}% ${placed.panY}%`,
              }}
              draggable={false}
            />
            {/* Handles visible on active */}
            {isActive && (
              <>
                {/* Corner handles — frosted glass with rounded inner corner */}
                {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => {
                  const radius =
                    corner === 'nw' ? '0 0 12px 0' :
                    corner === 'ne' ? '0 0 0 12px' :
                    corner === 'sw' ? '0 12px 0 0' :
                    '12px 0 0 0';
                  return (
                    <div
                      key={corner}
                      className="absolute z-30"
                      style={{
                        width: 50,
                        height: 50,
                        top: corner.includes('n') ? 0 : undefined,
                        bottom: corner.includes('s') ? 0 : undefined,
                        left: corner.includes('w') ? 0 : undefined,
                        right: corner.includes('e') ? 0 : undefined,
                        background: 'rgba(20,20,20,0.6)',
                        backdropFilter: 'blur(8px)',
                        border: '1.5px solid rgba(77,184,164,0.5)',
                        borderRadius: radius,
                        boxShadow: '0 0 10px rgba(77,184,164,0.2), 0 2px 8px rgba(0,0,0,0.3)',
                        cursor:
                          corner === 'nw' || corner === 'se'
                            ? 'nwse-resize'
                            : 'nesw-resize',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizing({ placementId: placed.placementId, corner });
                      }}
                    />
                  );
                })}
                {/* Pan handle — 75% area centered, with small visual icon */}
                <div
                  className="absolute z-20 flex items-center justify-center"
                  style={{
                    top: '12.5%',
                    left: '12.5%',
                    width: '75%',
                    height: '75%',
                    cursor: panning === placed.placementId ? 'grabbing' : 'move',
                  }}
                  title="PAN CROP"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setPanning(placed.placementId);
                    panStart.current = {
                      x: e.clientX,
                      y: e.clientY,
                      panX: placed.panX,
                      panY: placed.panY,
                    };
                  }}
                >
                  {/* Visual icon in center */}
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'rgba(20,20,20,0.6)',
                      backdropFilter: 'blur(8px)',
                      border: '1.5px solid rgba(77,184,164,0.5)',
                      boxShadow: '0 0 10px rgba(77,184,164,0.2), 0 2px 8px rgba(0,0,0,0.3)',
                      pointerEvents: 'none',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(77,184,164,0.9)" strokeWidth="2.5">
                      <path d="M5 9l-3 3 3 3" />
                      <path d="M9 5l3-3 3 3" />
                      <path d="M15 19l-3 3-3-3" />
                      <path d="M19 9l3 3-3 3" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <line x1="12" y1="2" x2="12" y2="22" />
                    </svg>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      } else {
        cells.push(
          <div
            key={`${c}-${r}`}
            className="flex items-center justify-center"
            style={{
              gridColumn: `${c} / span 1`,
              gridRow: `${r} / span 1`,
              border: isHover ? '2px solid rgba(77,184,164,0.5)' : '2px dashed #444',
              
              background: isHover ? 'rgba(90,98,112,0.15)' : '#2a2a2a',
              transition: 'all 0.15s',
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setHoverCell({ col: c, row: r });
            }}
            onDragLeave={() => setHoverCell(null)}
            onDrop={(e) => handleCellDrop(e, c, r)}
          />
        );
      }
    }
  }


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={() => setActivePlacement(null)}
    >
      <div
        className="w-[95vw] h-[92vh] rounded-xl flex flex-col overflow-hidden"
        style={{ background: '#242424', border: '1px solid #3a3a3a' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: '1px solid #3a3a3a' }}
        >
          <span className="text-sm font-semibold tracking-wide" style={{ color: '#e0e0e0' }}>
            MANUAL COLLAGE
          </span>
          <button
            className="w-7 h-7 rounded-md flex items-center justify-center text-sm cursor-pointer transition-colors"
            style={{ color: '#888', background: 'transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#3a3a3a')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            onClick={closeModal}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left sidebar - image source list */}
          <div
            className="w-[120px] shrink-0 overflow-y-auto p-3 flex flex-col gap-2"
            style={{ borderRight: '1px solid #3a3a3a', background: '#2a2a2a' }}
          >
            <span className="text-[10px] font-semibold tracking-widest mb-1" style={{ color: '#888' }}>
              SOURCES
            </span>
            {sidebarImages.map((img) => {
              const count = placementCounts.get(img.id) || 0;
              return (
                <div
                  key={img.id}
                  className="relative rounded-md overflow-hidden shrink-0"
                  style={{
                    height: 80 / (img.width / img.height),
                    minHeight: 50,
                    maxHeight: 90,
                    cursor: 'grab',
                  }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('imageId', img.id);
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {count > 0 && (
                    <div
                      className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center"
                      style={{
                        background: 'rgba(77,184,164,0.85)',
                        border: '1.5px solid rgba(255,255,255,0.4)',
                        fontSize: 9,
                        fontWeight: 700,
                        color: '#fff',
                        padding: '0 4px',
                      }}
                    >
                      {count}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Center - grid canvas */}
          <div
            ref={centerRef}
            className="flex-1 flex items-center justify-center p-6 min-w-0"
            onClick={() => setActivePlacement(null)}
          >
            <div
              ref={gridRef}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                gap: `${gap}px`,
                width: gridSize.w,
                height: gridSize.h,
                background: gapColor,
                padding: `${gap}px`,
                
                flexShrink: 0,
              }}
            >
              {cells}
            </div>
          </div>

          {/* Right panel - controls */}
          <div
            className="w-[200px] shrink-0 overflow-y-auto p-4 flex flex-col gap-5"
            style={{ borderLeft: '1px solid #3a3a3a', background: '#2a2a2a' }}
          >
            {/* Aspect Ratio */}
            <div>
              <span className="text-[10px] font-semibold tracking-widest block mb-2" style={{ color: '#888' }}>
                ASPECT RATIO
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'] as AspectRatio[]).map((arOption) => (
                  <button
                    key={arOption}
                    className="px-2 py-1.5 rounded text-[11px] font-medium transition-all cursor-pointer"
                    style={{
                      background: aspectRatio === arOption ? 'rgba(77,184,164,0.15)' : '#2E3035',
                      border: `1px solid ${aspectRatio === arOption ? 'rgba(77,184,164,0.3)' : 'transparent'}`,
                      color: aspectRatio === arOption ? '#4db8a4' : '#999',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAspectRatio(arOption);
                    }}
                  >
                    {arOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Size */}
            <div>
              <span className="text-[10px] font-semibold tracking-widest block mb-2" style={{ color: '#888' }}>
                GRID SIZE
              </span>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: '#aaa' }}>Columns</span>
                  <div className="flex items-center gap-2">
                    <StepButton onClick={() => setColumns(columns - 1)}>−</StepButton>
                    <span className="text-xs font-mono w-4 text-center" style={{ color: '#e0e0e0' }}>
                      {columns}
                    </span>
                    <StepButton onClick={() => setColumns(columns + 1)}>+</StepButton>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: '#aaa' }}>Rows</span>
                  <div className="flex items-center gap-2">
                    <StepButton onClick={() => setRows(rows - 1)}>−</StepButton>
                    <span className="text-xs font-mono w-4 text-center" style={{ color: '#e0e0e0' }}>
                      {rows}
                    </span>
                    <StepButton onClick={() => setRows(rows + 1)}>+</StepButton>
                  </div>
                </div>
              </div>
            </div>

            {/* Gap */}
            <div>
              <span className="text-[10px] font-semibold tracking-widest block mb-2" style={{ color: '#888' }}>
                GAP ({gap}PX)
              </span>
              <input
                type="range"
                min={0}
                max={20}
                value={gap}
                onChange={(e) => setGap(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: '#4db8a4', height: 4 }}
              />
            </div>

            {/* Gap Color */}
            <div>
              <span className="text-[10px] font-semibold tracking-widest block mb-2" style={{ color: '#888' }}>
                GAP COLOR
              </span>
              <ColorPicker value={gapColor} onChange={setGapColor} />
            </div>

            <div className="flex-1" />

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                className="w-full py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                style={{ border: '1px solid transparent', color: '#999', background: '#2E3035' }}
                onClick={resetGrid}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#363940'; e.currentTarget.style.color = '#ccc'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#2E3035'; e.currentTarget.style.color = '#999'; }}
              >
                ↻ Reset
              </button>
              <ExportButton label="Copy to Clipboard" onClick={() => exportCollage('clipboard')} />
              <ExportButton label="↓ Download 4K" sub="3840px" onClick={() => exportCollage('4k')} />
              <ExportButton label="↓ Download Original Quality" sub="based on lowest resolution image" onClick={() => exportCollage('original')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
      style={{ background: '#2E3035', color: '#999', border: '1px solid transparent' }}
      onClick={onClick}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#363940'; e.currentTarget.style.color = '#ccc'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '#2E3035'; e.currentTarget.style.color = '#999'; }}
    >
      {children}
    </button>
  );
}

function ExportButton({ label, sub, onClick }: { label: string; sub?: string; onClick: () => void }) {
  return (
    <button
      className="w-full py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left px-3"
      style={{ background: 'rgba(77,184,164,0.15)', color: '#4db8a4', border: '1px solid rgba(77,184,164,0.3)' }}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(77,184,164,0.25)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(77,184,164,0.15)')}
    >
      <div>{label}</div>
      {sub && <div className="text-[9px] font-normal mt-0.5" style={{ color: '#6dcdb8', opacity: 0.7 }}>{sub}</div>}
    </button>
  );
}
