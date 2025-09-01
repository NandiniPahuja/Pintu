import React, { useState } from 'react'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => (
  <div>
    <label className="label">{label}</label>
    <div className="flex items-center space-x-2">
      <div
        className="w-8 h-8 rounded border border-secondary-300 cursor-pointer"
        style={{ backgroundColor: value }}
        onClick={() => {
          // TODO: Open color picker modal
          console.log('Open color picker for', label)
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input flex-1 font-mono text-sm"
        placeholder="#000000"
      />
    </div>
  </div>
)

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, unit = '', onChange }) => (
  <div>
    <label className="label flex items-center justify-between">
      {label}
      <span className="text-sm text-secondary-500">{value}{unit}</span>
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer slider"
    />
  </div>
)

const PropertiesPanel: React.FC = () => {
  const [selectedObject, setSelectedObject] = useState<string | null>('text')
  const [properties, setProperties] = useState({
    // Position & Size
    x: 100,
    y: 100,
    width: 200,
    height: 50,
    rotation: 0,
    
    // Text Properties
    text: 'Sample Text',
    fontSize: 24,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    
    // Appearance
    fillColor: '#000000',
    strokeColor: '#000000',
    strokeWidth: 0,
    opacity: 100,
    
    // Effects
    blur: 0,
    shadow: false,
    shadowColor: '#000000',
    shadowBlur: 4,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
  })

  const updateProperty = (key: string, value: any) => {
    setProperties(prev => ({ ...prev, [key]: value }))
    // TODO: Update canvas object
    console.log(`Updated ${key}:`, value)
  }

  if (!selectedObject) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No Selection</h3>
          <p className="text-sm text-secondary-600">
            Select an object on the canvas to view its properties
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-secondary-200 bg-secondary-50">
        <h3 className="font-semibold text-secondary-900">Properties</h3>
        <p className="text-sm text-secondary-600 capitalize">{selectedObject} Object</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Position & Size */}
        <section>
          <h4 className="text-sm font-semibold text-secondary-900 mb-3">Position & Size</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">X</label>
                <input
                  type="number"
                  value={properties.x}
                  onChange={(e) => updateProperty('x', Number(e.target.value))}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Y</label>
                <input
                  type="number"
                  value={properties.y}
                  onChange={(e) => updateProperty('y', Number(e.target.value))}
                  className="input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Width</label>
                <input
                  type="number"
                  value={properties.width}
                  onChange={(e) => updateProperty('width', Number(e.target.value))}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Height</label>
                <input
                  type="number"
                  value={properties.height}
                  onChange={(e) => updateProperty('height', Number(e.target.value))}
                  className="input"
                />
              </div>
            </div>
            <Slider
              label="Rotation"
              value={properties.rotation}
              min={-180}
              max={180}
              unit="°"
              onChange={(value) => updateProperty('rotation', value)}
            />
          </div>
        </section>

        {/* Text Properties (only for text objects) */}
        {selectedObject === 'text' && (
          <section>
            <h4 className="text-sm font-semibold text-secondary-900 mb-3">Text</h4>
            <div className="space-y-3">
              <div>
                <label className="label">Content</label>
                <textarea
                  value={properties.text}
                  onChange={(e) => updateProperty('text', e.target.value)}
                  className="input resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="label">Font Family</label>
                <select
                  value={properties.fontFamily}
                  onChange={(e) => updateProperty('fontFamily', e.target.value)}
                  className="input"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Font Size</label>
                  <input
                    type="number"
                    value={properties.fontSize}
                    onChange={(e) => updateProperty('fontSize', Number(e.target.value))}
                    className="input"
                    min="8"
                    max="200"
                  />
                </div>
                <div>
                  <label className="label">Weight</label>
                  <select
                    value={properties.fontWeight}
                    onChange={(e) => updateProperty('fontWeight', e.target.value)}
                    className="input"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="lighter">Light</option>
                  </select>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Appearance */}
        <section>
          <h4 className="text-sm font-semibold text-secondary-900 mb-3">Appearance</h4>
          <div className="space-y-3">
            <ColorPicker
              label="Fill Color"
              value={properties.fillColor}
              onChange={(color) => updateProperty('fillColor', color)}
            />
            <ColorPicker
              label="Stroke Color"
              value={properties.strokeColor}
              onChange={(color) => updateProperty('strokeColor', color)}
            />
            <Slider
              label="Stroke Width"
              value={properties.strokeWidth}
              min={0}
              max={20}
              unit="px"
              onChange={(value) => updateProperty('strokeWidth', value)}
            />
            <Slider
              label="Opacity"
              value={properties.opacity}
              min={0}
              max={100}
              unit="%"
              onChange={(value) => updateProperty('opacity', value)}
            />
          </div>
        </section>

        {/* Effects */}
        <section>
          <h4 className="text-sm font-semibold text-secondary-900 mb-3">Effects</h4>
          <div className="space-y-3">
            <Slider
              label="Blur"
              value={properties.blur}
              min={0}
              max={20}
              unit="px"
              onChange={(value) => updateProperty('blur', value)}
            />
            
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={properties.shadow}
                  onChange={(e) => updateProperty('shadow', e.target.checked)}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-secondary-700">Drop Shadow</span>
              </label>
            </div>

            {properties.shadow && (
              <div className="space-y-3 pl-6 border-l-2 border-secondary-200">
                <ColorPicker
                  label="Shadow Color"
                  value={properties.shadowColor}
                  onChange={(color) => updateProperty('shadowColor', color)}
                />
                <Slider
                  label="Shadow Blur"
                  value={properties.shadowBlur}
                  min={0}
                  max={20}
                  unit="px"
                  onChange={(value) => updateProperty('shadowBlur', value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Offset X</label>
                    <input
                      type="number"
                      value={properties.shadowOffsetX}
                      onChange={(e) => updateProperty('shadowOffsetX', Number(e.target.value))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Offset Y</label>
                    <input
                      type="number"
                      value={properties.shadowOffsetY}
                      onChange={(e) => updateProperty('shadowOffsetY', Number(e.target.value))}
                      className="input"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Actions */}
        <section>
          <h4 className="text-sm font-semibold text-secondary-900 mb-3">Actions</h4>
          <div className="space-y-2">
            <button
              onClick={() => console.log('Duplicate object')}
              className="btn-outline w-full justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Duplicate
            </button>
            <button
              onClick={() => console.log('Delete object')}
              className="btn-outline w-full justify-center text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </section>

        {/* Layer Order */}
        <section>
          <h4 className="text-sm font-semibold text-secondary-900 mb-3">Layer Order</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => console.log('Bring to front')}
              className="btn-outline text-xs justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Front
            </button>
            <button
              onClick={() => console.log('Send to back')}
              className="btn-outline text-xs justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3 3m0 0l3-3m-3 3V8" />
              </svg>
              Back
            </button>
            <button
              onClick={() => console.log('Bring forward')}
              className="btn-outline text-xs justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Forward
            </button>
            <button
              onClick={() => console.log('Send backward')}
              className="btn-outline text-xs justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Backward
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default PropertiesPanel
