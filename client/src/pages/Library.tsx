import React, { useState } from 'react'

interface Element {
  id: string
  name: string
  type: 'text' | 'shape' | 'image' | 'icon'
  thumbnail: string
  createdAt: Date
  tags: string[]
  category: string
}

const mockElements: Element[] = [
  {
    id: '1',
    name: 'Gradient Button',
    type: 'shape',
    thumbnail: '🔘',
    createdAt: new Date('2024-01-15'),
    tags: ['button', 'gradient', 'ui'],
    category: 'UI Elements'
  },
  {
    id: '2',
    name: 'Logo Text',
    type: 'text',
    thumbnail: '📝',
    createdAt: new Date('2024-01-14'),
    tags: ['logo', 'text', 'branding'],
    category: 'Typography'
  },
  {
    id: '3',
    name: 'Arrow Shape',
    type: 'shape',
    thumbnail: '➡️',
    createdAt: new Date('2024-01-13'),
    tags: ['arrow', 'direction', 'pointer'],
    category: 'Shapes'
  },
  {
    id: '4',
    name: 'Star Icon',
    type: 'icon',
    thumbnail: '⭐',
    createdAt: new Date('2024-01-12'),
    tags: ['star', 'rating', 'favorite'],
    category: 'Icons'
  },
  {
    id: '5',
    name: 'Profile Card',
    type: 'shape',
    thumbnail: '👤',
    createdAt: new Date('2024-01-11'),
    tags: ['card', 'profile', 'user'],
    category: 'UI Elements'
  },
  {
    id: '6',
    name: 'Heading Text',
    type: 'text',
    thumbnail: '📰',
    createdAt: new Date('2024-01-10'),
    tags: ['heading', 'title', 'text'],
    category: 'Typography'
  }
]

const categories = [
  'All',
  'UI Elements',
  'Typography',
  'Shapes',
  'Icons',
  'Images'
]

const Library: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'type'>('date')

  const filteredElements = mockElements
    .filter(element => {
      const matchesCategory = selectedCategory === 'All' || element.category === selectedCategory
      const matchesSearch = element.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           element.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'date':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })

  const handleElementClick = (element: Element) => {
    // TODO: Add element to canvas or open preview
    console.log('Selected element:', element)
  }

  const handleElementDelete = (elementId: string) => {
    // TODO: Delete element from library
    console.log('Delete element:', elementId)
  }

  return (
    <div className="h-full flex flex-col bg-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">My Elements</h1>
            <p className="text-secondary-600">Your saved design elements and components</p>
          </div>
          <button className="btn-primary flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Save Current</span>
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
              placeholder="Search elements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input w-40"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'type')}
              className="input w-32"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="type">Type</option>
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
        {filteredElements.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">
              {searchQuery ? 'No elements found' : 'No saved elements'}
            </h3>
            <p className="text-secondary-600 mb-6 max-w-md">
              {searchQuery 
                ? 'Try adjusting your search terms or filters'
                : 'Start creating and save your elements to build your personal library'
              }
            </p>
            {!searchQuery && (
              <button className="btn-primary">
                Create First Element
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredElements.map(element => (
              <div
                key={element.id}
                className="card p-4 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => handleElementClick(element)}
              >
                <div className="relative">
                  <div className="aspect-square bg-gradient-to-br from-primary-50 to-accent-50 rounded-lg flex items-center justify-center text-3xl mb-3">
                    {element.thumbnail}
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
                <p className="text-xs text-secondary-500 capitalize">{element.type}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {element.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs bg-secondary-100 text-secondary-600 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                  {element.tags.length > 2 && (
                    <span className="text-xs text-secondary-400">+{element.tags.length - 2}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="space-y-2">
            {filteredElements.map(element => (
              <div
                key={element.id}
                className="card p-4 hover:shadow-md transition-all cursor-pointer group flex items-center space-x-4"
                onClick={() => handleElementClick(element)}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-50 to-accent-50 rounded-lg flex items-center justify-center text-xl">
                  {element.thumbnail}
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
                    <span className="text-sm text-secondary-500 capitalize">{element.type}</span>
                    <span className="text-sm text-secondary-500">{element.category}</span>
                    <span className="text-sm text-secondary-500">
                      {element.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {element.tags.map(tag => (
                      <span key={tag} className="text-xs bg-secondary-100 text-secondary-600 px-2 py-0.5 rounded">
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
          <span>
            Showing {filteredElements.length} of {mockElements.length} elements
          </span>
          <div className="flex items-center space-x-4">
            <span>{mockElements.filter(e => e.type === 'text').length} Text</span>
            <span>{mockElements.filter(e => e.type === 'shape').length} Shapes</span>
            <span>{mockElements.filter(e => e.type === 'icon').length} Icons</span>
            <span>{mockElements.filter(e => e.type === 'image').length} Images</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Library
