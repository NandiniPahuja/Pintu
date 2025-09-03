import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react'
import { fabric } from 'fabric'

// Types
interface CanvasState {
  objects: any[]
  version: string
}

interface CanvasHistory {
  states: CanvasState[]
  currentIndex: number
}

interface DesignCanvasContextType {
  canvas: fabric.Canvas | null
  canvasRef: React.RefObject<HTMLCanvasElement>
  // Core functions
  addImageFromURL: (url: string, options?: fabric.IImageOptions) => Promise<fabric.Image | undefined>
  addImage: (url: string, options?: fabric.IImageOptions) => Promise<fabric.Image | undefined> // Alias for addImageFromURL
  replaceImageLayer: (imageObj: fabric.Image, newUrl: string) => Promise<void>
  addText: (text: string, options?: fabric.ITextOptions) => void
  deleteSelected: () => void
  // Layer management functions
  toggleObjectVisibility: (objectId: string) => void
  toggleObjectLock: (objectId: string) => void
  sendObjectBackward: () => void
  bringObjectForward: () => void
  groupSelectedObjects: () => void
  ungroupSelectedObject: () => void
  // Export functions
  exportPNG: (options?: fabric.IDataURLOptions) => string
  exportJSON: () => string
  importJSON: (json: string) => Promise<void>
  // Undo/Redo
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  // Canvas properties
  zoom: number
  setZoom: (zoom: number) => void
  resetZoom: () => void
  fitToScreen: () => void
  // Grid and snapping
  gridEnabled: boolean
  setGridEnabled: (enabled: boolean) => void
  snapToGrid: boolean
  setSnapToGrid: (enabled: boolean) => void
  gridSize: number
  setGridSize: (size: number) => void
}

const DesignCanvasContext = createContext<DesignCanvasContextType | null>(null)

// Custom hook to use the canvas context
export const useDesignCanvas = () => {
  const context = useContext(DesignCanvasContext)
  if (!context) {
    throw new Error('useDesignCanvas must be used within a DesignCanvasProvider')
  }
  return context
}

interface DesignCanvasProviderProps {
  children: React.ReactNode
  width?: number
  height?: number
  backgroundColor?: string
}

export const DesignCanvasProvider: React.FC<DesignCanvasProviderProps> = ({
  children,
  width = 800,
  height = 600,
  backgroundColor = '#ffffff'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
  const [zoom, setZoomState] = useState(1)
  const [gridEnabled, setGridEnabled] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [gridSize, setGridSize] = useState(20)
  
  // History management
  const [history, setHistory] = useState<CanvasHistory>({
    states: [],
    currentIndex: -1
  })
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  
  // Prevent saving state during undo/redo operations
  const isUndoRedoRef = useRef(false)

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor,
      selection: true,
      preserveObjectStacking: true,
      imageSmoothingEnabled: true,
      enableRetinaScaling: true,
    })

    // Enable object controls
    fabric.Object.prototype.set({
      transparentCorners: false,
      cornerStyle: 'circle',
      cornerSize: 10,
      cornerColor: '#4F46E5',
      cornerStrokeColor: '#FFFFFF',
      borderColor: '#4F46E5',
      borderScaleFactor: 2,
    })

    // Double-click to edit text
    fabricCanvas.on('mouse:dblclick', (options) => {
      if (options.target && options.target instanceof fabric.IText) {
        options.target.enterEditing();
        options.target.selectAll();
      }
    });

    setCanvas(fabricCanvas)

    // Save initial state
    setTimeout(() => {
      saveCanvasState(fabricCanvas)
    }, 100)

    return () => {
      fabricCanvas.dispose()
    }
  }, [width, height, backgroundColor])

  // Auto-resize canvas to container
  useEffect(() => {
    if (!canvas) return

    const resizeCanvas = () => {
      const container = canvasRef.current?.parentElement
      if (!container) return

      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      
      // Maintain aspect ratio while fitting container
      const canvasAspectRatio = width / height
      const containerAspectRatio = containerWidth / containerHeight

      let newWidth, newHeight

      if (containerAspectRatio > canvasAspectRatio) {
        newHeight = containerHeight
        newWidth = newHeight * canvasAspectRatio
      } else {
        newWidth = containerWidth
        newHeight = newWidth / canvasAspectRatio
      }

      const scale = Math.min(newWidth / width, newHeight / height)
      
      canvas.setDimensions({
        width: newWidth,
        height: newHeight
      })
      
      canvas.setViewportTransform([scale, 0, 0, scale, 0, 0])
      canvas.requestRenderAll()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [canvas, width, height])

  // Grid drawing
  useEffect(() => {
    if (!canvas) return

    const drawGrid = () => {
      canvas.backgroundImage = null
      
      if (!gridEnabled) {
        canvas.requestRenderAll()
        return
      }

      const canvasWidth = canvas.getWidth()
      const canvasHeight = canvas.getHeight()
      
      // Create grid lines
      const gridLines: string[] = []
      
      // Vertical lines
      for (let i = 0; i <= canvasWidth; i += gridSize) {
        gridLines.push(`M ${i} 0 L ${i} ${canvasHeight}`)
      }
      
      // Horizontal lines
      for (let i = 0; i <= canvasHeight; i += gridSize) {
        gridLines.push(`M 0 ${i} L ${canvasWidth} ${i}`)
      }

      const gridSVG = `
        <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
          <path d="${gridLines.join(' ')}" stroke="#e5e7eb" stroke-width="0.5" fill="none" opacity="0.5"/>
        </svg>
      `

      fabric.loadSVGFromString(gridSVG, (objects, options) => {
        const gridGroup = fabric.util.groupSVGElements(objects, options)
        gridGroup.set({
          selectable: false,
          evented: false,
          excludeFromExport: true
        })
        canvas.setBackgroundImage(gridGroup, canvas.requestRenderAll.bind(canvas))
      })
    }

    drawGrid()
  }, [canvas, gridEnabled, gridSize])

  // Snapping to grid
  useEffect(() => {
    if (!canvas) return

    const handleObjectMoving = (e: fabric.IEvent) => {
      if (!snapToGrid) return

      const obj = e.target
      if (!obj) return

      const left = Math.round(obj.left! / gridSize) * gridSize
      const top = Math.round(obj.top! / gridSize) * gridSize

      obj.set({
        left,
        top
      })
    }

    canvas.on('object:moving', handleObjectMoving)

    return () => {
      canvas.off('object:moving', handleObjectMoving)
    }
  }, [canvas, snapToGrid, gridSize])

  // Canvas event handlers for history
  useEffect(() => {
    if (!canvas) return

    const handleCanvasChange = () => {
      if (isUndoRedoRef.current) return
      saveCanvasState(canvas)
    }

    const events = [
      'object:added',
      'object:removed',
      'object:modified',
      'path:created'
    ]

    events.forEach(event => {
      canvas.on(event, handleCanvasChange)
    })

    return () => {
      events.forEach(event => {
        canvas.off(event, handleCanvasChange)
      })
    }
  }, [canvas])

  // Keyboard event handlers
  useEffect(() => {
    if (!canvas) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default only if we're handling the key
      const activeElement = document.activeElement
      const isInputFocused = activeElement?.tagName === 'INPUT' || 
                            activeElement?.tagName === 'TEXTAREA' ||
                            activeElement?.contentEditable === 'true'

      if (isInputFocused) return

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault()
          deleteSelected()
          break
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
          }
          break
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            redo()
          }
          break
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            canvas.selectAll()
            canvas.requestRenderAll()
          }
          break
        case 'Escape':
          canvas.discardActiveObject()
          canvas.requestRenderAll()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [canvas])

  // Save canvas state to history
  const saveCanvasState = useCallback((fabricCanvas: fabric.Canvas) => {
    const state: CanvasState = {
      objects: fabricCanvas.toJSON(['id', 'name']),
      version: '1.0'
    }

    setHistory(prev => {
      const newStates = prev.states.slice(0, prev.currentIndex + 1)
      newStates.push(state)
      
      // Limit history size to 50 states
      if (newStates.length > 50) {
        newStates.shift()
      }
      
      const newIndex = newStates.length - 1
      
      setCanUndo(newIndex > 0)
      setCanRedo(false)
      
      return {
        states: newStates,
        currentIndex: newIndex
      }
    })
  }, [])

  // Core canvas functions
  const addImageFromURL = useCallback(async (url: string, options: fabric.IImageOptions = {}) => {
    if (!canvas) return undefined;
    try {
      const img = await new Promise<fabric.Image>((resolve, reject) => {
        fabric.Image.fromURL(url, (fabricImg) => {
          if (fabricImg) {
            resolve(fabricImg)
          } else {
            reject(new Error('Failed to load image'))
          }
        }, {
          crossOrigin: 'anonymous',
          ...options
        })
      })
      // Center the image
      img.set({
        left: (canvas.getWidth() - img.getScaledWidth()) / 2,
        top: (canvas.getHeight() - img.getScaledHeight()) / 2,
        id: `image_${Date.now()}`,
        name: `Image ${canvas.getObjects().length + 1}`,
        ...options
      })
      canvas.add(img)
      canvas.setActiveObject(img)
      canvas.requestRenderAll()
      return img;
    } catch (error) {
      console.error('Failed to add image:', error)
      throw error
    }
  }, [canvas]);

  // Replace image layer with new URL (for cutout)
  const replaceImageLayer = useCallback(async (imageObj: fabric.Image, newUrl: string) => {
    if (!canvas || !imageObj) return;
    try {
      const newImg = await new Promise<fabric.Image>((resolve, reject) => {
        fabric.Image.fromURL(newUrl, (fabricImg) => {
          if (fabricImg) {
            resolve(fabricImg)
          } else {
            reject(new Error('Failed to load cutout image'))
          }
        }, {
          crossOrigin: 'anonymous'
        })
      })
      // Keep position and size
      newImg.set({
        left: imageObj.left,
        top: imageObj.top,
        scaleX: imageObj.scaleX,
        scaleY: imageObj.scaleY,
        angle: imageObj.angle,
        id: imageObj.id,
        name: imageObj.name
      })
      canvas.remove(imageObj)
      canvas.add(newImg)
      canvas.setActiveObject(newImg)
      canvas.requestRenderAll()
    } catch (error) {
      console.error('Failed to replace image:', error)
      throw error
    }
  }, [canvas]);

  const addText = useCallback((text: string, options: fabric.ITextOptions = {}) => {
    if (!canvas) return

    // Use IText for better editing experience
    const textObj = new fabric.IText(text, {
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2,
      originX: 'center',
      originY: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 24,
      fill: '#000000',
      id: `text_${Date.now()}`,
      name: `Text ${canvas.getObjects().length + 1}`,
      editable: true,
      cursorColor: '#4F46E5',
      cursorWidth: 2,
      cursorDuration: 600,
      selectionColor: 'rgba(79, 70, 229, 0.3)',
      ...options
    })

    canvas.add(textObj)
    canvas.setActiveObject(textObj)
    canvas.requestRenderAll()
    
    // Return the created object
    return textObj;
  }, [canvas])

  const deleteSelected = useCallback(() => {
    if (!canvas) return

    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => canvas.remove(obj))
      canvas.discardActiveObject()
      canvas.requestRenderAll()
    }
  }, [canvas])

  // Layer management functions
  const toggleObjectVisibility = useCallback((objectId: string) => {
    if (!canvas) return
    
    const object = canvas.getObjects().find(obj => obj.id === objectId)
    if (!object) return
    
    // Toggle visibility
    object.set('invisible', !object.invisible)
    canvas.requestRenderAll()
    
    // Update state history
    saveCanvasState(canvas)
  }, [canvas, saveCanvasState])

  const toggleObjectLock = useCallback((objectId: string) => {
    if (!canvas) return
    
    const object = canvas.getObjects().find(obj => obj.id === objectId)
    if (!object) return
    
    // Toggle lock
    const isLocked = !object.locked
    object.set('locked', isLocked)
    
    // If locking, also remove from selection if it's selected
    if (isLocked && object.active) {
      canvas.discardActiveObject()
    }
    
    object.selectable = !isLocked
    object.evented = !isLocked
    canvas.requestRenderAll()
    
    // Update state history
    saveCanvasState(canvas)
  }, [canvas, saveCanvasState])

  const sendObjectBackward = useCallback(() => {
    if (!canvas) return
    
    const activeObject = canvas.getActiveObject()
    if (!activeObject) return
    
    canvas.sendBackwards(activeObject)
    canvas.requestRenderAll()
    
    // Update state history
    saveCanvasState(canvas)
  }, [canvas, saveCanvasState])

  const bringObjectForward = useCallback(() => {
    if (!canvas) return
    
    const activeObject = canvas.getActiveObject()
    if (!activeObject) return
    
    canvas.bringForward(activeObject)
    canvas.requestRenderAll()
    
    // Update state history
    saveCanvasState(canvas)
  }, [canvas, saveCanvasState])

  const groupSelectedObjects = useCallback(() => {
    if (!canvas) return
    
    // We need multiple selected objects to make a group
    const activeSelection = canvas.getActiveObject() as fabric.ActiveSelection
    if (!activeSelection || !activeSelection.type || activeSelection.type !== 'activeSelection') return
    
    // Create a group from the active selection
    const group = activeSelection.toGroup() as fabric.Group
    
    // Set additional properties on the group
    group.id = `group_${Date.now()}`
    group.name = `Group ${canvas.getObjects().filter(obj => obj.type === 'group').length + 1}`
    
    // Update canvas
    canvas.requestRenderAll()
    
    // Update state history
    saveCanvasState(canvas)
  }, [canvas, saveCanvasState])

  const ungroupSelectedObject = useCallback(() => {
    if (!canvas) return
    
    const activeObject = canvas.getActiveObject() as fabric.Group
    if (!activeObject || activeObject.type !== 'group') return
    
    // Ungroup the selected group object
    const items = activeObject.getObjects()
    
    // Destroy the group
    activeObject.destroy()
    
    // Get all the objects from the group
    const ungroupedObjects = canvas._objects.filter(obj => 
      items.indexOf(obj as fabric.Object) !== -1
    )
    
    // Create a new active selection with these objects
    const selection = new fabric.ActiveSelection(ungroupedObjects, {
      canvas: canvas
    })
    
    // Remove the group and add the selection
    canvas.remove(activeObject)
    canvas.setActiveObject(selection)
    canvas.requestRenderAll()
    
    // Update state history
    saveCanvasState(canvas)
  }, [canvas, saveCanvasState])

  // Export functions
  const exportPNG = useCallback((options: fabric.IDataURLOptions = {}) => {
    if (!canvas) return ''

    return canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2, // 2x resolution for better quality
      ...options
    })
  }, [canvas])

  const exportJSON = useCallback(() => {
    if (!canvas) return ''

    return JSON.stringify(canvas.toJSON(['id', 'name']), null, 2)
  }, [canvas])

  const importJSON = useCallback(async (json: string) => {
    if (!canvas) return

    try {
      const data = JSON.parse(json)
      
      isUndoRedoRef.current = true
      
      await new Promise<void>((resolve, reject) => {
        canvas.loadFromJSON(data, () => {
          canvas.requestRenderAll()
          isUndoRedoRef.current = false
          resolve()
        }, (obj: any, error: any) => {
          if (error) {
            console.error('Error loading object:', error)
            reject(error)
          }
        })
      })

      // Save state after import
      setTimeout(() => {
        saveCanvasState(canvas)
      }, 100)
    } catch (error) {
      isUndoRedoRef.current = false
      console.error('Failed to import JSON:', error)
      throw error
    }
  }, [canvas, saveCanvasState])

  // Undo/Redo functions
  const undo = useCallback(() => {
    if (!canvas || !canUndo) return

    const newIndex = history.currentIndex - 1
    if (newIndex < 0) return

    const state = history.states[newIndex]
    
    isUndoRedoRef.current = true
    
    canvas.loadFromJSON(state.objects, () => {
      canvas.requestRenderAll()
      isUndoRedoRef.current = false
      
      setHistory(prev => ({ ...prev, currentIndex: newIndex }))
      setCanUndo(newIndex > 0)
      setCanRedo(true)
    })
  }, [canvas, history, canUndo])

  const redo = useCallback(() => {
    if (!canvas || !canRedo) return

    const newIndex = history.currentIndex + 1
    if (newIndex >= history.states.length) return

    const state = history.states[newIndex]
    
    isUndoRedoRef.current = true
    
    canvas.loadFromJSON(state.objects, () => {
      canvas.requestRenderAll()
      isUndoRedoRef.current = false
      
      setHistory(prev => ({ ...prev, currentIndex: newIndex }))
      setCanUndo(true)
      setCanRedo(newIndex < history.states.length - 1)
    })
  }, [canvas, history, canRedo])

  // Zoom functions
  const setZoom = useCallback((newZoom: number) => {
    if (!canvas) return

    const clampedZoom = Math.max(0.1, Math.min(5, newZoom))
    canvas.setZoom(clampedZoom)
    setZoomState(clampedZoom)
    canvas.requestRenderAll()
  }, [canvas])

  const resetZoom = useCallback(() => {
    setZoom(1)
  }, [setZoom])

  const fitToScreen = useCallback(() => {
    if (!canvas) return

    const objects = canvas.getObjects()
    if (objects.length === 0) {
      resetZoom()
      return
    }

    const group = new fabric.Group(objects)
    const boundingRect = group.getBoundingRect()
    
    const containerWidth = canvas.getWidth()
    const containerHeight = canvas.getHeight()
    
    const scaleX = (containerWidth * 0.9) / boundingRect.width
    const scaleY = (containerHeight * 0.9) / boundingRect.height
    
    const scale = Math.min(scaleX, scaleY, 2) // Max 2x zoom
    
    setZoom(scale)
    
    // Center the view
    const center = canvas.getCenter()
    canvas.absolutePan({
      x: center.left - boundingRect.left - boundingRect.width / 2,
      y: center.top - boundingRect.top - boundingRect.height / 2
    })
  }, [canvas, resetZoom, setZoom])

  const contextValue: DesignCanvasContextType = {
    canvas,
    canvasRef,
    // Core functions
    addImageFromURL,
    addImage: addImageFromURL, // Alias for addImageFromURL
    replaceImageLayer,
    addText,
    deleteSelected,
    // Layer management functions
    toggleObjectVisibility,
    toggleObjectLock,
    sendObjectBackward,
    bringObjectForward,
    groupSelectedObjects,
    ungroupSelectedObject,
    // Export functions
    exportPNG,
    exportJSON,
    importJSON,
    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,
    // Canvas properties
    zoom,
    setZoom,
    resetZoom,
    fitToScreen,
    // Grid and snapping
    gridEnabled,
    setGridEnabled,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize
  }

  return (
    <DesignCanvasContext.Provider value={contextValue}>
      {children}
    </DesignCanvasContext.Provider>
  )
}

// Canvas component
interface DesignCanvasProps {
  className?: string
  style?: React.CSSProperties
}

export const DesignCanvas: React.FC<DesignCanvasProps> = ({ 
  className = '', 
  style = {} 
}) => {
  const { canvasRef } = useDesignCanvas()

  return (
    <div 
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={style}
    >
      <canvas
        ref={canvasRef}
        className="block border border-gray-200 bg-white shadow-sm"
        style={{
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />
    </div>
  )
}

// Canvas toolbar component for common actions
export const CanvasToolbar: React.FC = () => {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    zoom,
    setZoom,
    resetZoom,
    fitToScreen,
    deleteSelected,
    gridEnabled,
    setGridEnabled,
    snapToGrid,
    setSnapToGrid,
    addText,
    exportPNG,
    exportJSON,
    importJSON
  } = useDesignCanvas()

  const handleImportJSON = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const json = e.target?.result as string
            importJSON(json)
          } catch (error) {
            console.error('Failed to import file:', error)
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleExportJSON = () => {
    const json = exportJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'canvas-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPNG = () => {
    const dataURL = exportPNG()
    const a = document.createElement('a')
    a.href = dataURL
    a.download = 'canvas-export.png'
    a.click()
  }

  return (
    <div className="flex items-center space-x-2 p-2 bg-white border-b border-gray-200">
      {/* Undo/Redo */}
      <div className="flex space-x-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
          </svg>
        </button>
      </div>

      <div className="h-6 border-l border-gray-300" />

      {/* Zoom controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => setZoom(zoom - 0.1)}
          className="p-2 rounded text-gray-600 hover:bg-gray-100"
          title="Zoom Out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6" />
          </svg>
        </button>
        <span className="text-sm text-gray-600 min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(zoom + 0.1)}
          className="p-2 rounded text-gray-600 hover:bg-gray-100"
          title="Zoom In"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v6m3-3H9" />
          </svg>
        </button>
        <button
          onClick={fitToScreen}
          className="p-2 rounded text-gray-600 hover:bg-gray-100"
          title="Fit to Screen"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <button
          onClick={resetZoom}
          className="p-2 rounded text-gray-600 hover:bg-gray-100"
          title="Reset Zoom"
        >
          100%
        </button>
      </div>

      <div className="h-6 border-l border-gray-300" />

      {/* Grid controls */}
      <div className="flex space-x-1">
        <button
          onClick={() => setGridEnabled(!gridEnabled)}
          className={`p-2 rounded text-gray-600 hover:bg-gray-100 ${gridEnabled ? 'bg-blue-100 text-blue-600' : ''}`}
          title="Toggle Grid"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`p-2 rounded text-gray-600 hover:bg-gray-100 ${snapToGrid ? 'bg-blue-100 text-blue-600' : ''}`}
          title="Snap to Grid"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      <div className="h-6 border-l border-gray-300" />

      {/* Quick actions */}
      <div className="flex space-x-1">
        <button
          onClick={() => addText('Double click to edit')}
          className="p-2 rounded text-gray-600 hover:bg-gray-100"
          title="Add Text"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M8 12h8m-6 6h4" />
          </svg>
        </button>
        <button
          onClick={deleteSelected}
          className="p-2 rounded text-gray-600 hover:bg-gray-100"
          title="Delete Selected"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="h-6 border-l border-gray-300" />

      {/* Export */}
      <div className="flex space-x-1">
        <button
          onClick={handleExportPNG}
          className="p-2 rounded text-gray-600 hover:bg-gray-100"
          title="Export as PNG"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
        <button
          onClick={handleExportJSON}
          className="p-2 rounded text-gray-600 hover:bg-gray-100"
          title="Export as JSON"
        >
          JSON
        </button>
        <button
          onClick={handleImportJSON}
          className="p-2 rounded text-gray-600 hover:bg-gray-100"
          title="Import JSON"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default DesignCanvas
