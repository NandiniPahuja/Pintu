import React, { useState } from 'react'
import UploadPanel from './UploadPanel'
import TextPanel from './TextPanel'
import { useStore } from '../lib/store'

interface Tool {
  id: string
  name: string
  icon: React.ReactNode
  shortcut?: string
}

const tools: Tool[] = [
  {
    id: 'upload',
    name: 'Upload',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    shortcut: 'U'
  },
  {
    id: 'text',
    name: 'Text',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    shortcut: 'T'
  },
  {
    id: 'elements',
    name: 'Elements',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    shortcut: 'E'
  },
  {
    id: 'layers',
    name: 'Layers',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
      </svg>
    ),
    shortcut: 'L'
  }
]

const elementTypes = [
  { id: 'rectangle', name: 'Rectangle', icon: '▭' },
  { id: 'circle', name: 'Circle', icon: '●' },
  { id: 'triangle', name: 'Triangle', icon: '▲' },
  { id: 'line', name: 'Line', icon: '━' },
  { id: 'arrow', name: 'Arrow', icon: '→' },
  { id: 'star', name: 'Star', icon: '★' }
]

const Sidebar: React.FC = () => {
  const { sidebarOpen } = useStore()
  const [activeTool, setActiveTool] = useState<string>('upload')
  const [expandedSection, setExpandedSection] = useState<string | null>('elements')

  const handleToolClick = (toolId: string) => {
    setActiveTool(toolId)
    if (toolId === 'elements') {
      setExpandedSection(expandedSection === 'elements' ? null : 'elements')
    } else {
      setExpandedSection(null)
    }
    
    // TODO: Implement tool-specific functionality
    console.log(`Selected tool: ${toolId}`)
  }

  const handleElementClick = (elementId: string) => {
    // TODO: Add element to canvas
    console.log(`Adding element: ${elementId}`)
  }

  if (!sidebarOpen) {
    return (
      <div className="h-full flex flex-col items-center py-4 space-y-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center transition-all
              ${activeTool === tool.id
                ? 'bg-primary-100 text-primary-700 shadow-sm'
                : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
              }
            `}
            title={`${tool.name} ${tool.shortcut ? `(${tool.shortcut})` : ''}`}
          >
            {tool.icon}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tools Section */}
      <div className="p-4 border-b border-secondary-200">
        <h3 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-3">
          Tools
        </h3>
        <div className="space-y-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`
                w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all
                ${activeTool === tool.id
                  ? 'bg-primary-100 text-primary-700 shadow-sm'
                  : 'text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900'
                }
              `}
            >
              {tool.icon}
              <span className="font-medium">{tool.name}</span>
              {tool.shortcut && (
                <span className="ml-auto text-xs text-secondary-400 bg-secondary-100 px-1.5 py-0.5 rounded">
                  {tool.shortcut}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Elements Section */}
      {activeTool === 'elements' && (
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Basic Shapes */}
            <div>
              <h4 className="text-sm font-medium text-secondary-900 mb-3">Basic Shapes</h4>
              <div className="grid grid-cols-2 gap-2">
                {elementTypes.map((element) => (
                  <button
                    key={element.id}
                    onClick={() => handleElementClick(element.id)}
                    className="p-3 border border-secondary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all text-center group"
                  >
                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                      {element.icon}
                    </div>
                    <div className="text-xs text-secondary-600 group-hover:text-primary-700">
                      {element.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Icons Section */}
            <div>
              <h4 className="text-sm font-medium text-secondary-900 mb-3">Icons</h4>
              <div className="grid grid-cols-3 gap-2">
                {['🏠', '⭐', '❤️', '🔥', '⚡', '🎨', '📱', '💻', '🚀'].map((icon, index) => (
                  <button
                    key={index}
                    onClick={() => handleElementClick(`icon-${index}`)}
                    className="p-2 border border-secondary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all text-center text-xl"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      {activeTool === 'upload' && (
        <div className="flex-1 p-4">
          <UploadPanel />
        </div>
      )}

      {/* Text Section */}
      {activeTool === 'text' && (
        <div className="flex-1 overflow-hidden">
          <TextPanel />
        </div>
      )}

      {/* Layers Section */}
      {activeTool === 'layers' && (
        <div className="flex-1 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-secondary-900">Layers</h4>
              <button className="p-1 text-secondary-500 hover:text-secondary-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-1">
              {[
                { name: 'Background', type: 'Rectangle', visible: true },
                { name: 'Header Text', type: 'Text', visible: true },
                { name: 'Logo', type: 'Image', visible: false },
                { name: 'Button', type: 'Rectangle', visible: true }
              ].map((layer, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-secondary-50 cursor-pointer group"
                >
                  <button className="text-secondary-400 hover:text-secondary-600">
                    {layer.visible ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-secondary-900 truncate">{layer.name}</p>
                    <p className="text-xs text-secondary-500">{layer.type}</p>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 text-secondary-400 hover:text-secondary-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar
