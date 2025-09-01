import React from 'react'
import { Outlet } from 'react-router-dom'
import { useStore } from '../lib/store'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import PropertiesPanel from '../components/PropertiesPanel'

const RootLayout: React.FC = () => {
  const { sidebarOpen } = useStore()

  return (
    <div className="h-screen flex flex-col bg-secondary-50">
      {/* Top Navigation */}
      <Topbar />
      
      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div 
          className={`
            transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'w-64' : 'w-16'}
            bg-white border-r border-secondary-200 
            flex-shrink-0 z-10
          `}
        >
          <Sidebar />
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Center Canvas/Content Area */}
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
          
          {/* Right Properties Panel */}
          <div className="w-80 bg-white border-l border-secondary-200 flex-shrink-0 overflow-y-auto">
            <PropertiesPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RootLayout
