import React, { useState, useEffect, useCallback } from 'react'
import { useDesignCanvas } from './DesignCanvas'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

// Types for our layer item
interface LayerItem {
  id: string
  name: string
  type: string
  visible: boolean
  locked: boolean
  selected: boolean
  isGroup: boolean
  groupChildren?: LayerItem[]
}

const LayersPanel: React.FC = () => {
  const { 
    canvas, 
    deleteSelected,
    // We'll need to implement these methods in DesignCanvas.tsx
    toggleObjectVisibility,
    toggleObjectLock,
    sendObjectBackward,
    bringObjectForward,
    groupSelectedObjects,
    ungroupSelectedObject
  } = useDesignCanvas()

  const [layers, setLayers] = useState<LayerItem[]>([])
  const [selectedLayers, setSelectedLayers] = useState<string[]>([])

  // Function to refresh layers from canvas
  const refreshLayers = useCallback(() => {
    if (!canvas) return

    const objects = canvas.getObjects()
    const newLayers: LayerItem[] = []
    
    // Process in reverse order so top-most objects appear at the top of the list
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i]
      
      const layerItem: LayerItem = {
        id: obj.id as string || `obj_${i}`,
        name: obj.name as string || getDefaultName(obj.type),
        type: obj.type || 'unknown',
        visible: !obj.invisible,
        locked: obj.locked || false,
        selected: obj.active || false,
        isGroup: obj.type === 'group'
      }
      
      // Handle groups
      if (layerItem.isGroup && (obj as fabric.Group).getObjects) {
        const groupObjects = (obj as fabric.Group).getObjects()
        layerItem.groupChildren = groupObjects.map((groupObj, j) => ({
          id: groupObj.id as string || `group_${i}_obj_${j}`,
          name: groupObj.name as string || getDefaultName(groupObj.type),
          type: groupObj.type || 'unknown',
          visible: !groupObj.invisible,
          locked: groupObj.locked || false,
          selected: groupObj.active || false,
          isGroup: false
        }))
      }

      newLayers.push(layerItem)
    }

    setLayers(newLayers)
    
    // Update selected layers
    const selected = canvas.getActiveObjects().map(obj => obj.id as string || '')
                     .filter(id => id !== '')
    setSelectedLayers(selected)
  }, [canvas])

  // Get a default name for an object based on its type
  const getDefaultName = (type: string | undefined): string => {
    switch (type) {
      case 'i-text':
      case 'text':
        return 'Text'
      case 'image':
        return 'Image'
      case 'rect':
        return 'Rectangle'
      case 'circle':
        return 'Circle'
      case 'path':
        return 'Path'
      case 'group':
        return 'Group'
      default:
        return 'Object'
    }
  }

  // Initial load and refresh on canvas changes
  useEffect(() => {
    if (!canvas) return
    
    const handleCanvasModified = () => {
      refreshLayers()
    }
    
    // Set up listeners
    canvas.on('object:added', handleCanvasModified)
    canvas.on('object:removed', handleCanvasModified)
    canvas.on('object:modified', handleCanvasModified)
    canvas.on('selection:created', handleCanvasModified)
    canvas.on('selection:updated', handleCanvasModified)
    canvas.on('selection:cleared', handleCanvasModified)
    
    // Initial refresh
    refreshLayers()
    
    // Clean up listeners
    return () => {
      canvas.off('object:added', handleCanvasModified)
      canvas.off('object:removed', handleCanvasModified)
      canvas.off('object:modified', handleCanvasModified)
      canvas.off('selection:created', handleCanvasModified)
      canvas.off('selection:updated', handleCanvasModified)
      canvas.off('selection:cleared', handleCanvasModified)
    }
  }, [canvas, refreshLayers])

  // Handle layer selection
  const handleLayerClick = (layerId: string, event: React.MouseEvent) => {
    if (!canvas) return
    
    // Find the object with this ID
    const obj = canvas.getObjects().find(o => (o.id as string) === layerId)
    if (!obj) return
    
    if (event.ctrlKey || event.metaKey) {
      // Toggle selection
      if (obj.active) {
        canvas.discardActiveObject()
      } else {
        const currentSelection = canvas.getActiveObjects()
        const selection = new fabric.ActiveSelection([...currentSelection, obj], { canvas })
        canvas.setActiveObject(selection)
      }
    } else if (event.shiftKey) {
      // Range selection (not implemented)
      // For simplicity, just add to current selection
      const currentSelection = canvas.getActiveObjects()
      const selection = new fabric.ActiveSelection([...currentSelection, obj], { canvas })
      canvas.setActiveObject(selection)
    } else {
      // Single selection
      canvas.discardActiveObject()
      canvas.setActiveObject(obj)
    }
    
    canvas.requestRenderAll()
  }
  
  // Handle visibility toggle
  const handleToggleVisibility = (layerId: string) => {
    if (toggleObjectVisibility) {
      toggleObjectVisibility(layerId)
    }
  }
  
  // Handle lock toggle
  const handleToggleLock = (layerId: string) => {
    if (toggleObjectLock) {
      toggleObjectLock(layerId)
    }
  }

  // Handle drag end for reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination || !canvas) return // Dropped outside the list
    
    const { source, destination } = result
    
    // Get the objects array (note: canvas objects are in reverse order of our UI)
    const objects = canvas.getObjects()
    const sourceIndex = objects.length - 1 - source.index
    const destinationIndex = objects.length - 1 - destination.index
    
    // Reorder the object in the canvas
    const [removed] = objects.splice(sourceIndex, 1)
    objects.splice(destinationIndex, 0, removed)
    
    // We need to reassign z-indices
    for (let i = 0; i < objects.length; i++) {
      canvas.moveTo(objects[i], i)
    }
    
    canvas.requestRenderAll()
    refreshLayers()
  }

  // Set up keyboard shortcuts
  useEffect(() => {
    if (!canvas) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Group: Cmd/Ctrl + G
      if ((e.metaKey || e.ctrlKey) && e.key === 'g' && !e.shiftKey) {
        e.preventDefault()
        if (groupSelectedObjects) {
          groupSelectedObjects()
        }
      }
      
      // Ungroup: Shift + Cmd/Ctrl + G
      if ((e.metaKey || e.ctrlKey) && e.key === 'g' && e.shiftKey) {
        e.preventDefault()
        if (ungroupSelectedObject) {
          ungroupSelectedObject()
        }
      }
      
      // Send backward: [
      if (e.key === '[' && !(e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (sendObjectBackward) {
          sendObjectBackward()
        }
      }
      
      // Bring forward: ]
      if (e.key === ']' && !(e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (bringObjectForward) {
          bringObjectForward()
        }
      }
      
      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only handle if not in an input field
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault()
          if (deleteSelected) {
            deleteSelected()
          }
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [canvas, groupSelectedObjects, ungroupSelectedObject, sendObjectBackward, bringObjectForward, deleteSelected])

  // Layer item component
  const LayerItem: React.FC<{
    layer: LayerItem,
    index: number,
    depth?: number
  }> = ({ layer, index, depth = 0 }) => (
    <Draggable draggableId={layer.id} index={index} isDragDisabled={layer.locked}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex items-center p-2 border-b border-secondary-200 ${
            layer.selected ? 'bg-primary-50' : ''
          } ${depth > 0 ? 'pl-8' : ''} hover:bg-secondary-50`}
        >
          {/* Drag handle */}
          <div {...provided.dragHandleProps} className="mr-2 text-secondary-400 cursor-grab">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h6m0 0V5m0 0v6M3 17h6m0 0v-6m0 6v6" />
            </svg>
          </div>
          
          {/* Type icon */}
          <div className="mr-2 text-secondary-400">
            {layer.type === 'image' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            {(layer.type === 'i-text' || layer.type === 'text') && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {layer.type === 'group' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            )}
            {layer.type === 'rect' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
              </svg>
            )}
            {layer.type === 'circle' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
              </svg>
            )}
            {(layer.type !== 'image' && layer.type !== 'i-text' && layer.type !== 'text' && layer.type !== 'group' && layer.type !== 'rect' && layer.type !== 'circle') && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
          </div>
          
          {/* Layer name */}
          <div 
            className="flex-1 truncate cursor-pointer"
            onClick={(e) => handleLayerClick(layer.id, e)}
          >
            {layer.name}
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            {/* Visibility toggle */}
            <button
              className={`p-1 rounded hover:bg-secondary-100 ${
                layer.visible ? 'text-secondary-700' : 'text-secondary-400'
              }`}
              onClick={() => handleToggleVisibility(layer.id)}
              title={layer.visible ? 'Hide' : 'Show'}
            >
              {layer.visible ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              )}
            </button>
            
            {/* Lock toggle */}
            <button
              className={`p-1 rounded hover:bg-secondary-100 ${
                layer.locked ? 'text-secondary-700' : 'text-secondary-400'
              }`}
              onClick={() => handleToggleLock(layer.id)}
              title={layer.locked ? 'Unlock' : 'Lock'}
            >
              {layer.locked ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </Draggable>
  )

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-secondary-200">
        <h2 className="text-lg font-medium text-secondary-900">Layers</h2>
        <p className="text-sm text-secondary-500">Manage and organize your design elements</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="layers-list">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="min-h-full"
              >
                {layers.map((layer, index) => (
                  <React.Fragment key={layer.id}>
                    <LayerItem layer={layer} index={index} />
                    
                    {/* Render any group children */}
                    {layer.isGroup && layer.groupChildren && layer.groupChildren.map((child, childIndex) => (
                      <LayerItem 
                        key={`${layer.id}-child-${child.id}`} 
                        layer={child} 
                        index={-1} // Not draggable
                        depth={1} 
                      />
                    ))}
                  </React.Fragment>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      
      <div className="p-3 border-t border-secondary-200 bg-secondary-50">
        <div className="flex items-center justify-between">
          <div className="text-xs text-secondary-500">
            {layers.length} {layers.length === 1 ? 'layer' : 'layers'}
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className="p-1 text-secondary-700 hover:bg-secondary-200 rounded"
              title="Group selected (Ctrl+G)"
              onClick={() => groupSelectedObjects && groupSelectedObjects()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </button>
            <button 
              className="p-1 text-secondary-700 hover:bg-secondary-200 rounded"
              title="Ungroup (Shift+Ctrl+G)"
              onClick={() => ungroupSelectedObject && ungroupSelectedObject()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
            <button 
              className="p-1 text-secondary-700 hover:bg-secondary-200 rounded"
              title="Send backward ([)"
              onClick={() => sendObjectBackward && sendObjectBackward()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button 
              className="p-1 text-secondary-700 hover:bg-secondary-200 rounded"
              title="Bring forward (])"
              onClick={() => bringObjectForward && bringObjectForward()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LayersPanel
