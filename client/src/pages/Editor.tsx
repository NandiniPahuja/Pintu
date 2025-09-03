import React, { useEffect, useCallback } from 'react'
import { fabric } from 'fabric'
import { DesignCanvasProvider, DesignCanvas, CanvasToolbar, useDesignCanvas } from '../components/DesignCanvas'
import { useStore } from '../lib/store'

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

// AutoSave component - handles automatic saving of canvas state
const AutoSave: React.FC = () => {
  const { canvas } = useDesignCanvas();
  const { autosaveProject, saveCurrentProjectToStorage, isCanvasModified } = useStore();
  
  // Save every 10 seconds if there are changes
  useEffect(() => {
    if (!canvas) return;
    
    // Initialize autosave interval
    const autoSaveInterval = setInterval(() => {
      if (isCanvasModified && canvas) {
        autosaveProject(canvas);
        console.log('Autosaved project');
      }
    }, 10000); // 10 seconds
    
    // Save before page unload/close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCanvasModified && canvas) {
        // Autosave the project
        autosaveProject(canvas);
        
        // Show confirmation dialog if there are unsaved changes
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(autoSaveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [canvas, autosaveProject, isCanvasModified]);
  
  return null; // This is a behavior-only component
};

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
        
        {/* AutoSave Handler */}
        <AutoSave />
      </div>
    </DesignCanvasProvider>
  )
}

// Status bar component
const StatusBar: React.FC = () => {
  const { canvas, zoom, canUndo, canRedo } = useDesignCanvas()
  const { isCanvasModified, lastSaved, lastAutosaved } = useStore()
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
  
  // Format the autosave/save time
  const formatSaveTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    
    // Get time difference in seconds
    const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
    
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    
    // Format as time for older saves
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>Objects: {objectCount}</span>
          <span>Selected: {selectedCount}</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
        </div>
        <div className="flex items-center space-x-4">
          {/* Save status */}
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isCanvasModified ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
            <span>{isCanvasModified ? 'Modified' : 'Saved'}</span>
            {lastSaved && <span className="text-xs text-gray-400">(Saved: {formatSaveTime(lastSaved)})</span>}
          </div>
          
          {/* Autosave indicator */}
          {lastAutosaved && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-400">Auto: {formatSaveTime(lastAutosaved)}</span>
            </div>
          )}
          
          {/* Undo/Redo status */}
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${canUndo ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
            <span className="hidden sm:inline">Undo:</span> 
            <span>{canUndo ? 'Available' : 'None'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${canRedo ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
            <span className="hidden sm:inline">Redo:</span>
            <span>{canRedo ? 'Available' : 'None'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Editor
