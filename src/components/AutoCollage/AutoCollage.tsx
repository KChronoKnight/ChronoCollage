import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { AspectRatio } from '../../types';
import { ASPECT_RATIOS } from '../../types';
import { computeAutoLayout } from '../../utils/binPacker';
import { exportAutoCollage } from '../../utils/exportUtils';
import { ColorPicker } from '../ColorPicker/ColorPicker';

export function AutoCollage() {
  const setAutoCollageOpen = useAppStore((s) => s.setAutoCollageOpen);
  const images = useAppStore((s) => s.images);
  const selectedImages = images.filter((i) => i.selected);

  const [ar, setAr] = useState<AspectRatio>('4:3');
  const [exporting, setExporting] = useState(false);
  const [autoGap, setAutoGap] = useState(0);
  const [autoGapColor, setAutoGapColor] = useState('#ffffff');
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewSize, setPreviewSize] = useState<{ w: number; h: number }>({ w: 600, h: 450 });

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const calc = () => {
      const pad = 48;
      const maxW = el.clientWidth - pad;
      const maxH = el.clientHeight - pad;
      const arVal = ASPECT_RATIOS[ar];
      const ratio = arVal.w / arVal.h;
      let w = maxW;
      let h = w / ratio;
      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }
      setPreviewSize({ w: Math.round(w), h: Math.round(h) });
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ar]);

  const { layout, canvasW, canvasH } = useMemo(
    () => computeAutoLayout(selectedImages, ar, previewSize.w, autoGap),
    [selectedImages, ar, previewSize.w, autoGap]
  );

  const handleExport = async (mode: '4k' | 'original' | 'clipboard') => {
    setExporting(true);
    try {
      await exportAutoCollage(
        selectedImages.map((i) => ({ url: i.url, width: i.width, height: i.height })),
        layout,
        canvasW,
        canvasH,
        autoGap,
        mode,
        autoGapColor
      );
    } catch (err) {
      console.error('Export failed:', err);
    }
    setExporting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={() => setAutoCollageOpen(false)}
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
            AUTOMATIC COLLAGE
          </span>
          <button
            className="w-7 h-7 rounded-md flex items-center justify-center text-sm cursor-pointer transition-colors"
            style={{ color: '#888', background: 'transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#3a3a3a')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            onClick={() => setAutoCollageOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Body: preview + right panel */}
        <div className="flex flex-1 min-h-0">
          {/* Center — preview */}
          <div
            ref={previewRef}
            className="flex-1 flex items-center justify-center p-6 min-w-0"
          >
            <div
              className="relative overflow-hidden"
              style={{
                width: canvasW,
                height: canvasH,
                background: autoGapColor,
                flexShrink: 0,
              }}
            >
              {layout.map((rect, i) => {
                const img = selectedImages[rect.imageIndex];
                if (!img) return null;
                return (
                  <div
                    key={i}
                    className="absolute overflow-hidden"
                    style={{
                      left: rect.x,
                      top: rect.y,
                      width: rect.w,
                      height: rect.h,
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel — controls */}
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
                {(['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'] as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    className="px-2 py-1.5 rounded text-[11px] font-medium transition-all cursor-pointer"
                    style={{
                      background: ar === ratio ? 'rgba(77,184,164,0.15)' : '#2E3035',
                      border: `1px solid ${ar === ratio ? 'rgba(77,184,164,0.3)' : 'transparent'}`,
                      color: ar === ratio ? '#4db8a4' : '#999',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAr(ratio);
                    }}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Gap */}
            <div>
              <span className="text-[10px] font-semibold tracking-widest block mb-2" style={{ color: '#888' }}>
                GAP ({autoGap}PX)
              </span>
              <input
                type="range"
                min={0}
                max={20}
                value={autoGap}
                onChange={(e) => setAutoGap(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: '#4db8a4', height: 4 }}
              />
            </div>

            {/* Gap Color */}
            <div>
              <span className="text-[10px] font-semibold tracking-widest block mb-2" style={{ color: '#888' }}>
                GAP COLOR
              </span>
              <ColorPicker value={autoGapColor} onChange={setAutoGapColor} />
            </div>

            {/* Image count */}
            <div>
              <span className="text-[10px] font-semibold tracking-widest block mb-1" style={{ color: '#888' }}>
                IMAGES
              </span>
              <span className="text-xs" style={{ color: '#aaa' }}>
                {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex-1" />

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <ExportBtn label="Copy to Clipboard" onClick={() => handleExport('clipboard')} disabled={exporting} />
              <ExportBtn label="↓ Download 4K" sub="3840px" onClick={() => handleExport('4k')} disabled={exporting} />
              <ExportBtn label="↓ Download Original Quality" sub="based on lowest resolution image" onClick={() => handleExport('original')} disabled={exporting} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportBtn({ label, sub, onClick, disabled }: { label: string; sub?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      className="w-full py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left px-3"
      style={{ background: 'rgba(77,184,164,0.15)', color: '#4db8a4', border: '1px solid rgba(77,184,164,0.3)' }}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(77,184,164,0.25)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(77,184,164,0.15)')}
    >
      <div>{label}</div>
      {sub && <div className="text-[9px] font-normal mt-0.5" style={{ color: '#6dcdb8', opacity: 0.7 }}>{sub}</div>}
    </button>
  );
}