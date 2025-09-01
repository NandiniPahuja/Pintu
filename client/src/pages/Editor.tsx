import React from 'react'
import { fabric } from 'fabric'
import { DesignCanvasProvider, DesignCanvas, CanvasToolbar, useDesignCanvas } from '../components/DesignCanvas'

// Sample content component to demonstrate canvas functionality
const SampleContent: React.FC = () => {
  const { addText, addImageFromURL, canvas } = useDesignCanvas()

  const handleAddSampleText = () => {
    addText('Welcome to Pintu!', {
      fontSize: 32,
      fontWeight: 'bold',
      fill: '#4F46E5'
    })
  }

  const handleAddSampleShape = () => {
    if (!canvas) return
    
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 60,
      fill: '#EF4444',
      rx: 10,
      ry: 10
    })
    
    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.requestRenderAll()
  }

  const handleAddSampleImage = async () => {
    try {
      // Using a placeholder image service
      await addImageFromURL('https://picsum.photos/200/150', {
        scaleX: 0.5,
        scaleY: 0.5
      })
    } catch (error) {
      console.error('Failed to add sample image:', error)
    }
  }

  return (
    <div className="flex items-center space-x-2 p-2 bg-gray-50 border-b border-gray-200">
      <span className="text-sm text-gray-600">Quick Start:</span>
      <button
        onClick={handleAddSampleText}
        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
      >
        Add Text
      </button>
      <button
        onClick={handleAddSampleShape}
        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
      >
        Add Shape
      </button>
      <button
        onClick={handleAddSampleImage}
        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
      >
        Add Image
      </button>
    </div>
  )
}

const Editor: React.FC = () => {
  return (
    <DesignCanvasProvider
      width={800}
      height={600}
      backgroundColor="#ffffff"
    >
      <div className="h-full flex flex-col bg-gray-100">
        {/* Canvas Toolbar */}
        <CanvasToolbar />
        
        {/* Sample Content Actions */}
        <SampleContent />
        
        {/* Canvas Container */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="h-full flex items-center justify-center">
            <div className="w-full h-full max-w-6xl">
              <DesignCanvas className="w-full h-full" />
            </div>
          </div>
        </div>
        
        {/* Status Bar */}
        <StatusBar />
      </div>
    </DesignCanvasProvider>
  )
}

// Status bar component
const StatusBar: React.FC = () => {
  const { canvas, zoom, canUndo, canRedo } = useDesignCanvas()
  const [objectCount, setObjectCount] = React.useState(0)
  const [selectedCount, setSelectedCount] = React.useState(0)

  React.useEffect(() => {
    if (!canvas) return

    const updateCounts = () => {
      const objects = canvas.getObjects()
      const selected = canvas.getActiveObjects()
      
      setObjectCount(objects.length)
      setSelectedCount(selected.length)
    }

    // Initial count
    updateCounts()

    // Listen for canvas changes
    canvas.on('object:added', updateCounts)
    canvas.on('object:removed', updateCounts)
    canvas.on('selection:created', updateCounts)
    canvas.on('selection:updated', updateCounts)
    canvas.on('selection:cleared', updateCounts)

    return () => {
      canvas.off('object:added', updateCounts)
      canvas.off('object:removed', updateCounts)
      canvas.off('selection:created', updateCounts)
      canvas.off('selection:updated', updateCounts)
      canvas.off('selection:cleared', updateCounts)
    }
  }, [canvas])

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>Objects: {objectCount}</span>
          <span>Selected: {selectedCount}</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${canUndo ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
            <span>Undo: {canUndo ? 'Available' : 'None'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${canRedo ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
            <span>Redo: {canRedo ? 'Available' : 'None'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Canvas Ready</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Editor
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = canvasUtils.initCanvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff'
      })
      
      setCanvas(fabricCanvas)
      
      // Add some sample content
      setTimeout(() => {
        canvasUtils.addText('Welcome to Pintu Editor', {
          left: 100,
          top: 100,
          fontSize: 32,
          fill: '#1f2937',
          fontFamily: 'Arial'
        })
        
        canvasUtils.addRectangle({
          left: 100,
          top: 200,
          width: 200,
          height: 100,
          fill: '#3b82f6',
          rx: 10,
          ry: 10
        })
        
        canvasUtils.addCircle({
          left: 400,
          top: 200,
          radius: 50,
          fill: '#ef4444'
        })
      }, 100)
    }

    return () => {
      canvasUtils.dispose()
    }
  }, [canvas])

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 10, 200)
    setZoom(newZoom)
    if (canvas) {
      canvas.setZoom(newZoom / 100)
      canvas.renderAll()
    }
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 10, 25)
    setZoom(newZoom)
    if (canvas) {
      canvas.setZoom(newZoom / 100)
      canvas.renderAll()
    }
  }

  const handleResetZoom = () => {
    setZoom(100)
    if (canvas) {
      canvas.setZoom(1)
      canvas.viewportTransform = [1, 0, 0, 1, 0, 0]
      canvas.renderAll()
    }
  }

  const handleClear = () => {
    canvasUtils.clearCanvas()
  }

  return (
    <div className="h-full flex flex-col bg-secondary-100">
      {/* Canvas Toolbar */}
      <div className="bg-white border-b border-secondary-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Undo/Redo */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => canvasUtils.undo()}
                className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={() => canvasUtils.redo()}
                className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
                </svg>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleClear}
                className="px-3 py-2 text-sm rounded-lg text-secondary-600 hover:bg-secondary-100 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => canvasUtils.deleteSelected()}
                className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 transition-colors"
                title="Delete Selected (Del)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => canvasUtils.cloneSelected()}
                className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 transition-colors"
                title="Duplicate Selected (Ctrl+D)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 transition-colors"
              disabled={zoom <= 25}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            
            <button
              onClick={handleResetZoom}
              className="px-3 py-1 text-sm font-medium text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors min-w-[60px]"
            >
              {zoom}%
            </button>
            
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 transition-colors"
              disabled={zoom >= 200}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 overflow-auto p-8">
        <div className="flex items-center justify-center min-h-full">
          <div className="relative">
            {/* Canvas */}
            <div className="bg-white rounded-lg shadow-lg border border-secondary-200 overflow-hidden">
              <canvas
                ref={canvasRef}
                className="block"
              />
            </div>
            
            {/* Canvas Info */}
            <div className="absolute -bottom-8 left-0 right-0 flex justify-between text-xs text-secondary-500">
              <span>Canvas: 800 × 600px</span>
              <span>Zoom: {zoom}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-white border-t border-secondary-200 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-secondary-600">
          <div className="flex items-center space-x-4">
            <span>Objects: 3</span>
            <span>Selected: 0</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Auto-save enabled</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Saved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="hidden">
        {/* TODO: Add keyboard shortcuts modal/overlay */}
        <div className="text-xs text-secondary-500 space-y-1">
          <div>Ctrl+Z: Undo</div>
          <div>Ctrl+Y: Redo</div>
          <div>Ctrl+D: Duplicate</div>
          <div>Del: Delete Selected</div>
          <div>Ctrl++: Zoom In</div>
          <div>Ctrl+-: Zoom Out</div>
          <div>Ctrl+0: Reset Zoom</div>
        </div>
      </div>
    </div>
  )
}

export default Editor
