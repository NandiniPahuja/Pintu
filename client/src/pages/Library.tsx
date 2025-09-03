import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Element as ElementType, elementsApi, handleApiError } from '../lib/api'
import { useDesignCanvas } from '../components/DesignCanvas'

const Library: React.FC = () => {
  const [elements, setElements] = useState<ElementType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date')
  
  const [draggedElement, setDraggedElement] = useState<ElementType | null>(null)
  
  const navigate = useNavigate()
  const { addImage } = useDesignCanvas()
  
  // Fetch elements
  useEffect(() => {
    const fetchElements = async () => {
      try {
        setIsLoading(true)
        const data = await elementsApi.getAll(searchQuery)
        setElements(data)
        setError(null)
      } catch (err) {
        setError(`Error loading elements: ${handleApiError(err)}`)
        console.error('Failed to load elements:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchElements()
    
    // Set up a timer to refresh periodically
    const timer = setTimeout(fetchElements, 30000) // Refresh every 30 seconds
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  // Sort elements
  const sortedElements = [...elements].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'date':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  // Element click handler
  const handleElementClick = async (element: ElementType) => {
    try {
      // Add element to canvas
      const imageUrl = elementsApi.getElementFileUrl(element.id)
      await addImage(imageUrl, { name: element.name })
      
      // Navigate to editor
      navigate('/editor')
    } catch (err) {
      console.error('Failed to add element to canvas:', err)
      alert('Failed to add element to canvas. Please try again.')
    }
  }
  
  // Element drag handlers
  const handleElementDragStart = (element: ElementType, e: React.DragEvent) => {
    setDraggedElement(element)
    
    // Set drag image data
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'element',
      id: element.id,
      name: element.name
    }))
    
    // Set drag preview (optional)
    if (e.dataTransfer.setDragImage) {
      const preview = document.createElement('div')
      preview.className = 'drag-preview'
      preview.textContent = element.name
      preview.style.cssText = 'position:absolute; top:-9999px; left:-9999px; padding:10px; background:white; border:1px solid #ddd; border-radius:4px;'
      document.body.appendChild(preview)
      e.dataTransfer.setDragImage(preview, 0, 0)
      setTimeout(() => {
        document.body.removeChild(preview)
      }, 0)
    }
  }
  
  // Element delete handler
  const handleElementDelete = async (elementId: string) => {
    if (!confirm('Are you sure you want to delete this element?')) return
    
    try {
      await elementsApi.delete(elementId)
      
      // Update local state
      setElements(elements.filter(element => element.id !== elementId))
      
    } catch (err) {
      console.error('Failed to delete element:', err)
      alert(`Failed to delete element: ${handleApiError(err)}`)
    }
  }

  return (
    <div className="h-full flex flex-col bg-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Element Library</h1>
            <p className="text-secondary-600">Reusable design elements you've saved</p>
          </div>
          <button 
            onClick={() => navigate('/editor')}
            className="btn-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>Go to Editor</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search elements by name or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'date')}
              className="input w-32"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
            </select>

            {/* View Mode */}
            <div className="flex border border-secondary-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-12 h-12 border-4 border-primary-300 border-t-primary-600 rounded-full"></div>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-red-600">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold mb-2">Error</h3>
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md"
              >
                Reload
              </button>
            </div>
          </div>
        )}
        
        {!isLoading && !error && sortedElements.length === 0 && (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">
              {searchQuery ? 'No elements found' : 'No saved elements'}
            </h3>
            <p className="text-secondary-600 mb-6 max-w-md">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Start creating and save your elements to build your personal library'
              }
            </p>
            {!searchQuery && (
              <button 
                onClick={() => navigate('/editor')}
                className="btn-primary"
              >
                Go to Editor
              </button>
            )}
          </div>
        )}
        
        {!isLoading && !error && sortedElements.length > 0 && viewMode === 'grid' && (
          // Grid View
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {sortedElements.map(element => (
              <div
                key={element.id}
                className="card p-4 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => handleElementClick(element)}
                draggable
                onDragStart={(e) => handleElementDragStart(element, e)}
              >
                <div className="relative">
                  <div className="aspect-square bg-white rounded-lg flex items-center justify-center mb-3 border border-secondary-200 overflow-hidden">
                    <img 
                      src={elementsApi.getElementFileUrl(element.id)} 
                      alt={element.name}
                      className="object-contain max-h-full max-w-full"
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleElementDelete(element.id)
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <h3 className="font-medium text-secondary-900 text-sm mb-1 truncate">{element.name}</h3>
                <div className="flex flex-wrap gap-1 mt-2">
                  {element.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="text-xs bg-secondary-100 text-secondary-600 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                  {element.tags.length > 3 && (
                    <span className="text-xs text-secondary-400">+{element.tags.length - 3}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!isLoading && !error && sortedElements.length > 0 && viewMode === 'list' && (
          // List View
          <div className="space-y-2">
            {sortedElements.map(element => (
              <div
                key={element.id}
                className="card p-4 hover:shadow-md transition-all cursor-pointer group flex items-center space-x-4"
                onClick={() => handleElementClick(element)}
                draggable
                onDragStart={(e) => handleElementDragStart(element, e)}
              >
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-secondary-200 overflow-hidden">
                  <img 
                    src={elementsApi.getElementFileUrl(element.id)} 
                    alt={element.name}
                    className="object-contain max-h-full max-w-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-secondary-900 truncate">{element.name}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleElementDelete(element.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-secondary-500">
                      {new Date(element.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {element.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs bg-secondary-100 text-secondary-600 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="bg-white border-t border-secondary-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-secondary-600">
          {!isLoading && (
            <span>
              Showing {sortedElements.length} elements
            </span>
          )}
          <div className="flex items-center space-x-2">
            <span className="text-primary-600">
              Drag any element to your canvas to add it to your design
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Library
