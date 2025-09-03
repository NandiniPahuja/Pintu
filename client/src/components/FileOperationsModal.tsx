import React, { useState } from 'react'
import { useStore } from '../lib/store'
import { useDesignCanvas } from './DesignCanvas'

interface FileOperationsModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'save' | 'saveAs' | 'load'
}

const FileOperationsModal: React.FC<FileOperationsModalProps> = ({ isOpen, onClose, mode }) => {
  const { 
    projects, 
    currentProject, 
    saveProjectToStorage, 
    loadProjectFromStorage,
    deleteProject
  } = useStore()
  const { canvas } = useDesignCanvas()
  const [projectName, setProjectName] = useState(currentProject?.name || 'Untitled Project')
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  if (!isOpen) return null
  
  // Title based on mode
  const modalTitle = {
    'save': 'Save Project',
    'saveAs': 'Save Project As',
    'load': 'Load Project'
  }[mode]
  
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Format date to readable string
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date)
  }
  
  const handleSave = async () => {
    if (!canvas) return
    
    try {
      setIsLoading(true)
      
      // For Save As, always create a new project
      // For Save, update existing if it exists
      const projectId = mode === 'saveAs' 
        ? await saveProjectToStorage(canvas, projectName)
        : await saveProjectToStorage(canvas, projectName, currentProject?.id)
      
      if (projectId) {
        onClose()
      } else {
        throw new Error('Failed to save project')
      }
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save project. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleLoad = async (id: string) => {
    try {
      setIsLoading(true)
      await loadProjectFromStorage(id)
      onClose()
    } catch (error) {
      console.error('Load failed:', error)
      alert('Failed to load project. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDelete = async (id: string, event: React.MouseEvent) => {
    // Prevent triggering the load when clicking delete
    event.stopPropagation()
    
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject(id)
      } catch (error) {
        console.error('Delete failed:', error)
        alert('Failed to delete project. Please try again.')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-secondary-900">{modalTitle}</h2>
          <button
            onClick={onClose}
            className="text-secondary-500 hover:text-secondary-700"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Save/Save As UI */}
        {(mode === 'save' || mode === 'saveAs') && (
          <div>
            <div className="mb-4">
              <label htmlFor="projectName" className="block text-sm font-medium text-secondary-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full border border-secondary-300 rounded-md px-3 py-2 text-secondary-900 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter project name..."
              />
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={onClose}
                className="btn-outline"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading || !projectName.trim()}
                className="btn-primary flex items-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Load UI */}
        {mode === 'load' && (
          <div>
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full border border-secondary-300 rounded-md pl-10 pr-3 py-2 text-secondary-900 focus:ring-primary-500 focus:border-primary-500"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Project List */}
            <div className="border border-secondary-200 rounded-md overflow-hidden">
              {filteredProjects.length > 0 ? (
                <div className="max-h-72 overflow-y-auto">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleLoad(project.id)}
                      className={`flex items-center p-3 border-b border-secondary-200 hover:bg-secondary-50 cursor-pointer ${
                        project.id === currentProject?.id ? 'bg-primary-50' : ''
                      }`}
                    >
                      <div className="flex-shrink-0 mr-3 w-16 h-16 border border-secondary-200 rounded overflow-hidden bg-secondary-100">
                        {project.thumbnail ? (
                          <img 
                            src={project.thumbnail} 
                            alt={project.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-secondary-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-secondary-900 truncate">{project.name}</h4>
                        <p className="text-xs text-secondary-500">
                          Updated {formatDate(project.updatedAt)}
                        </p>
                        <p className="text-xs text-secondary-400">
                          {project.metadata?.width}×{project.metadata?.height} px
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(project.id, e)}
                        className="ml-2 p-1 text-secondary-400 hover:text-red-500"
                        title="Delete project"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-secondary-500">
                  {searchTerm ? (
                    <p>No projects match your search.</p>
                  ) : (
                    <p>No saved projects yet.</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={onClose}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FileOperationsModal
