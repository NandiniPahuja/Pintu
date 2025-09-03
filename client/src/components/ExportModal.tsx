import React, { useState } from 'react'
import { ExportOptions, standardRatios, defaultExportOptions, downloadFile } from '../lib/export'
import { useDesignCanvas } from './DesignCanvas'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { canvas } = useDesignCanvas()
  const [format, setFormat] = useState<'png' | 'jpeg' | 'svg' | 'pdf' | 'json' | 'multi'>(defaultExportOptions.format)
  const [quality, setQuality] = useState(defaultExportOptions.quality || 0.9)
  const [transparent, setTransparent] = useState(defaultExportOptions.transparent)
  const [multiplier, setMultiplier] = useState(defaultExportOptions.multiplier || 2)
  const [fileName, setFileName] = useState(defaultExportOptions.fileName || 'pintu-design')
  const [selectedRatios, setSelectedRatios] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  
  if (!isOpen || !canvas) return null

  const handleExport = async () => {
    if (!canvas) return
    
    try {
      setIsExporting(true)
      
      // Build export options
      const options: ExportOptions = {
        format,
        fileName,
        quality,
        multiplier,
        transparent,
      }
      
      // For multi-ratio export, include selected ratios
      if (format === 'multi') {
        options.ratios = standardRatios.filter(ratio => 
          selectedRatios.includes(ratio.name)
        )
        if (options.ratios.length === 0) {
          alert('Please select at least one aspect ratio for multi-ratio export')
          setIsExporting(false)
          return
        }
      }
      
      // Export and download
      const exportResult = await exportCanvas(canvas, options)
      
      if (exportResult) {
        // For formats that return blobs or data URLs
        downloadFile(exportResult, fileName)
        onClose()
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }
  
  // Toggle ratio selection for multi-ratio export
  const toggleRatio = (ratioName: string) => {
    setSelectedRatios(prev => {
      if (prev.includes(ratioName)) {
        return prev.filter(name => name !== ratioName)
      } else {
        return [...prev, ratioName]
      }
    })
  }

  const handleCancel = () => {
    if (!isExporting) {
      onClose()
    }
  }

  // Import the exportCanvas function from the modal to avoid circular dependency
  async function exportCanvas(
    canvas: fabric.Canvas,
    options: ExportOptions
  ): Promise<string | Blob | null> {
    try {
      // Create a temporary cloned canvas for export
      const tempCanvas = document.createElement('canvas')
      const ctx = tempCanvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }
      
      // Set the dimensions
      const width = options.width || canvas.getWidth()
      const height = options.height || canvas.getHeight()
      
      tempCanvas.width = width * (options.multiplier || 1)
      tempCanvas.height = height * (options.multiplier || 1)
      
      // Apply scaling for higher resolution
      ctx.scale(options.multiplier || 1, options.multiplier || 1)
      
      // Fill background if needed
      if (options.format === 'jpeg' || !options.transparent) {
        ctx.fillStyle = options.background || '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
      }
      
      // Export to data URL using Fabric's built-in method
      const exportOptions: fabric.IDataURLOptions = {
        format: options.format === 'jpeg' ? 'jpeg' : 'png',
        quality: options.quality || 0.9,
        multiplier: options.multiplier || 1,
      }
      
      if (options.format === 'multi') {
        // For multi-ratio, create a zip file with all selected ratios
        const zip = new JSZip()
        const ratios = options.ratios || standardRatios
        
        for (const ratio of ratios) {
          // Get data URL for this ratio
          const dataURL = canvas.toDataURL({
            ...exportOptions,
            width: ratio.width,
            height: ratio.height
          })
          
          // Add to ZIP file
          const fileName = `${ratio.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`
          zip.file(fileName, dataURLToBlob(dataURL))
        }
        
        // Generate and return zip file
        return await zip.generateAsync({ type: 'blob' })
      } else if (options.format === 'svg') {
        return canvas.toSVG()
      } else if (options.format === 'pdf') {
        // Simple PDF export (in real implementation, use PDF library)
        const dataURL = canvas.toDataURL(exportOptions)
        return dataURLToBlob(dataURL)
      } else if (options.format === 'json') {
        const json = JSON.stringify(canvas.toJSON(['id', 'name']), null, 2)
        return new Blob([json], { type: 'application/json' })
      } else {
        // PNG or JPEG export
        const dataURL = canvas.toDataURL(exportOptions)
        return dataURLToBlob(dataURL)
      }
    } catch (error) {
      console.error('Export failed:', error)
      return null
    }
  }

  // Helper function to convert data URL to Blob
  function dataURLToBlob(dataURL: string): Blob {
    const parts = dataURL.split(';base64,')
    const contentType = parts[0].split(':')[1]
    const raw = window.atob(parts[1])
    const rawLength = raw.length
    const uInt8Array = new Uint8Array(rawLength)
    
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i)
    }
    
    return new Blob([uInt8Array], { type: contentType })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-secondary-900">Export Design</h2>
          <button
            onClick={handleCancel}
            className="text-secondary-500 hover:text-secondary-700"
            disabled={isExporting}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* File Name */}
        <div className="mb-4">
          <label htmlFor="fileName" className="block text-sm font-medium text-secondary-700 mb-1">
            File Name
          </label>
          <input
            type="text"
            id="fileName"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full border border-secondary-300 rounded-md px-3 py-2 text-secondary-900 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Format Selection */}
        <div className="mb-4">
          <label htmlFor="format" className="block text-sm font-medium text-secondary-700 mb-1">
            Format
          </label>
          <select
            id="format"
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            className="w-full border border-secondary-300 rounded-md px-3 py-2 text-secondary-900 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="png">PNG Image</option>
            <option value="jpeg">JPEG Image</option>
            <option value="svg">SVG Vector</option>
            <option value="pdf">PDF Document</option>
            <option value="json">JSON Project File</option>
            <option value="multi">Multi-Ratio Export (ZIP)</option>
          </select>
        </div>

        {/* Format specific options */}
        {format === 'png' && (
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="transparent"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <label htmlFor="transparent" className="ml-2 block text-sm text-secondary-700">
                Transparent Background
              </label>
            </div>
          </div>
        )}

        {format === 'jpeg' && (
          <div className="mb-4">
            <label htmlFor="quality" className="block text-sm font-medium text-secondary-700 mb-1">
              Quality: {Math.round(quality * 100)}%
            </label>
            <input
              type="range"
              id="quality"
              min="0.1"
              max="1"
              step="0.1"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}

        {/* Scale/Resolution */}
        {(format === 'png' || format === 'jpeg') && (
          <div className="mb-4">
            <label htmlFor="multiplier" className="block text-sm font-medium text-secondary-700 mb-1">
              Resolution: {multiplier}x
            </label>
            <select
              id="multiplier"
              value={multiplier}
              onChange={(e) => setMultiplier(parseFloat(e.target.value))}
              className="w-full border border-secondary-300 rounded-md px-3 py-2 text-secondary-900 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="1">1x (Standard)</option>
              <option value="2">2x (High Resolution)</option>
              <option value="3">3x (Ultra High Resolution)</option>
            </select>
          </div>
        )}

        {/* Multi-ratio selection */}
        {format === 'multi' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Select Aspect Ratios
            </label>
            <div className="border border-secondary-300 rounded-md p-2 max-h-48 overflow-y-auto">
              {standardRatios.map((ratio) => (
                <div key={ratio.name} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`ratio-${ratio.name}`}
                    checked={selectedRatios.includes(ratio.name)}
                    onChange={() => toggleRatio(ratio.name)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                  <label htmlFor={`ratio-${ratio.name}`} className="ml-2 block text-sm text-secondary-700">
                    {ratio.name} ({ratio.width}x{ratio.height})
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={handleCancel}
            className="btn-outline"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="btn-primary flex items-center"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportModal
