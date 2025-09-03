import React, { useState, useEffect } from 'react'
import { fabric } from 'fabric'
import { useDesignCanvas } from './DesignCanvas'

// Types for color palette
interface ColorSwatch {
  color: string;
  rgb: [number, number, number];
  applied: boolean;
}

interface ColorAdjustment {
  hue: number;
  saturation: number;
  brightness: number;
  enabled: boolean;
}

// Helper functions for color transformations
const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

const hexToRgb = (hex: string): [number, number, number] | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null
}

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255
  g /= 255
  b /= 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    
    h /= 6
  }
  
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  h /= 360
  s /= 100
  l /= 100
  
  let r, g, b
  
  if (s === 0) {
    r = g = b = l // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  
  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255)
  ]
}

// Create filter function to apply HSL adjustments to an image
const applyHueSaturationBrightness = (
  image: fabric.Image | null, 
  hue: number, 
  saturation: number, 
  brightness: number,
  enabled: boolean = true
): void => {
  if (!image) return
  
  // Remove existing HSL filters
  const filters = image.filters || []
  const otherFilters = filters.filter(f => (f as any)?.type !== 'ColorMatrix')
  
  if (!enabled) {
    image.filters = otherFilters
    image.applyFilters()
    return
  }
  
  // Create a color matrix filter for HSL adjustments
  // This uses the ColorMatrix filter with matrix values adjusted for HSL
  const colorMatrix = new fabric.Image.filters.ColorMatrix({
    matrix: getHSLMatrix(hue, saturation, brightness)
  })
  
  // Set filter type for identification
  ;(colorMatrix as any).type = 'ColorMatrix'
  
  // Apply the new filter with existing non-HSL filters
  image.filters = [...otherFilters, colorMatrix]
  image.applyFilters()
}

// Helper function to generate HSL adjustment matrix
const getHSLMatrix = (
  hue: number, // -180 to 180
  saturation: number, // -100 to 100
  brightness: number // -100 to 100
): number[] => {
  // Convert to radians
  const h = (hue / 180) * Math.PI
  
  // Normalize saturation and brightness to -1 to 1 range
  const s = saturation / 100
  const b = brightness / 100
  
  // Apply matrix transformations
  const cosH = Math.cos(h)
  const sinH = Math.sin(h)
  
  // Luminance constants
  const lumR = 0.213
  const lumG = 0.715
  const lumB = 0.072
  
  // Saturation adjustment
  const satFactor = saturation >= 0 ? 1 + s : 1 - Math.abs(s)
  
  // Create transformation matrix
  const matrix = [
    lumR + (1 - lumR) * satFactor * cosH + lumR * satFactor * sinH,
    lumG - lumG * satFactor * cosH + lumG * satFactor * sinH,
    lumB - lumB * satFactor * cosH - (1 - lumB) * satFactor * sinH,
    0,
    0,
    
    lumR - lumR * satFactor * cosH - lumR * satFactor * sinH,
    lumG + (1 - lumG) * satFactor * cosH + lumG * satFactor * sinH,
    lumB - lumB * satFactor * cosH + lumB * satFactor * sinH,
    0,
    0,
    
    lumR - lumR * satFactor * cosH + (1 - lumR) * satFactor * sinH,
    lumG - lumG * satFactor * cosH - lumG * satFactor * sinH,
    lumB + (1 - lumB) * satFactor * cosH + lumB * satFactor * sinH,
    0,
    0,
    
    0, 0, 0, 1, 0
  ]
  
  // Apply brightness adjustment
  if (b !== 0) {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const idx = i * 5 + j
        matrix[idx] = b > 0 
          ? matrix[idx] * (1 + b) 
          : matrix[idx] + (1 + b) * (1 - matrix[idx])
      }
    }
  }
  
  return matrix
}

// Main palette component
const Palette: React.FC = () => {
  const { canvas } = useDesignCanvas()
  const [selectedImage, setSelectedImage] = useState<fabric.Image | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [palette, setPalette] = useState<ColorSwatch[]>([])
  const [adjustment, setAdjustment] = useState<ColorAdjustment>({
    hue: 0,
    saturation: 0,
    brightness: 0,
    enabled: false
  })

  // Extract colors from selected image
  useEffect(() => {
    const extractColors = async () => {
      if (!selectedImage || !imageUrl) return
      
      try {
        // Create an img element to use with ColorThief
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        
        img.onload = () => {
          // Get colors from image using color-thief-browser
          try {
            const colorThief = new ColorThief()
            const colors = colorThief.getPalette(img, 5) || []
            
            // Create color swatches
            const swatches = colors.map((rgb): ColorSwatch => ({
              color: rgbToHex(rgb[0], rgb[1], rgb[2]),
              rgb: rgb as [number, number, number],
              applied: false
            }))
            
            setPalette(swatches)
          } catch (error) {
            console.error('Error extracting colors:', error)
          }
        }
        
        img.src = imageUrl
      } catch (error) {
        console.error('Error in color extraction:', error)
      }
    }
    
    extractColors()
  }, [selectedImage, imageUrl])

  // Listen for selection changes on canvas
  useEffect(() => {
    if (!canvas) return
    
    const handleSelectionChange = () => {
      const activeObject = canvas.getActiveObject()
      
      if (activeObject && activeObject.type === 'image') {
        const image = activeObject as fabric.Image
        setSelectedImage(image)
        
        // Get image source URL
        if (image._element) {
          setImageUrl((image._element as HTMLImageElement).src)
        }
        
        // Reset adjustments
        setAdjustment({
          hue: 0,
          saturation: 0,
          brightness: 0,
          enabled: false
        })
      } else {
        setSelectedImage(null)
        setImageUrl('')
        setPalette([])
      }
    }
    
    canvas.on('selection:created', handleSelectionChange)
    canvas.on('selection:updated', handleSelectionChange)
    canvas.on('selection:cleared', handleSelectionChange)
    
    return () => {
      canvas.off('selection:created', handleSelectionChange)
      canvas.off('selection:updated', handleSelectionChange)
      canvas.off('selection:cleared', handleSelectionChange)
    }
  }, [canvas])

  // Apply adjustments to selected image
  useEffect(() => {
    if (selectedImage) {
      applyHueSaturationBrightness(
        selectedImage,
        adjustment.hue,
        adjustment.saturation,
        adjustment.brightness,
        adjustment.enabled
      )
      
      // Render canvas
      if (canvas) {
        canvas.requestRenderAll()
      }
    }
  }, [selectedImage, adjustment, canvas])

  // Update a specific adjustment
  const updateAdjustment = (prop: keyof Omit<ColorAdjustment, 'enabled'>, value: number) => {
    setAdjustment(prev => ({
      ...prev,
      [prop]: value,
      enabled: true
    }))
  }

  // Apply color from swatch
  const applyColorSwatch = (index: number) => {
    if (!selectedImage || index >= palette.length) return
    
    const swatch = palette[index]
    const rgb = swatch.rgb
    
    // Convert selected swatch RGB to HSL
    const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2])
    
    // Set HSL adjustments based on swatch color
    setAdjustment({
      hue: h,
      saturation: s - 50, // Center saturation at 50 to allow both increase/decrease
      brightness: l - 50, // Center brightness at 50 to allow both increase/decrease
      enabled: true
    })
    
    // Mark this swatch as applied
    const newPalette = palette.map((item, i) => ({
      ...item,
      applied: i === index
    }))
    
    setPalette(newPalette)
  }

  // Reset filters
  const resetAdjustments = () => {
    setAdjustment({
      hue: 0,
      saturation: 0,
      brightness: 0,
      enabled: false
    })
    
    // Reset applied state
    setPalette(palette.map(item => ({
      ...item,
      applied: false
    })))
  }

  if (!selectedImage) {
    return (
      <div className="p-4">
        <div className="text-center p-6 bg-secondary-50 rounded-lg border border-dashed border-secondary-300">
          <p className="text-sm text-secondary-600">
            Select an image on the canvas to extract color palette
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-secondary-900 mb-3">
        Color Palette
      </h3>
      
      {/* Color swatches */}
      <div className="flex flex-wrap gap-2 mb-4">
        {palette.map((swatch, index) => (
          <button
            key={index}
            onClick={() => applyColorSwatch(index)}
            className={`w-10 h-10 rounded-lg border shadow-sm transition-all ${
              swatch.applied 
                ? 'ring-2 ring-primary-500 ring-offset-2' 
                : 'hover:scale-110'
            }`}
            style={{ backgroundColor: swatch.color }}
            title={`RGB: ${swatch.rgb.join(', ')}`}
          />
        ))}
        
        {palette.length === 0 && (
          <div className="w-full py-6 text-center text-sm text-secondary-600">
            <svg 
              className="w-6 h-6 mx-auto mb-2 text-secondary-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" 
              />
            </svg>
            Extracting colors...
          </div>
        )}
      </div>
      
      {/* Color adjustments */}
      <div className="space-y-4 border-t border-secondary-200 pt-4">
        <h4 className="text-sm font-medium text-secondary-900">Adjustments</h4>
        
        {/* Hue slider */}
        <div>
          <label className="flex justify-between text-xs text-secondary-600 mb-1">
            <span>Hue</span>
            <span>{adjustment.hue}°</span>
          </label>
          <input
            type="range"
            min="-180"
            max="180"
            value={adjustment.hue}
            onChange={(e) => updateAdjustment('hue', parseInt(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 to-red-500 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        {/* Saturation slider */}
        <div>
          <label className="flex justify-between text-xs text-secondary-600 mb-1">
            <span>Saturation</span>
            <span>{adjustment.saturation}%</span>
          </label>
          <input
            type="range"
            min="-100"
            max="100"
            value={adjustment.saturation}
            onChange={(e) => updateAdjustment('saturation', parseInt(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-gray-400 to-blue-500 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        {/* Brightness slider */}
        <div>
          <label className="flex justify-between text-xs text-secondary-600 mb-1">
            <span>Brightness</span>
            <span>{adjustment.brightness}%</span>
          </label>
          <input
            type="range"
            min="-100"
            max="100"
            value={adjustment.brightness}
            onChange={(e) => updateAdjustment('brightness', parseInt(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-gray-900 to-white rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        {/* Filter toggle */}
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center text-sm text-secondary-700">
            <input
              type="checkbox"
              checked={adjustment.enabled}
              onChange={(e) => setAdjustment({...adjustment, enabled: e.target.checked})}
              className="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500 mr-2"
            />
            Apply color filter
          </label>
          
          <button
            onClick={resetAdjustments}
            className="px-2 py-1 text-xs text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded"
          >
            Reset
          </button>
        </div>
      </div>
      
      {/* Tips */}
      <div className="mt-4 bg-secondary-50 rounded-lg p-3 text-xs text-secondary-500">
        <p>
          Click on a color swatch to apply it as a tint to your image.
          Adjust sliders for fine-tuning. Toggle filter to turn effects on/off.
        </p>
      </div>
    </div>
  )
}

export default Palette

// Export utility functions for use elsewhere
export { 
  applyHueSaturationBrightness, 
  rgbToHex, 
  hexToRgb, 
  rgbToHsl, 
  hslToRgb 
}
