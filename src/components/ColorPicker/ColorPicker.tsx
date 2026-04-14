import { useState, useRef, useEffect } from 'react';

// Generate color grid similar to classic Windows color picker
const GRID_COLORS = [
  // Row 1 - light pastels
  '#ff8080','#ffb080','#ffff80','#80ff80','#80ffff','#8080ff','#ff80ff','#ff80b0',
  // Row 2 - medium bright
  '#ff4040','#ff8040','#ffff40','#40ff40','#40ffff','#4040ff','#ff40ff','#ff4080',
  // Row 3 - full saturated
  '#ff0000','#ff8000','#ffff00','#00ff00','#00ffff','#0000ff','#ff00ff','#ff0080',
  // Row 4 - darker
  '#c00000','#c06000','#c0c000','#00c000','#00c0c0','#0000c0','#c000c0','#c00060',
  // Row 5 - dark
  '#800000','#804000','#808000','#008000','#008080','#000080','#800080','#800040',
  // Row 6 - very dark
  '#400000','#402000','#404000','#004000','#004040','#000040','#400040','#400020',
  // Row 7 - neutrals light
  '#ffffff','#e0e0e0','#c0c0c0','#a0a0a0','#808080','#606060','#404040','#303030',
  // Row 8 - neutrals dark
  '#202020','#1a1a1a','#141414','#0a0a0a','#000000','#f5f5dc','#d2b48c','#8b7355',
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 255, g: 255, b: 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}

// Quick presets for the inline picker
const QUICK_COLORS = [
  '#ffffff', '#d4d4d4', '#888888', '#444444', '#1e1e1e', '#000000',
];

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-6 gap-1">
        {QUICK_COLORS.map((c) => (
          <button
            key={c}
            className="w-full aspect-square rounded-sm cursor-pointer transition-all"
            style={{
              background: c,
              border: value === c ? '2px solid rgba(77,184,164,0.9)' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: value === c ? '0 0 8px rgba(77,184,164,0.4)' : 'none',
              transform: value === c ? 'scale(1.1)' : 'scale(1)',
            }}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
      <button
        className="w-full py-1.5 rounded text-[10px] font-medium cursor-pointer transition-all flex items-center justify-center gap-1.5"
        style={{ background: '#2E3035', color: '#999', border: '1px solid transparent' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#363940'; e.currentTarget.style.color = '#ccc'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#2E3035'; e.currentTarget.style.color = '#999'; }}
        onClick={() => setShowModal(true)}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ background: `conic-gradient(#ef4444, #eab308, #22c55e, #3b82f6, #a855f7, #ef4444)` }}
        />
        Custom Color
      </button>

      {showModal && (
        <ColorPickerModal
          initialColor={value}
          onConfirm={(c) => { onChange(c); setShowModal(false); }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function ColorPickerModal({
  initialColor,
  onConfirm,
  onCancel,
}: {
  initialColor: string;
  onConfirm: (color: string) => void;
  onCancel: () => void;
}) {
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [hex, setHex] = useState(initialColor);
  const rgb = hexToRgb(selectedColor);
  const [r, setR] = useState(rgb.r);
  const [g, setG] = useState(rgb.g);
  const [b, setB] = useState(rgb.b);
  const gradientRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState(false);

  // Sync RGB → Hex → selectedColor
  const updateFromRgb = (nr: number, ng: number, nb: number) => {
    setR(nr); setG(ng); setB(nb);
    const h = rgbToHex(nr, ng, nb);
    setHex(h);
    setSelectedColor(h);
  };

  const updateFromHex = (h: string) => {
    setHex(h);
    if (/^#[0-9a-fA-F]{6}$/.test(h)) {
      setSelectedColor(h);
      const c = hexToRgb(h);
      setR(c.r); setG(c.g); setB(c.b);
    }
  };

  const selectFromGrid = (c: string) => {
    setSelectedColor(c);
    setHex(c);
    const rgb2 = hexToRgb(c);
    setR(rgb2.r); setG(rgb2.g); setB(rgb2.b);
  };

  // Draw gradient canvas
  useEffect(() => {
    const canvas = gradientRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;

    // Hue gradient horizontal
    const hueGrad = ctx.createLinearGradient(0, 0, w, 0);
    hueGrad.addColorStop(0, '#ff0000');
    hueGrad.addColorStop(0.17, '#ffff00');
    hueGrad.addColorStop(0.33, '#00ff00');
    hueGrad.addColorStop(0.5, '#00ffff');
    hueGrad.addColorStop(0.67, '#0000ff');
    hueGrad.addColorStop(0.83, '#ff00ff');
    hueGrad.addColorStop(1, '#ff0000');
    ctx.fillStyle = hueGrad;
    ctx.fillRect(0, 0, w, h);

    // White gradient from top
    const whiteGrad = ctx.createLinearGradient(0, 0, 0, h / 2);
    whiteGrad.addColorStop(0, 'rgba(255,255,255,1)');
    whiteGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = whiteGrad;
    ctx.fillRect(0, 0, w, h);

    // Black gradient from bottom
    const blackGrad = ctx.createLinearGradient(0, h / 2, 0, h);
    blackGrad.addColorStop(0, 'rgba(0,0,0,0)');
    blackGrad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = blackGrad;
    ctx.fillRect(0, 0, w, h);
  }, []);

  const pickFromCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = gradientRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));
    const ctx = canvas.getContext('2d')!;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    updateFromRgb(pixel[0], pixel[1], pixel[2]);
  };

  useEffect(() => {
    if (!dragging) return;
    const handleUp = () => setDragging(false);
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
  }, [dragging]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#242424', border: '1px solid #3a3a3a', width: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #3a3a3a' }}>
          <span className="text-xs font-semibold tracking-widest" style={{ color: '#e0e0e0' }}>
            CUSTOM COLOR
          </span>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Color grid */}
          <div className="grid grid-cols-8 gap-0.5">
            {GRID_COLORS.map((c, i) => (
              <button
                key={i}
                className="w-full aspect-square cursor-pointer transition-all"
                style={{
                  background: c,
                  border: selectedColor === c ? '2px solid rgba(77,184,164,0.9)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: selectedColor === c ? '0 0 6px rgba(77,184,164,0.4)' : 'none',
                }}
                onClick={() => selectFromGrid(c)}
              />
            ))}
          </div>

          {/* Gradient picker */}
          <canvas
            ref={gradientRef}
            width={384}
            height={80}
            className="w-full rounded cursor-crosshair"
            style={{ border: '1px solid #3a3a3a', height: 80 }}
            onMouseDown={(e) => { setDragging(true); pickFromCanvas(e); }}
            onMouseMove={(e) => { if (dragging) pickFromCanvas(e); }}
          />

          {/* Preview + inputs */}
          <div className="flex gap-4">
            {/* Preview */}
            <div
              className="w-16 h-16 rounded shrink-0"
              style={{ background: selectedColor, border: '1px solid #3a3a3a' }}
            />

            {/* Inputs */}
            <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5">
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-[10px] font-semibold w-8" style={{ color: '#888' }}>HEX</span>
                <input
                  type="text"
                  value={hex}
                  onChange={(e) => updateFromHex(e.target.value)}
                  className="flex-1 px-2 py-1 rounded text-[11px] outline-none"
                  style={{ background: '#1a1a1a', border: '1px solid #3a3a3a', color: '#e0e0e0' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(77,184,164,0.5)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#3a3a3a')}
                />
              </div>
              {[
                { label: 'R', val: r, set: (v: number) => updateFromRgb(v, g, b) },
                { label: 'G', val: g, set: (v: number) => updateFromRgb(r, v, b) },
                { label: 'B', val: b, set: (v: number) => updateFromRgb(r, g, v) },
              ].map(({ label, val, set }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold w-3" style={{ color: '#888' }}>{label}</span>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={val}
                    onChange={(e) => set(Number(e.target.value))}
                    className="flex-1 px-2 py-1 rounded text-[11px] outline-none"
                    style={{ background: '#1a1a1a', border: '1px solid #3a3a3a', color: '#e0e0e0', width: 50 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(77,184,164,0.5)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#3a3a3a')}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            <button
              className="px-5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              style={{ background: '#2E3035', color: '#999', border: '1px solid transparent' }}
              onClick={onCancel}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#363940'; e.currentTarget.style.color = '#ccc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#2E3035'; e.currentTarget.style.color = '#999'; }}
            >
              Cancel
            </button>
            <button
              className="px-5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              style={{ background: 'rgba(77,184,164,0.15)', color: '#4db8a4', border: '1px solid rgba(77,184,164,0.3)' }}
              onClick={() => onConfirm(selectedColor)}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(77,184,164,0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(77,184,164,0.15)')}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
