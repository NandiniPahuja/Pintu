import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../lib/store'
import TemplatesModal from './TemplatesModal'
import { useDesignCanvas } from './DesignCanvas'
import { exportCanvas, downloadFile, ExportOptions, standardRatios } from '../lib/export'
import ExportModal from './ExportModal'
import FileOperationsModal from './FileOperationsModal'
import UserMenu from './UserMenu'

const Topbar: React.FC = () => {
  const { 
    toggleSidebar, 
    currentProject, 
    saveProjectToStorage,
    saveCurrentProjectToStorage,
    setCurrentProject
  } = useStore()
  const location = useLocation()
  const [showFileMenu, setShowFileMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false)
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isFileModalOpen, setIsFileModalOpen] = useState(false)
  const [fileModalMode, setFileModalMode] = useState<'save' | 'saveAs' | 'load'>('save')
  
  const { canvas, exportPNG, importJSON } = useDesignCanvas()

  const projectName = currentProject?.name || 'Untitled Project'

  const handleExport = (format: 'png' | 'jpeg' | 'svg' | 'pdf' | 'json' | 'multi') => {
    if (format === 'png' || format === 'jpeg' || format === 'multi') {
      // Open export modal for formats with options
      setIsExportModalOpen(true)
    } else {
      // Simple export for formats without options
      if (canvas && format === 'svg') {
        const svgData = canvas.toSVG();
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        downloadFile(blob, `${currentProject?.name || 'pintu-design'}.svg`);
      } else if (canvas && format === 'pdf') {
        // Simple PDF export (via PNG for now)
        const dataURL = canvas.toDataURL({ format: 'png', multiplier: 2 });
        downloadFile(dataURLToBlob(dataURL), `${currentProject?.name || 'pintu-design'}.pdf`);
      } else if (canvas && format === 'json') {
        const json = JSON.stringify(canvas.toJSON(['id', 'name']), null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        downloadFile(blob, `${currentProject?.name || 'pintu-design'}.json`);
      }
    }
    setShowExportMenu(false);
  }
  
  // Helper function to convert data URL to Blob
  function dataURLToBlob(dataURL: string): Blob {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
  }
  
  const handleFileOperation = (operation: 'new' | 'save' | 'saveAs' | 'load') => {
    if (operation === 'new') {
      // Confirm if there are unsaved changes
      if (confirm('Create a new project? Any unsaved changes will be lost.')) {
        // Reset the canvas and create new project
        if (canvas) {
          canvas.clear();
          setCurrentProject(null);
        }
      }
    } else {
      // Open appropriate modal
      setFileModalMode(operation as 'save' | 'saveAs' | 'load');
      setIsFileModalOpen(true);
    }
    setShowFileMenu(false);
  }

  const handleTemplate = (action: 'save' | 'browse') => {
    if (action === 'browse') {
      setIsTemplatesModalOpen(true)
    } else {
      // TODO: Implement save template functionality
      console.log(`Template action: ${action}`)
    }
    setShowTemplatesMenu(false)
  }
  
  // Update project name in store
  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentProject && canvas) {
      saveProjectToStorage(canvas, e.target.value, currentProject.id);
    }
  }
  
  const handleApplyTemplate = (template: any) => {
    // Convert the template object to JSON string and then import it
    const templateJson = JSON.stringify(template)
    importJSON(templateJson)
  }

  return (
    <div className="h-14 bg-white border-b border-secondary-200 flex items-center justify-between px-4 z-20">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 transition-colors"
          title="Toggle Sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo/Brand */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="text-xl font-bold text-secondary-900">Pintu</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link
            to="/"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/'
                ? 'bg-primary-100 text-primary-700'
                : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
            }`}
          >
            Editor
          </Link>
          <Link
            to="/library"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/library'
                ? 'bg-primary-100 text-primary-700'
                : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
            }`}
          >
            My Elements
          </Link>
        </nav>
      </div>

      {/* Center Section - Project Name */}
      <div className="flex-1 flex justify-center">
        <div className="flex items-center space-x-2 max-w-md">
          <input
            type="text"
            value={projectName}
            onChange={handleProjectNameChange}
            className="text-center font-medium text-secondary-900 bg-transparent hover:bg-secondary-50 focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-lg px-3 py-1 border border-transparent focus:border-primary-300 transition-all"
            placeholder="Project Name"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {/* File Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowFileMenu(!showFileMenu)
              setShowTemplatesMenu(false)
              setShowExportMenu(false)
            }}
            className="btn-outline flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>File</span>
            <svg className={`w-4 h-4 transition-transform ${showFileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showFileMenu && (
            <div className="absolute left-0 mt-2 w-48 dropdown">
              <button
                onClick={() => handleFileOperation('new')}
                className="dropdown-item w-full text-left flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Project</span>
              </button>
              <button
                onClick={() => handleFileOperation('load')}
                className="dropdown-item w-full text-left flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Open Project</span>
              </button>
              <div className="dropdown-divider"></div>
              <button
                onClick={() => handleFileOperation('save')}
                className="dropdown-item w-full text-left flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Save</span>
              </button>
              <button
                onClick={() => handleFileOperation('saveAs')}
                className="dropdown-item w-full text-left flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Save As...</span>
              </button>
            </div>
          )}
        </div>

        {/* Templates Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTemplatesMenu(!showTemplatesMenu)
              setShowFileMenu(false)
              setShowExportMenu(false)
            }}
            className="btn-outline flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Templates</span>
            <svg className={`w-4 h-4 transition-transform ${showTemplatesMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showTemplatesMenu && (
            <div className="absolute right-0 mt-2 w-48 dropdown">
              <button
                onClick={() => handleTemplate('save')}
                className="dropdown-item w-full text-left flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span>Save as Template</span>
              </button>
              <button
                onClick={() => handleTemplate('browse')}
                className="dropdown-item w-full text-left flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Browse Templates</span>
              </button>
            </div>
          )}
          
          <TemplatesModal 
            isOpen={isTemplatesModalOpen}
            onClose={() => setIsTemplatesModalOpen(false)}
            onApplyTemplate={handleApplyTemplate}
          />
        </div>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowExportMenu(!showExportMenu)
              setShowFileMenu(false)
              setShowTemplatesMenu(false)
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export</span>
            <svg className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 dropdown">
              <button
                onClick={() => handleExport('png')}
                className="dropdown-item w-full text-left flex items-center space-x-2"
              >
                <span className="w-4 h-4 text-center">🖼️</span>
                <span>PNG (Transparent)</span>
              </button>
              <button
                onClick={() => handleExport('jpeg')}
                className="dropdown-item w-full text-left flex items-center space-x-2"
              >
                <span className="w-4 h-4 text-center">📸</span>
                <span>JPEG (Adjustable Quality)</span>
              </button>
              <div className="dropdown-divider"></div>
              <button
                onClick={() => handleExport('svg')}
                className="dropdown-item w-full text-left flex items-center space-x-2"
              >
                <span className="w-4 h-4 text-center">📐</span>
                <span>SVG Vector</span>
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="dropdown-item w-full text-left flex items-center space-x-2"
              >
                <span className="w-4 h-4 text-center">📄</span>
                <span>PDF Document</span>
              </button>
              <button
                onClick={() => handleExport('json')}
                className="dropdown-item w-full text-left flex items-center space-x-2"
              >
                <span className="w-4 h-4 text-center">📦</span>
                <span>Project JSON</span>
              </button>
              <div className="dropdown-divider"></div>
              <button
                onClick={() => handleExport('multi')}
                className="dropdown-item w-full text-left flex items-center space-x-2"
              >
                <span className="w-4 h-4 text-center">🔄</span>
                <span>Multi-Ratio Export</span>
              </button>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-2">
          <UserMenu />
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showExportMenu || showTemplatesMenu || showFileMenu) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowExportMenu(false)
            setShowTemplatesMenu(false)
            setShowFileMenu(false)
          }}
        />
      )}
      
      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
      
      <FileOperationsModal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        mode={fileModalMode}
      />
    </div>
  )
}

export default Topbar
