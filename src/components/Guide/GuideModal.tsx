import { useState } from 'react';

const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    content: `Welcome to Chrono Collage — a reference sheet builder for creative professionals working with AI image and video generation.

The workflow is simple:

1. Upload your images using the "+ Upload" button or drag files directly into the workspace.
2. Select the images you want in your collage — click to select one, Shift+Click or Ctrl+Click for multiple, or drag a selection rectangle over them.
3. Choose your mode — "Automatic Collage" for a quick packed layout, or "Manual Collage" for full control over placement, cropping, and zoom.
4. Export your reference sheet as a high-quality PNG or copy it directly to your clipboard.

Tip: Select any image and press A to inspect it in fullscreen. Use arrow keys to browse through all your images.

Your images are never compressed or modified. Everything runs locally in your browser — no uploads to any server.`,
  },
  {
    id: 'manual-collage',
    title: 'Manual Collage',
    content: `The Manual Collage gives you full control over your reference sheet layout.

Grid Setup:
Use the right panel to set your aspect ratio, grid size (columns × rows), and gap between cells. The gap color can be customized using the color picker — choose from presets or pick any custom color.

Placing Images:
Drag images from the left sidebar onto any empty grid cell. The same image can be placed multiple times — each placement gets its own crop and zoom settings. A teal badge on the sidebar thumbnail shows how many times it's been placed.

Pan & Zoom:
Once an image is placed, use the mouse wheel to zoom in and out (0.3× to 5×). Click and drag the center area (the move icon) to pan the image within its cell. This lets you frame exactly the detail you need.

Resizing:
Click a placed image to see the corner handles. Drag any corner to span the image across multiple grid cells.

Removing:
Right-click any placed image to remove it from the grid. It stays in the sidebar for re-use.

Undo/Redo:
Ctrl+Z to undo, Ctrl+Shift+Z to redo. Works for placing, removing, resizing, and resetting.`,
  },
  {
    id: 'automatic-collage',
    title: 'Automatic Collage',
    content: `The Automatic Collage creates a packed layout instantly — no manual placement needed.

How it works:
All your selected images are arranged in rows that fill the chosen aspect ratio. Images are sized proportionally based on their original aspect ratios, creating visual variety. The algorithm distributes images evenly across rows so there's no wasted space.

Controls:
Use the right panel to pick an aspect ratio and adjust the gap. The preview updates in real time.

This mode is ideal when you need a quick reference sheet and don't need per-image crop control.`,
  },
  {
    id: 'export',
    title: 'Export Options',
    content: `Three export options are available in both collage modes:

Copy to Clipboard:
Copies the collage as a PNG image directly to your clipboard. You can paste it immediately into any application — Seedream, Kling, ComfyUI, Midjourney, Photoshop, Discord, etc. Uses the same quality as the 4K download.

Download 4K (3840px):
Downloads a PNG file with the longest edge at 3840 pixels. This is standard 4K resolution and works well for most AI workflows.

Download Original Quality:
Calculates the export resolution based on your source images so that no image gets upscaled. The result size depends on your lowest-resolution source image. This guarantees zero quality loss.

All exports use lossless PNG format. Gap color matches your selection in the color picker.

Every export automatically adds the resulting collage back to your workspace as a new image. This lets you combine multiple collages into larger reference sheets.`,
  },
  {
    id: 'preview',
    title: 'Fullscreen Preview',
    content: `Select any image in the workspace and press A to open a fullscreen preview at original resolution.

Navigation:
Use the left and right arrow keys to cycle through all images in the workspace without leaving fullscreen mode. The current position and filename are shown at the bottom of the screen.

Closing:
Press A again, press Escape, or click anywhere to close the preview.

This is useful for inspecting image details at full resolution before placing them in a collage — check faces, textures, fine details, and artifacts without any downscaling.`,
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    content: `Workspace:
A — Fullscreen preview of selected image
← → — Navigate images in fullscreen preview
Ctrl+A — Select all images
Delete / Backspace — Remove selected images
Click — Select single image
Shift+Click / Ctrl+Click — Add to selection
Drag on empty space — Selection rectangle

Manual Collage:
Ctrl+Z — Undo
Ctrl+Shift+Z — Redo
Mouse wheel on placed image — Zoom in/out
Right-click on placed image — Remove from grid
Click + drag center handle — Pan image within cell
Drag corner handles — Resize across cells`,
  },
  {
    id: 'projects',
    title: 'Projects',
    content: `Save Project:
Click "Save Project" in the header, enter a name, and a JSON file will be downloaded. This file contains all your images (embedded as data), grid settings, and placement data. Note: large projects with many high-res images will produce large files.

Load Project:
Click "Load Project" and select a previously saved JSON file. All images, settings, and placements will be restored exactly as they were.

Projects are fully self-contained — you can share them with others or move them between machines.`,
  },
];

export function GuideModal({ onClose }: { onClose: () => void }) {
  const [activeSection, setActiveSection] = useState('getting-started');
  const current = sections.find((s) => s.id === activeSection) || sections[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-[80vw] h-[80vh] rounded-xl flex flex-col overflow-hidden"
        style={{ background: '#242424', border: '1px solid #3a3a3a', maxWidth: 900 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: '1px solid #3a3a3a' }}
        >
          <span className="text-sm font-semibold tracking-wide" style={{ color: '#e0e0e0' }}>
            GUIDE
          </span>
          <button
            className="w-7 h-7 rounded-md flex items-center justify-center text-sm cursor-pointer transition-colors"
            style={{ color: '#888', background: 'transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#3a3a3a')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left nav */}
          <div
            className="w-[200px] shrink-0 overflow-y-auto p-3 flex flex-col gap-1"
            style={{ borderRight: '1px solid #3a3a3a', background: '#2a2a2a' }}
          >
            {sections.map((s) => (
              <button
                key={s.id}
                className="text-left px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
                style={{
                  background: activeSection === s.id ? 'rgba(77,184,164,0.15)' : 'transparent',
                  border: `1px solid ${activeSection === s.id ? 'rgba(77,184,164,0.3)' : 'transparent'}`,
                  color: activeSection === s.id ? '#4db8a4' : '#999',
                }}
                onClick={() => setActiveSection(s.id)}
                onMouseEnter={(e) => {
                  if (activeSection !== s.id) {
                    e.currentTarget.style.background = '#363940';
                    e.currentTarget.style.color = '#ccc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== s.id) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#999';
                  }
                }}
              >
                {s.title}
              </button>
            ))}
          </div>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-base font-semibold mb-4" style={{ color: '#e0e0e0' }}>
              {current.title}
            </h2>
            <div
              className="text-[13px] leading-relaxed whitespace-pre-line"
              style={{ color: '#aaa' }}
            >
              {current.content}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 shrink-0 flex items-center justify-center"
          style={{ borderTop: '1px solid #3a3a3a' }}
        >
          <span className="text-[10px] tracking-wide" style={{ color: '#777' }}>
            Chrono Collage — Made with Love by ChronoKnight
          </span>
        </div>
      </div>
    </div>
  );
}
