import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../lib/store'

const Topbar: React.FC = () => {
  const { toggleSidebar, currentProject } = useStore()
  const location = useLocation()
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false)

  const projectName = currentProject?.name || 'Untitled Project'

  const handleExport = (format: 'png' | 'svg' | 'pdf') => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}`)
    setShowExportMenu(false)
  }

  const handleTemplate = (action: 'save' | 'browse') => {
    // TODO: Implement template functionality
    console.log(`Template action: ${action}`)
    setShowTemplatesMenu(false)
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
            onChange={(e) => {
              // TODO: Update project name in store
              console.log('Project name changed:', e.target.value)
            }}
            className="text-center font-medium text-secondary-900 bg-transparent hover:bg-secondary-50 focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-lg px-3 py-1 border border-transparent focus:border-primary-300 transition-all"
            placeholder="Project Name"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {/* Templates Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTemplatesMenu(!showTemplatesMenu)
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
        </div>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowExportMenu(!showExportMenu)
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
            <div className="absolute right-0 mt-2 w-40 dropdown">
              <button
                onClick={() => handleExport('png')}
                className="dropdown-item w-full text-left flex items-center space-x-2"
              >
                <span className="w-4 h-4 text-center">🖼️</span>
                <span>PNG Image</span>
              </button>
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
            </div>
          )}
        </div>

        {/* User Menu (optional) */}
        <div className="hidden lg:flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">U</span>
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showExportMenu || showTemplatesMenu) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowExportMenu(false)
            setShowTemplatesMenu(false)
          }}
        />
      )}
    </div>
  )
}

export default Topbar
