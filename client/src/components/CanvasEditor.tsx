'use client'

import { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import { createWorker } from 'tesseract.js'

interface Layer {
  id: string
  type: string
  name: string
  visible: boolean
  locked: boolean
  object: fabric.Object
}

export default function CanvasEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null)
  const [layers, setLayers] = useState<Layer[]>([])
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)

  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
        enableRetinaScaling: true,
        allowTouchScrolling: false
      })

      // Enable object controls with better defaults
      fabric.Object.prototype.set({
        transparentCorners: false,
        borderColor: '#2196F3',
        cornerColor: '#2196F3',
        cornerSize: 12,
        padding: 5,
        borderScaleFactor: 2,
        cornerStrokeColor: '#2196F3',
        cornerStyle: 'circle'
      })

      // Add selection events
      fabricCanvas.on('selection:created', (e) => {
        setSelectedObject(e.selected?.[0] || null)
      })

      fabricCanvas.on('selection:updated', (e) => {
        setSelectedObject(e.selected?.[0] || null)
      })

      fabricCanvas.on('selection:cleared', () => {
        setSelectedObject(null)
      })

      // Update layers when objects change
      fabricCanvas.on('object:added', updateLayers)
      fabricCanvas.on('object:removed', updateLayers)
      fabricCanvas.on('object:modified', updateLayers)

      // Keyboard shortcuts
      const handleKeyDown = (e: KeyboardEvent) => {
        const activeObject = fabricCanvas.getActiveObject()
        
        // Delete key
        if (e.key === 'Delete' && activeObject) {
          fabricCanvas.remove(activeObject)
          fabricCanvas.renderAll()
          updateLayers()
        }
        
        // Ctrl+D or Cmd+D - Duplicate
        if ((e.ctrlKey || e.metaKey) && e.key === 'd' && activeObject) {
          e.preventDefault()
          activeObject.clone((cloned: fabric.Object) => {
            cloned.set({
              left: (cloned.left || 0) + 10,
              top: (cloned.top || 0) + 10
            })
            Object.assign(cloned, { 
              name: (activeObject as any).name || 'Clone',
              id: `clone-${Date.now()}`
            })
            fabricCanvas.add(cloned)
            fabricCanvas.setActiveObject(cloned)
            fabricCanvas.renderAll()
            updateLayers()
          })
        }
        
        // Ctrl+Z - Undo (placeholder - would need history stack)
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault()
          // TODO: Implement undo/redo functionality
        }
      }

      document.addEventListener('keydown', handleKeyDown)

      setCanvas(fabricCanvas)

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }

    return () => {
      canvas?.dispose()
    }
  }, [])

  const updateLayers = () => {
    if (!canvas) return
    const objects = canvas.getObjects()
    const newLayers: Layer[] = objects.map((obj, index) => ({
      id: obj.id || `layer-${index}`,
      type: obj.type || 'object',
      name: (obj as any).name || `${obj.type} ${index + 1}`,
      visible: obj.visible !== false,
      locked: obj.selectable === false,
      object: obj
    }))
    setLayers(newLayers)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !canvas) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string
      setUploadedImage(imgUrl)

      fabric.Image.fromURL(imgUrl, (img) => {
        // Scale image to fit canvas
        const scale = Math.min(
          (canvas.width || 800) * 0.8 / (img.width || 1),
          (canvas.height || 600) * 0.8 / (img.height || 1)
        )
        
        img.set({
          scaleX: scale,
          scaleY: scale,
          left: (canvas.width || 800) / 2,
          top: (canvas.height || 600) / 2,
          originX: 'center',
          originY: 'center',
          selectable: true,
          hasControls: true,
          hasBorders: true,
          lockUniScaling: false,
          evented: true
        })
        
        Object.assign(img, { name: 'Uploaded Image', id: 'uploaded-img' })
        canvas.add(img)
        canvas.setActiveObject(img)
        canvas.renderAll()
        updateLayers()
      })
    }
    reader.readAsDataURL(file)
  }

  // Preprocess image to improve OCR accuracy
  const preprocessImageForOCR = async (imageDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        // Create a canvas for preprocessing
        const preprocessCanvas = document.createElement('canvas')
        const ctx = preprocessCanvas.getContext('2d')
        if (!ctx) {
          resolve(imageDataUrl)
          return
        }

        preprocessCanvas.width = img.width
        preprocessCanvas.height = img.height
        
        // Draw the image
        ctx.drawImage(img, 0, 0)
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, preprocessCanvas.width, preprocessCanvas.height)
        const data = imageData.data
        
        // Convert to grayscale and increase contrast
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale using luminosity method
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          
          // Increase contrast
          const contrast = 1.5
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
          const contrastedGray = factor * (gray - 128) + 128
          
          // Apply threshold to make it more binary (black/white)
          const threshold = 128
          const finalValue = contrastedGray > threshold ? 255 : 0
          
          data[i] = finalValue     // Red
          data[i + 1] = finalValue // Green
          data[i + 2] = finalValue // Blue
          // Alpha channel (data[i + 3]) remains unchanged
        }
        
        // Put the processed image data back
        ctx.putImageData(imageData, 0, 0)
        
        // Convert to data URL
        resolve(preprocessCanvas.toDataURL())
      }
      img.src = imageDataUrl
    })
  }

  const extractTextFromImage = async () => {
    console.log('Extract text called. Canvas:', !!canvas, 'UploadedImage:', !!uploadedImage)
    
    if (!uploadedImage || !canvas) {
      alert('Please upload an image first!')
      return
    }
    
    setIsProcessing(true)
    setOcrProgress(0)

    try {
      // Find the uploaded image object on canvas
      const uploadedImageObj = canvas.getObjects().find((obj: any) => obj.id === 'uploaded-img')
      console.log('Found uploaded image on canvas:', !!uploadedImageObj)
      
      if (!uploadedImageObj) {
        alert('Please upload an image first!')
        setIsProcessing(false)
        return
      }

      const imgElement = uploadedImageObj as fabric.Image
      
      // Get the actual HTMLImageElement to access natural dimensions
      const imgEl = imgElement.getElement() as HTMLImageElement
      const naturalWidth = imgEl.naturalWidth || imgEl.width || imgElement.width || 0
      const naturalHeight = imgEl.naturalHeight || imgEl.height || imgElement.height || 0
      
      // Get image's actual position and size on canvas
      const imgLeft = imgElement.left || 0
      const imgTop = imgElement.top || 0
      const imgScaleX = imgElement.scaleX || 1
      const imgScaleY = imgElement.scaleY || 1
      
      // Calculate actual rendered size
      const renderedWidth = naturalWidth * imgScaleX
      const renderedHeight = naturalHeight * imgScaleY
      
      // Calculate top-left corner (since origin is center)
      const imgTopLeft = {
        x: imgLeft - (renderedWidth / 2),
        y: imgTop - (renderedHeight / 2)
      }

      console.log('Image info:', {
        natural: { width: naturalWidth, height: naturalHeight },
        fabric: { width: imgElement.width, height: imgElement.height },
        left: imgLeft,
        top: imgTop,
        scaleX: imgScaleX,
        scaleY: imgScaleY,
        renderedWidth,
        renderedHeight,
        topLeft: imgTopLeft
      })

      // Preprocess the image for better OCR results
      console.log('Preprocessing image for OCR...')
      const preprocessedImage = await preprocessImageForOCR(uploadedImage)
      
      console.log('Creating Tesseract worker...')
      const worker = await createWorker('eng', 1, {
        logger: (m: any) => {
          console.log('Tesseract progress:', m)
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100))
          }
        }
      })

      console.log('Worker created, starting OCR recognition...')
      const { data } = await worker.recognize(preprocessedImage)
      console.log('OCR complete. Full data:', data)
      console.log('Lines found:', data.lines?.length || 0)
      console.log('Words data:', data.words)
      console.log('Text found:', data.text)
      
      // Get lines and words from OCR result
      const lines = (data as any).lines || []
      const words = (data as any).words || []
      let wordCount = 0
      
      console.log('Processing words array...', words.length)
      
      // Try words array first (more reliable for positioning)
      if (words.length > 0) {
        words.forEach((word: any, wordIndex: number) => {
          console.log(`Word ${wordIndex}: "${word.text}", confidence: ${word.confidence}, bbox:`, word.bbox)
          
          // Lower confidence threshold to 20 to catch more text (like Sejda)
          if (word.text.trim() && word.confidence > 20 && word.bbox) {
            const bbox = word.bbox
            
            // Calculate the scaling factor from natural image to rendered image
            const scaleFactorX = renderedWidth / naturalWidth
            const scaleFactorY = renderedHeight / naturalHeight
            
            // Calculate text position on canvas
            // OCR bbox is relative to natural image dimensions
            const textLeft = imgTopLeft.x + (bbox.x0 * scaleFactorX)
            const textTop = imgTopLeft.y + (bbox.y0 * scaleFactorY)
            const textWidth = (bbox.x1 - bbox.x0) * scaleFactorX
            const textHeight = (bbox.y1 - bbox.y0) * scaleFactorY
            
            // Calculate font size based on bbox height (with 85% factor for better fit)
            // Professional editors use 0.8-0.9 of bbox height
            const fontSize = Math.max(Math.round(textHeight * 0.85), 10)
            
            console.log(`Positioning word "${word.text}":`, {
              bbox,
              position: { textLeft, textTop },
              size: { textWidth, textHeight },
              fontSize,
              confidence: word.confidence
            })
            
            // Create text object with professional styling
            const textObj = new fabric.IText(word.text, {
              left: textLeft,
              top: textTop,
              fontSize: fontSize,
              fill: '#2563EB', // Professional blue color
              stroke: '#FFFFFF', // White outline for contrast
              strokeWidth: 0.3,
              editable: true,
              selectable: true,
              fontFamily: 'Arial',
              fontWeight: 'normal',
              // Semi-transparent white background (like Sejda/PDFfiller)
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: 4,
              // Subtle shadow for depth (like professional editors)
              shadow: new fabric.Shadow({
                color: 'rgba(0, 0, 0, 0.15)',
                blur: 2,
                offsetX: 1,
                offsetY: 1
              }),
              // Proper corner control styling
              cornerColor: '#2563EB',
              cornerSize: 8,
              cornerStyle: 'circle',
              borderColor: '#2563EB',
              // Rotation control
              hasRotatingPoint: true,
              transparentCorners: false
            })
            
            // Add metadata (confidence, original bbox, etc.)
            Object.assign(textObj, { 
              name: `OCR: ${word.text} (${Math.round(word.confidence)}%)`, 
              id: `ocr-${Date.now()}-${wordIndex}`,
              ocrConfidence: word.confidence,
              ocrBbox: bbox,
              layerType: 'ocr-text'
            })
            
            canvas.add(textObj)
            wordCount++
          }
        })
        
        if (wordCount > 0) {
          canvas.renderAll()
          updateLayers()
          alert(`✅ Extracted ${wordCount} words!\n\n📍 Text positioned exactly at source locations\n✏️ Double-click any text to edit in-place\n🎨 Drag, resize, or rotate text elements\n👁️ Toggle "Show/Hide Image" for better editing\n\n💡 Tip: Text has confidence scores - low confidence words were filtered`)
        }
      }
      
      // Fallback to lines if words array didn't work
      if (wordCount === 0 && lines.length > 0) {
        console.log('Falling back to lines array...', lines.length)
        lines.forEach((line: any, lineIndex: number) => {
          const lineWords = line.words || []
          console.log(`Line ${lineIndex}:`, lineWords.length, 'words')
          
          lineWords.forEach((word: any) => {
            console.log(`Word: "${word.text}", confidence: ${word.confidence}, bbox:`, word.bbox)
            
            // Lower confidence threshold to 20 to catch more text
            if (word.text.trim() && word.confidence > 20 && word.bbox) {
              const bbox = word.bbox
              
              // Calculate the scaling factor from natural image to rendered image
              const scaleFactorX = renderedWidth / naturalWidth
              const scaleFactorY = renderedHeight / naturalHeight
              
              // Calculate text position on canvas
              const textLeft = imgTopLeft.x + (bbox.x0 * scaleFactorX)
              const textTop = imgTopLeft.y + (bbox.y0 * scaleFactorY)
              const textWidth = (bbox.x1 - bbox.x0) * scaleFactorX
              const textHeight = (bbox.y1 - bbox.y0) * scaleFactorY
              
              const fontSize = Math.max(Math.round(textHeight * 0.85), 10)
              
              console.log(`Positioning word "${word.text}":`, {
                bbox,
                position: { textLeft, textTop },
                size: { textWidth, textHeight },
                fontSize
              })
              
              const textObj = new fabric.IText(word.text, {
                left: textLeft,
                top: textTop,
                fontSize: fontSize,
                fill: '#2563EB',
                stroke: '#FFFFFF',
                strokeWidth: 0.3,
                editable: true,
                selectable: true,
                fontFamily: 'Arial',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: 4,
                shadow: new fabric.Shadow({
                  color: 'rgba(0, 0, 0, 0.15)',
                  blur: 2,
                  offsetX: 1,
                  offsetY: 1
                }),
                cornerColor: '#2563EB',
                cornerSize: 8,
                cornerStyle: 'circle',
                borderColor: '#2563EB',
                hasRotatingPoint: true,
                transparentCorners: false
              })
              Object.assign(textObj, { 
                name: `OCR: ${word.text} (${Math.round(word.confidence)}%)`, 
                id: `ocr-${Date.now()}-${Math.random()}`,
                ocrConfidence: word.confidence,
                ocrBbox: bbox,
                layerType: 'ocr-text'
              })
              canvas.add(textObj)
              wordCount++
            }
          })
        })
        
        if (wordCount > 0) {
          canvas.renderAll()
          updateLayers()
          alert(`✓ Extracted ${wordCount} words!\n\nText positioned at exact locations.\nDouble-click any text to edit.\n\nTip: Click "Show/Hide Image" to see text better.`)
        }
      }
      
      // If still no words positioned, show the detected text
      if (wordCount === 0) {
        // Check if there's any text at all
        const rawText = data.text?.trim() || ''
        console.log('Raw OCR text:', rawText)
        
        if (rawText) {
          alert(`⚠️ Found text but couldn't position it accurately.\n\nDetected text:\n${rawText.substring(0, 200)}...\n\nTry:\n- Image with clearer text\n- Higher resolution image\n- Better contrast between text and background`)
        } else {
          alert('❌ No text found in the image.\n\nTips:\n- Ensure image has clear, readable text\n- Try higher contrast images\n- Make sure text is not too small\n- Use images with horizontal text\n\nDebug: Check browser console for details')
        }
      }

      await worker.terminate()
      setIsProcessing(false)
      setOcrProgress(0)
    } catch (error) {
      console.error('OCR Error:', error)
      setIsProcessing(false)
      setOcrProgress(0)
      alert('Failed to extract text.\n\nError: ' + error)
    }
  }

  const hideOriginalImage = () => {
    if (!canvas) return
    const uploadedImageObj = canvas.getObjects().find((obj: any) => obj.id === 'uploaded-img')
    if (uploadedImageObj) {
      uploadedImageObj.set('opacity', uploadedImageObj.opacity === 1 ? 0.2 : 1)
      canvas.renderAll()
    }
  }

  const triggerImageUpload = () => {
    fileInputRef.current?.click()
  }

  const addText = () => {
    if (!canvas) return
    const text = new fabric.IText('Double-click to edit', {
      left: 50,
      top: 50,
      fontSize: 24,
      fill: '#000000',
      editable: true,
      selectable: true,
      fontFamily: 'Arial',
      textAlign: 'left'
    })
    Object.assign(text, { name: 'Text', id: `text-${Date.now()}` })
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
  }

  const addTextBox = () => {
    if (!canvas) return
    const textbox = new fabric.Textbox('Click to edit this text box', {
      left: 50,
      top: 50,
      width: 200,
      fontSize: 18,
      fill: '#000000',
      editable: true,
      selectable: true,
      fontFamily: 'Arial',
      textAlign: 'left',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      padding: 10
    })
    Object.assign(textbox, { name: 'Text Box', id: `textbox-${Date.now()}` })
    canvas.add(textbox)
    canvas.setActiveObject(textbox)
    canvas.renderAll()
  }

  const addRectangle = () => {
    if (!canvas) return
    const rect = new fabric.Rect({
      left: 50,
      top: 50,
      width: 100,
      height: 100,
      fill: '#3498db',
      selectable: true,
      hasControls: true,
      hasBorders: true
    })
    Object.assign(rect, { name: 'Rectangle', id: `rect-${Date.now()}` })
    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.renderAll()
  }

  const addCircle = () => {
    if (!canvas) return
    const circle = new fabric.Circle({
      left: 50,
      top: 50,
      radius: 50,
      fill: '#e74c3c',
      selectable: true,
      hasControls: true,
      hasBorders: true
    })
    Object.assign(circle, { name: 'Circle', id: `circle-${Date.now()}` })
    canvas.add(circle)
    canvas.setActiveObject(circle)
    canvas.renderAll()
  }

  const deleteSelected = () => {
    if (!canvas || !selectedObject) return
    canvas.remove(selectedObject)
    canvas.renderAll()
    updateLayers()
  }

  const duplicateSelected = () => {
    if (!canvas || !selectedObject) return
    selectedObject.clone((cloned: fabric.Object) => {
      cloned.set({
        left: (cloned.left || 0) + 10,
        top: (cloned.top || 0) + 10
      })
      Object.assign(cloned, { 
        name: (selectedObject as any).name || 'Clone',
        id: `clone-${Date.now()}`
      })
      canvas.add(cloned)
      canvas.setActiveObject(cloned)
      canvas.renderAll()
      updateLayers()
    })
  }

  const toggleLayerVisibility = (layer: Layer) => {
    layer.object.set('visible', !layer.visible)
    canvas?.renderAll()
    updateLayers()
  }

  const toggleLayerLock = (layer: Layer) => {
    layer.object.set('selectable', layer.locked)
    canvas?.renderAll()
    updateLayers()
  }

  const selectLayer = (layer: Layer) => {
    if (!canvas) return
    canvas.setActiveObject(layer.object)
    canvas.renderAll()
  }

  const bringForward = () => {
    if (!canvas || !selectedObject) return
    canvas.bringForward(selectedObject)
    canvas.renderAll()
    updateLayers()
  }

  const sendBackward = () => {
    if (!canvas || !selectedObject) return
    canvas.sendBackwards(selectedObject)
    canvas.renderAll()
    updateLayers()
  }

  const applyFilter = (filterType: string) => {
    if (!canvas || !selectedObject || selectedObject.type !== 'image') return
    
    const imgObject = selectedObject as fabric.Image
    imgObject.filters = []
    
    switch (filterType) {
      case 'grayscale':
        imgObject.filters.push(new fabric.Image.filters.Grayscale())
        break
      case 'sepia':
        imgObject.filters.push(new fabric.Image.filters.Sepia())
        break
      case 'brightness':
        imgObject.filters.push(new fabric.Image.filters.Brightness({ brightness: 0.2 }))
        break
      case 'contrast':
        imgObject.filters.push(new fabric.Image.filters.Contrast({ contrast: 0.3 }))
        break
      case 'blur':
        imgObject.filters.push(new fabric.Image.filters.Blur({ blur: 0.3 }))
        break
      case 'invert':
        imgObject.filters.push(new fabric.Image.filters.Invert())
        break
      case 'none':
        imgObject.filters = []
        break
    }
    
    imgObject.applyFilters()
    canvas.renderAll()
  }

  const cropImage = () => {
    if (!canvas || !selectedObject || selectedObject.type !== 'image') return
    
    const imgObject = selectedObject as fabric.Image
    const left = imgObject.left || 0
    const top = imgObject.top || 0
    const width = (imgObject.width || 0) * (imgObject.scaleX || 1)
    const height = (imgObject.height || 0) * (imgObject.scaleY || 1)
    
    // Create crop rect overlay
    const cropRect = new fabric.Rect({
      left: left,
      top: top,
      width: width * 0.8,
      height: height * 0.8,
      fill: 'transparent',
      stroke: '#FF0000',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: true
    })
    
    canvas.add(cropRect)
    canvas.setActiveObject(cropRect)
    canvas.renderAll()
  }

  const exportPNG = () => {
    if (!canvas) return
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1
    })
    const link = document.createElement('a')
    link.download = 'design.png'
    link.href = dataURL
    link.click()
  }

  const exportJPEG = () => {
    if (!canvas) return
    const dataURL = canvas.toDataURL({
      format: 'jpeg',
      quality: 0.9
    })
    const link = document.createElement('a')
    link.download = 'design.jpg'
    link.href = dataURL
    link.click()
  }

  const exportPDF = async () => {
    if (!canvas) return
    
    // Dynamic import to reduce bundle size
    const { jsPDF } = await import('jspdf')
    
    const imgData = canvas.toDataURL({
      format: 'png',
      quality: 1
    })
    
    const canvasWidth = canvas.width || 800
    const canvasHeight = canvas.height || 600
    
    // Calculate PDF dimensions (A4 or custom based on canvas aspect ratio)
    const pdf = new jsPDF({
      orientation: canvasWidth > canvasHeight ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvasWidth, canvasHeight]
    })
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvasWidth, canvasHeight)
    pdf.save('design.pdf')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Left Toolbar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-3 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Tools</h2>
        
        {/* Upload Section */}
        <div className="border-b pb-3 mb-3">
          <button
            onClick={triggerImageUpload}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 font-medium mb-2"
          >
            📤 Upload Image
          </button>

          {uploadedImage && (
            <>
              <button
                onClick={extractTextFromImage}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 font-medium mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? `🔍 Extracting... ${ocrProgress}%` : '🔍 Extract Text (OCR)'}
              </button>
              
              <button
                onClick={hideOriginalImage}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 font-medium text-sm"
              >
                👁️ Show/Hide Image
              </button>
            </>
          )}
        </div>

        {/* Add Elements */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Add Elements</h3>
          
          <button
            onClick={addText}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            ✏️ Add Text
          </button>

          <button
            onClick={addTextBox}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
          >
            📝 Add Text Box
          </button>

          <button
            onClick={addRectangle}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
          >
            ⬜ Add Rectangle
          </button>

          <button
            onClick={addCircle}
            className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm"
          >
            ⚫ Add Circle
          </button>
        </div>

        {/* Edit Actions */}
        <div className="border-t pt-3 space-y-2">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Edit</h3>
          
          <button
            onClick={duplicateSelected}
            disabled={!selectedObject}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            📋 Duplicate
          </button>

          <button
            onClick={bringForward}
            disabled={!selectedObject}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            ⬆️ Bring Forward
          </button>

          <button
            onClick={sendBackward}
            disabled={!selectedObject}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            ⬇️ Send Backward
          </button>

          <button
            onClick={deleteSelected}
            disabled={!selectedObject}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            🗑️ Delete
          </button>
        </div>

        {/* Export Section */}
        <div className="border-t pt-3 mt-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Export As</h3>
          
          <button
            onClick={exportPNG}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 mb-2 text-sm"
          >
            📥 Export PNG
          </button>

          <button
            onClick={exportJPEG}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 mb-2 text-sm"
          >
            📥 Export JPEG
          </button>

          <button
            onClick={exportPDF}
            className="w-full bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 text-sm"
          >
            📥 Export PDF
          </button>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="border-t pt-3 mt-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Shortcuts</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Delete</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded">Del</kbd>
            </div>
            <div className="flex justify-between">
              <span>Duplicate</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded">Ctrl+D</kbd>
            </div>
            <div className="flex justify-between">
              <span>Edit Text</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded">Dbl-Click</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-8">
        <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Right Panel - Properties & Layers */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        {/* Properties Section */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Properties</h2>
          
          {selectedObject ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Type</label>
                <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">{selectedObject.type}</p>
              </div>
              
              {selectedObject.type === 'text' || selectedObject.type === 'i-text' || selectedObject.type === 'textbox' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Text</label>
                    <textarea
                      value={(selectedObject as fabric.IText).text}
                      onChange={(e) => {
                        (selectedObject as fabric.IText).set('text', e.target.value)
                        canvas?.renderAll()
                        updateLayers()
                      }}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter text..."
                    />
                    <p className="text-xs text-gray-500 mt-1">💡 Or double-click text on canvas to edit</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Font Family</label>
                    <select
                      value={(selectedObject as fabric.IText).fontFamily}
                      onChange={(e) => {
                        (selectedObject as fabric.IText).set('fontFamily', e.target.value)
                        canvas?.renderAll()
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Impact">Impact</option>
                      <option value="Comic Sans MS">Comic Sans MS</option>
                      <option value="Tahoma">Tahoma</option>
                      <option value="Trebuchet MS">Trebuchet MS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Text Alignment</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          (selectedObject as fabric.IText).set('textAlign', 'left')
                          canvas?.renderAll()
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                          (selectedObject as fabric.IText).textAlign === 'left'
                            ? 'bg-blue-500 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        ⬅️
                      </button>
                      <button
                        onClick={() => {
                          (selectedObject as fabric.IText).set('textAlign', 'center')
                          canvas?.renderAll()
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                          (selectedObject as fabric.IText).textAlign === 'center'
                            ? 'bg-blue-500 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        ↔️
                      </button>
                      <button
                        onClick={() => {
                          (selectedObject as fabric.IText).set('textAlign', 'right')
                          canvas?.renderAll()
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                          (selectedObject as fabric.IText).textAlign === 'right'
                            ? 'bg-blue-500 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        ➡️
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Font Size</label>
                    <input
                      type="number"
                      value={(selectedObject as fabric.IText).fontSize}
                      onChange={(e) => {
                        (selectedObject as fabric.IText).set('fontSize', parseInt(e.target.value))
                        canvas?.renderAll()
                      }}
                      min="8"
                      max="200"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Text Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={(selectedObject as fabric.IText).fill as string}
                        onChange={(e) => {
                          (selectedObject as fabric.IText).set('fill', e.target.value)
                          canvas?.renderAll()
                        }}
                        className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={(selectedObject as fabric.IText).fill as string}
                        onChange={(e) => {
                          (selectedObject as fabric.IText).set('fill', e.target.value)
                          canvas?.renderAll()
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const isBold = (selectedObject as fabric.IText).fontWeight === 'bold'
                        ;(selectedObject as fabric.IText).set('fontWeight', isBold ? 'normal' : 'bold')
                        canvas?.renderAll()
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg border ${
                        (selectedObject as fabric.IText).fontWeight === 'bold'
                          ? 'bg-blue-500 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      onClick={() => {
                        const isItalic = (selectedObject as fabric.IText).fontStyle === 'italic'
                        ;(selectedObject as fabric.IText).set('fontStyle', isItalic ? 'normal' : 'italic')
                        canvas?.renderAll()
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg border ${
                        (selectedObject as fabric.IText).fontStyle === 'italic'
                          ? 'bg-blue-500 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <em>I</em>
                    </button>
                    <button
                      onClick={() => {
                        const hasUnderline = (selectedObject as fabric.IText).underline
                        ;(selectedObject as fabric.IText).set('underline', !hasUnderline)
                        canvas?.renderAll()
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg border ${
                        (selectedObject as fabric.IText).underline
                          ? 'bg-blue-500 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <u>U</u>
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Text Background</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={String((selectedObject as fabric.IText).backgroundColor || '#ffffff')}
                        onChange={(e) => {
                          (selectedObject as fabric.IText).set('backgroundColor', e.target.value)
                          canvas?.renderAll()
                        }}
                        className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <button
                        onClick={() => {
                          (selectedObject as fabric.IText).set('backgroundColor', '')
                          canvas?.renderAll()
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        Remove BG
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Text Shadow</label>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          const hasShadow = (selectedObject as fabric.IText).shadow
                          if (hasShadow) {
                            (selectedObject as fabric.IText).set('shadow', undefined)
                          } else {
                            (selectedObject as fabric.IText).set('shadow', new fabric.Shadow({
                              color: 'rgba(0,0,0,0.3)',
                              blur: 10,
                              offsetX: 5,
                              offsetY: 5
                            }))
                          }
                          canvas?.renderAll()
                        }}
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${
                          (selectedObject as fabric.IText).shadow
                            ? 'bg-blue-500 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {(selectedObject as fabric.IText).shadow ? '✓ Shadow On' : 'Add Shadow'}
                      </button>
                    </div>
                  </div>
                </>
              ) : null}

              {selectedObject.type === 'rect' || selectedObject.type === 'circle' ? (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Fill Color</label>
                  <input
                    type="color"
                    value={selectedObject.fill as string}
                    onChange={(e) => {
                      selectedObject.set('fill', e.target.value)
                      canvas?.renderAll()
                    }}
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
              ) : null}

              {selectedObject.type === 'image' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Image Filters</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => applyFilter('none')}
                        className="px-3 py-2 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                      >
                        None
                      </button>
                      <button
                        onClick={() => applyFilter('grayscale')}
                        className="px-3 py-2 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                      >
                        Grayscale
                      </button>
                      <button
                        onClick={() => applyFilter('sepia')}
                        className="px-3 py-2 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                      >
                        Sepia
                      </button>
                      <button
                        onClick={() => applyFilter('brightness')}
                        className="px-3 py-2 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                      >
                        Bright
                      </button>
                      <button
                        onClick={() => applyFilter('contrast')}
                        className="px-3 py-2 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                      >
                        Contrast
                      </button>
                      <button
                        onClick={() => applyFilter('blur')}
                        className="px-3 py-2 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                      >
                        Blur
                      </button>
                      <button
                        onClick={() => applyFilter('invert')}
                        className="px-3 py-2 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                      >
                        Invert
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={cropImage}
                    className="w-full px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                  >
                    ✂️ Crop Image
                  </button>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Width</label>
                  <input
                    type="number"
                    value={Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1))}
                    onChange={(e) => {
                      const newWidth = parseInt(e.target.value)
                      selectedObject.set('scaleX', newWidth / (selectedObject.width || 1))
                      canvas?.renderAll()
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Height</label>
                  <input
                    type="number"
                    value={Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1))}
                    onChange={(e) => {
                      const newHeight = parseInt(e.target.value)
                      selectedObject.set('scaleY', newHeight / (selectedObject.height || 1))
                      canvas?.renderAll()
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Rotation</label>
                <input
                  type="number"
                  value={Math.round(selectedObject.angle || 0)}
                  onChange={(e) => {
                    selectedObject.set('angle', parseInt(e.target.value))
                    canvas?.renderAll()
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Opacity</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(selectedObject.opacity || 1) * 100}
                    onChange={(e) => {
                      selectedObject.set('opacity', parseInt(e.target.value) / 100)
                      canvas?.renderAll()
                    }}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {Math.round((selectedObject.opacity || 1) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Select an object to edit properties</p>
          )}
        </div>

        {/* Layers Section */}
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Layers ({layers.length})</h2>
          
          {layers.length > 0 ? (
            <div className="space-y-2">
              {layers.slice().reverse().map((layer) => (
                <div
                  key={layer.id}
                  onClick={() => selectLayer(layer)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedObject === layer.object
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{layer.name}</span>
                      <span className="text-xs text-gray-500">({layer.type})</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleLayerVisibility(layer)
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title={layer.visible ? 'Hide' : 'Show'}
                      >
                        {layer.visible ? '👁️' : '🙈'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleLayerLock(layer)
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title={layer.locked ? 'Unlock' : 'Lock'}
                      >
                        {layer.locked ? '🔒' : '🔓'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No layers yet. Upload an image or add elements!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
