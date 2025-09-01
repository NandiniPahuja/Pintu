# Pintu Client

React + Vite + TypeScript frontend application with modern tooling and libraries.

## Tech Stack

- ⚡ **Vite** - Fast build tool and dev server
- ⚛️ **React 18** - UI framework with hooks
- 🔷 **TypeScript** - Type safety and better DX
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🌊 **Zustand** - Lightweight state management
- 🛣️ **React Router** - Client-side routing
- 📤 **React Dropzone** - File upload with drag & drop
- 🖼️ **Fabric.js** - Canvas manipulation library
- 🎨 **Color Thief** - Extract colors from images
- 💾 **idb-keyval** - Simple IndexedDB wrapper

## Features

- 🎨 **Canvas Editor** - Powerful drawing tools with Fabric.js
- 📁 **Project Management** - Create, save, and organize projects
- 📤 **File Upload** - Drag & drop file uploads with preview
- 🌈 **Color Extraction** - Extract color palettes from images
- 🔄 **State Management** - Global app state with Zustand
- 💾 **Local Storage** - Persist data with IndexedDB
- 📱 **Responsive Design** - Mobile-friendly UI
- 🎯 **Type Safety** - Full TypeScript coverage

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This will start the development server at `http://localhost:5173`.

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Project Structure

```
src/
├── lib/
│   ├── store.ts          # Zustand state management
│   ├── api.ts            # API helpers and endpoints
│   ├── canvas.ts         # Fabric.js canvas utilities
│   └── upload.tsx        # File upload components
├── App.tsx               # Main app component with routing
├── main.tsx              # App entry point
└── styles.css            # Tailwind CSS styles
```

## Environment Variables

Copy the root `.env.example` to `.env` and configure:

- `VITE_API_URL` - Backend API URL (default: http://localhost:8000)

## Available Routes

- `/` - Home page with feature overview
- `/canvas` - Canvas editor page
- `/projects` - Projects management page

## State Management

The app uses Zustand for state management with the following features:

- User authentication state
- Project management
- Canvas history (undo/redo)
- UI state (theme, sidebar, etc.)
- Error handling

## Canvas Features

- Add/edit text, shapes, and images
- Drag & drop functionality
- Undo/redo support
- Zoom in/out
- Export as PNG/SVG
- Save/load canvas state
- Color extraction from images

## File Upload

- Drag & drop interface
- Multiple file support
- File type validation
- Size limits
- Progress tracking
- Image previews

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Development Notes

### Styling

- Uses Tailwind CSS with custom design system
- Custom color palette (primary, secondary, accent)
- Component classes for buttons, cards, inputs
- Responsive utilities and animations

### State Persistence

- User preferences saved to localStorage
- Canvas data saved to IndexedDB
- Project data synchronized with backend

### Type Safety

- Full TypeScript coverage
- Strict mode enabled
- Custom types for all major features
- API response types defined
