import { fabric } from 'fabric'
import ColorThief from 'color-thief-browser'
import { get, set, del } from 'idb-keyval'

// Canvas utility types
export interface CanvasState {
  json: string
  timestamp: number
  version: string
}

export interface CanvasConfig {
  width: number
  height: number
  backgroundColor: string
}

// Default canvas configuration
export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  width: 800,
  height: 600,
  backgroundColor: '#ffffff',
}

// Canvas utilities class
export class CanvasUtils {
  private canvas: fabric.Canvas | null = null
  private colorThief: ColorThief
  
  constructor() {
    this.colorThief = new ColorThief()
  }
  
  // Initialize canvas
  initCanvas(canvasElement: HTMLCanvasElement, config: CanvasConfig = DEFAULT_CANVAS_CONFIG): fabric.Canvas {
    this.canvas = new fabric.Canvas(canvasElement, {
      width: config.width,
      height: config.height,
      backgroundColor: config.backgroundColor,
      selection: true,
      preserveObjectStacking: true,
    })
    
    return this.canvas
  }
  
  // Get canvas instance
  getCanvas(): fabric.Canvas | null {
    return this.canvas
  }
  
  // Resize canvas
  resizeCanvas(width: number, height: number): void {
    if (!this.canvas) return
    
    this.canvas.setWidth(width)
    this.canvas.setHeight(height)
    this.canvas.renderAll()
  }
  
  // Clear canvas
  clearCanvas(): void {
    if (!this.canvas) return
    
    this.canvas.clear()
    this.canvas.backgroundColor = DEFAULT_CANVAS_CONFIG.backgroundColor
    this.canvas.renderAll()
  }
  
  // Save canvas state to JSON
  saveCanvasState(): string {
    if (!this.canvas) return ''
    
    return JSON.stringify(this.canvas.toJSON(['selectable', 'evented']))
  }
  
  // Load canvas state from JSON
  loadCanvasState(jsonString: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.canvas || !jsonString) {
        reject(new Error('Canvas not initialized or invalid JSON'))
        return
      }
      
      try {
        this.canvas.loadFromJSON(jsonString, () => {
          this.canvas!.renderAll()
          resolve()
        })
      } catch (error) {
        reject(error)
      }
    })
  }
  
  // Add image to canvas
  addImage(imageUrl: string, options: Partial<fabric.IImageOptions> = {}): Promise<fabric.Image> {
    return new Promise((resolve, reject) => {
      if (!this.canvas) {
        reject(new Error('Canvas not initialized'))
        return
      }
      
      fabric.Image.fromURL(imageUrl, (img) => {
        if (!img) {
          reject(new Error('Failed to load image'))
          return
        }
        
        // Set default options
        img.set({
          left: 100,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5,
          ...options,
        })
        
        this.canvas!.add(img)
        this.canvas!.renderAll()
        resolve(img)
      })
    })
  }
  
  // Add text to canvas
  addText(text: string, options: Partial<fabric.ITextOptions> = {}): fabric.Text {
    if (!this.canvas) {
      throw new Error('Canvas not initialized')
    }
    
    const textObject = new fabric.Text(text, {
      left: 100,
      top: 100,
      fontSize: 24,
      fill: '#000000',
      fontFamily: 'Arial',
      ...options,
    })
    
    this.canvas.add(textObject)
    this.canvas.renderAll()
    
    return textObject
  }
  
  // Add rectangle
  addRectangle(options: Partial<fabric.IRectOptions> = {}): fabric.Rect {
    if (!this.canvas) {
      throw new Error('Canvas not initialized')
    }
    
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: '#ff0000',
      ...options,
    })
    
    this.canvas.add(rect)
    this.canvas.renderAll()
    
    return rect
  }
  
  // Add circle
  addCircle(options: Partial<fabric.ICircleOptions> = {}): fabric.Circle {
    if (!this.canvas) {
      throw new Error('Canvas not initialized')
    }
    
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: '#00ff00',
      ...options,
    })
    
    this.canvas.add(circle)
    this.canvas.renderAll()
    
    return circle
  }
  
  // Delete selected objects
  deleteSelected(): void {
    if (!this.canvas) return
    
    const activeObjects = this.canvas.getActiveObjects()
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => this.canvas!.remove(obj))
      this.canvas.discardActiveObject()
      this.canvas.renderAll()
    }
  }
  
  // Clone selected object
  cloneSelected(): void {
    if (!this.canvas) return
    
    const activeObject = this.canvas.getActiveObject()
    if (activeObject) {
      activeObject.clone((cloned: fabric.Object) => {
        cloned.set({
          left: cloned.left! + 10,
          top: cloned.top! + 10,
        })
        this.canvas!.add(cloned)
        this.canvas!.setActiveObject(cloned)
        this.canvas!.renderAll()
      })
    }
  }
  
  // Extract colors from image
  extractColors(imageElement: HTMLImageElement, count: number = 5): number[][] {
    try {
      const palette = this.colorThief.getPalette(imageElement, count)
      return palette || []
    } catch (error) {
      console.error('Error extracting colors:', error)
      return []
    }
  }
  
  // Get dominant color from image
  getDominantColor(imageElement: HTMLImageElement): number[] | null {
    try {
      return this.colorThief.getColor(imageElement)
    } catch (error) {
      console.error('Error getting dominant color:', error)
      return null
    }
  }
  
  // Export canvas as image
  exportAsImage(format: string = 'png', quality: number = 1): string {
    if (!this.canvas) return ''
    
    return this.canvas.toDataURL({
      format,
      quality,
    })
  }
  
  // Export canvas as SVG
  exportAsSVG(): string {
    if (!this.canvas) return ''
    
    return this.canvas.toSVG()
  }
  
  // Zoom functions
  zoomIn(factor: number = 1.1): void {
    if (!this.canvas) return
    
    const zoom = this.canvas.getZoom()
    this.canvas.setZoom(zoom * factor)
  }
  
  zoomOut(factor: number = 0.9): void {
    if (!this.canvas) return
    
    const zoom = this.canvas.getZoom()
    this.canvas.setZoom(zoom * factor)
  }
  
  resetZoom(): void {
    if (!this.canvas) return
    
    this.canvas.setZoom(1)
    this.canvas.viewportTransform = [1, 0, 0, 1, 0, 0]
    this.canvas.renderAll()
  }
  
  // Undo/Redo functionality (basic implementation)
  private history: string[] = []
  private historyIndex: number = -1
  
  saveHistory(): void {
    if (!this.canvas) return
    
    const state = this.saveCanvasState()
    this.history = this.history.slice(0, this.historyIndex + 1)
    this.history.push(state)
    this.historyIndex = this.history.length - 1
    
    // Limit history to 50 states
    if (this.history.length > 50) {
      this.history.shift()
      this.historyIndex--
    }
  }
  
  undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--
      const state = this.history[this.historyIndex]
      this.loadCanvasState(state)
    }
  }
  
  redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++
      const state = this.history[this.historyIndex]
      this.loadCanvasState(state)
    }
  }
  
  clearHistory(): void {
    this.history = []
    this.historyIndex = -1
  }
  
  // Storage utilities using idb-keyval
  async saveToStorage(key: string, state?: string): Promise<void> {
    const data: CanvasState = {
      json: state || this.saveCanvasState(),
      timestamp: Date.now(),
      version: '1.0.0',
    }
    
    await set(key, data)
  }
  
  async loadFromStorage(key: string): Promise<void> {
    const data: CanvasState | undefined = await get(key)
    if (data && data.json) {
      await this.loadCanvasState(data.json)
    }
  }
  
  async deleteFromStorage(key: string): Promise<void> {
    await del(key)
  }
  
  // Cleanup
  dispose(): void {
    if (this.canvas) {
      this.canvas.dispose()
      this.canvas = null
    }
    this.clearHistory()
  }
}

// RGB to Hex converter
export const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

// Hex to RGB converter
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

// Create a singleton instance
export const canvasUtils = new CanvasUtils()
