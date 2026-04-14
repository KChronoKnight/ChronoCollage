# Chrono Collage

**Reference Sheet Builder for AI Creative Workflows**

Built with love by [ChronoKnight](https://ko-fi.com/chronoknight)

---

Chrono Collage is a free, open-source tool for building visual reference sheets. It's designed for concept artists and creative professionals who work with AI image and video generation tools like Seedream, Kling, Midjourney, ComfyUI, and others.

A reference sheet combines multiple views of the same character or scene — wide shots, close-ups of faces, hands, armor details — into a single image that AI models can use as visual context to maintain consistency across generations.

## Features

**Workspace**
- Drag & drop image upload (JPG, PNG, WebP)
- Responsive grid layout that adapts to browser size
- Click, Shift+Click, Ctrl+Click, or marquee drag to select images
- Delete selected images with the Delete key
- Fullscreen image preview with arrow key navigation

**Manual Collage**
- Configurable grid (1–10 columns/rows) with 6 aspect ratio presets (1:1, 4:3, 3:4, 16:9, 9:16, 21:9)
- Drag images from the sidebar onto grid cells
- Place the same image multiple times with independent crop/zoom settings
- Mouse wheel zoom (1×–5×) per image
- Pan to frame the exact detail you need
- Resize images across multiple cells with corner handles
- Right-click to remove images from the grid
- Undo/Redo (Ctrl+Z / Ctrl+Shift+Z)
- Customizable gap size and gap color

**Automatic Collage**
- Instant row-packed layout from selected images
- Same aspect ratio, gap, and color controls
- No manual placement needed — great for quick reference sheets

**Export**
- Copy to Clipboard — paste directly into any application
- Download 4K (3840px longest edge)
- Download Original Quality — based on lowest resolution source image, zero upscaling
- All exports are lossless PNG
- Every export automatically adds the collage back to the workspace for further use

**Project Management**
- Save projects as self-contained JSON files (images embedded)
- Load projects to restore everything exactly as it was

**In-App Guide**
- Built-in documentation covering all features and keyboard shortcuts

## Screenshots

*Coming soon*

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)

### Installation

```bash
git clone https://github.com/KChronoKnight/ChronoCollage.git
cd ChronoCollage
npm install
```

### Run

```bash
npx vite --open
```

Or on Windows, double-click `START_CHRONO_COLLAGE.bat`.

### Build for Production

```bash
npm run build
```

The output will be in the `dist/` folder. Serve it with any static file server.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| A | Fullscreen preview of selected image |
| ← → | Navigate images in fullscreen preview |
| Ctrl+A | Select all images |
| Delete / Backspace | Remove selected images |
| Ctrl+Z | Undo (in Manual Collage) |
| Ctrl+Shift+Z | Redo (in Manual Collage) |
| Mouse wheel | Zoom in/out on placed image |
| Right-click | Remove image from grid |

## Tech Stack

- React 18+ with TypeScript
- Vite
- Tailwind CSS v4
- Zustand (state management)
- No backend — everything runs client-side in the browser

## Image Quality

Your images are never compressed or modified. They are stored as original blobs in memory using `URL.createObjectURL()`. The grid cells are viewports into the full-resolution images. Export renders at full resolution to an offscreen canvas and saves as lossless PNG.

## Changelog

### v1.1
- Added fullscreen image preview — select an image and press A to view at full resolution, arrow keys to navigate through all images
- Every export now automatically adds the collage back to the workspace for reuse in further collages
- Customizable gap color with built-in color picker and custom color modal (RGB, HEX input, gradient picker)
- Keyboard shortcuts are now disabled when a collage modal is open to prevent accidental deletions

### v1.0
- Initial release
- Workspace with drag & drop upload, responsive grid layout, marquee selection
- Manual Collage with grid editor, drag & drop placement, pan, zoom, multi-cell spanning, corner handles
- Automatic Collage with row-packed layout algorithm
- Multi-placement — same image can be placed multiple times with independent crop/zoom
- Three export modes: Copy to Clipboard, Download 4K, Download Original Quality
- Undo/Redo in Manual Collage (Ctrl+Z / Ctrl+Shift+Z)
- Project save/load as self-contained JSON files
- Customizable aspect ratios (1:1, 4:3, 3:4, 16:9, 9:16, 21:9)
- Adjustable gap size
- Built-in Guide with full documentation
- Dark cinematic UI with teal accent color

## License

GNU General Public License v3.0 — see [LICENSE](LICENSE) for details.

## Support

If you find this tool useful, consider supporting the project:

☕ [Gift me a coffee on Ko-fi](https://ko-fi.com/chronoknight)

---

*Chrono Collage — Made with Love by ChronoKnight*
