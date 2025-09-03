import React, { useState, useEffect, useCallback } from 'react'
import { fabric } from 'fabric'
import { useDesignCanvas } from './DesignCanvas'
import Palette from './Palette'
import { debounce } from '../lib/utils'
import { fontApi, FontDetectionResult, handleApiError } from '../lib/api'
import { canvasUtils } from '../lib/canvas'
import { fontOptions } from './FontPreviewPanel'

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

interface FontDetectionState {
  active: boolean;
  results: FontDetectionResult | null;
}

const PropertiesPanel: React.FC = () => {
  const { canvas } = useDesignCanvas();
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null)
  const [objectType, setObjectType] = useState<string>('text')
  const [isImage, setIsImage] = useState<boolean>(false)
  const [isText, setIsText] = useState<boolean>(false)
  const [detectingFont, setDetectingFont] = useState<boolean>(false)
  const [fontDetection, setFontDetection] = useState<FontDetectionState>({
    active: false,
    results: null
  })
  const [properties, setProperties] = useState<{
    // Position & Size
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    
    // Text Properties
    text: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    
    // Appearance
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    opacity: number;
    
    // Effects
    blur: number;
    shadow: boolean;
    shadowColor: string;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;

    // HSL adjustments for images
    hslEnabled: boolean;
    hue: number;
    saturation: number;
    brightness: number;
  }>({
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
    
    // HSL adjustments for images
    hslEnabled: false,
    hue: 0,
    saturation: 0,
    brightness: 0,
  })
  
  // Create a debounced update function to prevent excessive updates
  const debouncedUpdateObject = useCallback(
    debounce((obj: fabric.Object, props: Record<string, any>) => {
      if (!canvas || !obj) return;
      
      obj.set(props);
      canvas.requestRenderAll();
      
      // Trigger object:modified event for history
      canvas.fire('object:modified', { target: obj });
    }, 100),
    [canvas]
  );

  // Listen for object selection changes
  useEffect(() => {
    if (!canvas) return
    
    const handleSelection = () => {
      const activeObject = canvas.getActiveObject()
      
      if (!activeObject) {
        setSelectedObject(null);
        setObjectType('');
        setIsImage(false);
        setIsText(false);
        return;
      }
      
      setSelectedObject(activeObject);
      const type = activeObject.type || 'object';
      setObjectType(type);
      setIsImage(type === 'image');
      setIsText(type === 'text' || type === 'textbox' || type === 'i-text');
      
      // Update properties based on selected object
      updatePropertiesFromObject(activeObject);
    }
    
    // Also listen for text editing changes to keep properties panel in sync
    const handleTextEditing = (e: any) => {
      const textObj = e.target;
      if (textObj && (textObj.type === 'text' || textObj.type === 'textbox' || textObj.type === 'i-text')) {
        updatePropertiesFromObject(textObj);
      }
    }
    
    canvas.on('selection:created', handleSelection)
    canvas.on('selection:updated', handleSelection)
    canvas.on('selection:cleared', handleSelection)
    canvas.on('text:changed', handleTextEditing)
    canvas.on('text:editing:entered', handleTextEditing)
    canvas.on('text:editing:exited', handleTextEditing)
    
    // Check if there's already a selected object
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      handleSelection();
    }
    
    return () => {
      canvas.off('selection:created', handleSelection)
      canvas.off('selection:updated', handleSelection)
      canvas.off('selection:cleared', handleSelection)
      canvas.off('text:changed', handleTextEditing)
      canvas.off('text:editing:entered', handleTextEditing)
      canvas.off('text:editing:exited', handleTextEditing)
    }
  }, [canvas])

  // Update properties state based on selected object
  const updatePropertiesFromObject = (obj: fabric.Object) => {
    if (!obj) return;

    const newProps: any = {
      // Position & Size
      x: Math.round(obj.left || 0),
      y: Math.round(obj.top || 0),
      width: Math.round(obj.getScaledWidth() || 0),
      height: Math.round(obj.getScaledHeight() || 0),
      rotation: Math.round(obj.angle || 0),
      
      // Appearance
      fillColor: obj.fill as string || '#000000',
      strokeColor: obj.stroke as string || '#000000',
      strokeWidth: obj.strokeWidth || 0,
      opacity: Math.round((obj.opacity || 1) * 100),
      
      // HSL properties for images
      hue: 0,
      saturation: 0,
      brightness: 0,
      hslEnabled: false,
    };
    
    // Text-specific properties
    if (isText) {
      const textObj = obj as fabric.Text;
      newProps.text = textObj.text || '';
      newProps.fontSize = textObj.fontSize || 24;
      newProps.fontFamily = textObj.fontFamily || 'Arial';
      newProps.fontWeight = textObj.fontWeight || 'normal';
    }
    
    // Shadow properties
    if (obj.shadow) {
      const shadow = obj.shadow as fabric.Shadow;
      newProps.shadow = true;
      newProps.shadowColor = shadow.color || '#000000';
      newProps.shadowBlur = shadow.blur || 4;
      newProps.shadowOffsetX = shadow.offsetX || 2;
      newProps.shadowOffsetY = shadow.offsetY || 2;
    } else {
      newProps.shadow = false;
    }
    
    // Image filter properties
    if (isImage) {
      const imgObj = obj as fabric.Image;
      const filters = imgObj.filters || [];
      
      // Find blur filter if exists
      const blurFilter = filters.find((f: any) => f instanceof fabric.Image.filters.Blur) as fabric.Image.filters.Blur | undefined;
      newProps.blur = blurFilter ? blurFilter.blur * 10 : 0; // Scale up for better slider range
      
      // Find HSL filters if they exist
      const hueFilter = filters.find((f: any) => f instanceof fabric.Image.filters.HueRotation) as fabric.Image.filters.HueRotation | undefined;
      const saturationFilter = filters.find((f: any) => f instanceof fabric.Image.filters.Saturation) as fabric.Image.filters.Saturation | undefined;
      const brightnessFilter = filters.find((f: any) => f instanceof fabric.Image.filters.Brightness) as fabric.Image.filters.Brightness | undefined;
      
      newProps.hslEnabled = !!(hueFilter || saturationFilter || brightnessFilter);
      newProps.hue = hueFilter ? Math.round((hueFilter.rotation || 0) * 180 / Math.PI) : 0; // Convert radians to degrees
      newProps.saturation = saturationFilter ? Math.round((saturationFilter.saturation - 1) * 100) : 0; // Convert to percentage
      newProps.brightness = brightnessFilter ? Math.round(brightnessFilter.brightness * 100) : 0; // Convert to percentage
    }
    
    setProperties(prev => ({ ...prev, ...newProps }));
  };

  // Detect font from text object
  const detectFont = async () => {
    if (!selectedObject || !isText || !canvas) return;
    
    try {
      setDetectingFont(true);
      
      // Use canvasUtils to capture the text object as an image
      const imageFile = await canvasUtils.captureObjectAsImage(selectedObject, 'png', 20);
      
      // Send image to API for font detection
      const results = await fontApi.detectFont(imageFile);
      
      // Show results
      setFontDetection({
        active: true,
        results
      });
      
    } catch (error) {
      console.error('Font detection error:', error);
      alert('Error detecting font: ' + handleApiError(error));
    } finally {
      setDetectingFont(false);
    }
  };
  
  // Update object property and fabric canvas
  const updateProperty = (key: string, value: any) => {
    // Sanitize numeric values to prevent NaN issues
    if (typeof value === 'number' || !isNaN(Number(value))) {
      value = sanitizeNumeric(value);
    }
    
    setProperties(prev => ({ ...prev, [key]: value }));
    
    if (!selectedObject || !canvas) return;
    
    // Map property keys to fabric object properties
    const updates: Record<string, any> = {};
    
    switch(key) {
      case 'x':
        updates.left = value;
        break;
      case 'y':
        updates.top = value;
        break;
      case 'width':
        // Keep aspect ratio if shift key is pressed (would need UI for this option)
        const scaleX = value / (selectedObject.getScaledWidth() || 1);
        updates.scaleX = scaleX;
        break;
      case 'height':
        const scaleY = value / (selectedObject.getScaledHeight() || 1);
        updates.scaleY = scaleY;
        break;
      case 'rotation':
        updates.angle = value;
        break;
      case 'fillColor':
        updates.fill = value;
        break;
      case 'strokeColor':
        updates.stroke = value;
        break;
      case 'strokeWidth':
        updates.strokeWidth = value;
        break;
      case 'opacity':
        updates.opacity = value / 100;
        break;
      case 'text':
        if (isText) {
          updates.text = value;
        }
        break;
      case 'fontSize':
        if (isText) {
          updates.fontSize = value;
        }
        break;
      case 'fontFamily':
        if (isText) {
          updates.fontFamily = value;
        }
        break;
      case 'fontWeight':
        if (isText) {
          updates.fontWeight = value;
        }
        break;
      case 'blur':
        if (isImage) {
          // Apply blur filter to image
          applyBlurFilter(selectedObject as fabric.Image, value);
          return; // Skip debounced update as we're handling it separately
        }
        break;
      case 'hslEnabled':
      case 'hue':
      case 'saturation':
      case 'brightness':
        if (isImage) {
          applyHSLFilter();
          return; // Skip debounced update
        }
        break;
      case 'shadow':
        applyShadow();
        return; // Skip debounced update
      case 'shadowColor':
      case 'shadowBlur':
      case 'shadowOffsetX':
      case 'shadowOffsetY':
        applyShadow();
        return; // Skip debounced update
    }
    
    // Apply updates with debouncing
    debouncedUpdateObject(selectedObject, updates);
  };
  
  // Apply blur filter to image
  const applyBlurFilter = (imgObj: fabric.Image, blurValue: number) => {
    if (!canvas || !imgObj) return;
    
    // Remove existing blur filter
    const filters = imgObj.filters || [];
    const newFilters = filters.filter((f: any) => !(f instanceof fabric.Image.filters.Blur));
    
    // Add new blur filter if value > 0
    if (blurValue > 0) {
      newFilters.push(new fabric.Image.filters.Blur({
        blur: blurValue / 10 // Scale down for fabric.js (0-1 range)
      }));
    }
    
    imgObj.filters = newFilters;
    
    // Apply filters and render
    imgObj.applyFilters();
    canvas.requestRenderAll();
    
    // Trigger object:modified event for history
    canvas.fire('object:modified', { target: imgObj });
  };
  
  // Apply shadow to object
  const applyShadow = () => {
    if (!canvas || !selectedObject) return;
    
    const { shadow, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY } = properties;
    
    if (shadow) {
      selectedObject.set('shadow', new fabric.Shadow({
        color: shadowColor,
        blur: shadowBlur,
        offsetX: shadowOffsetX,
        offsetY: shadowOffsetY
      }));
    } else {
      selectedObject.set('shadow', null);
    }
    
    canvas.requestRenderAll();
    canvas.fire('object:modified', { target: selectedObject });
  };
  
  /**
   * Ensures numeric values are valid numbers to prevent NaN issues
   * @param value - Value to sanitize
   * @param defaultValue - Default value if invalid
   */
  const sanitizeNumeric = (value: any, defaultValue = 0): number => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };
  
  // Apply HSL filters to image
  const applyHSLFilter = () => {
    if (!canvas || !selectedObject || !isImage) return;
    
    const imgObj = selectedObject as fabric.Image;
    const { hslEnabled } = properties;
    
    // Sanitize HSL values to prevent NaN issues
    const hue = sanitizeNumeric(properties.hue);
    const saturation = sanitizeNumeric(properties.saturation);
    const brightness = sanitizeNumeric(properties.brightness);
    
    // Get existing filters without HSL ones
    const filters = imgObj.filters || [];
    const newFilters = filters.filter((f: any) => 
      !(f instanceof fabric.Image.filters.HueRotation) && 
      !(f instanceof fabric.Image.filters.Saturation) && 
      !(f instanceof fabric.Image.filters.Brightness)
    );
    
    // Add new HSL filters if enabled
    if (hslEnabled) {
      // Add hue filter if not zero
      if (hue !== 0) {
        // Convert degrees to radians for fabric.js
        const hueRadians = (hue / 180) * Math.PI;
        newFilters.push(new fabric.Image.filters.HueRotation({
          rotation: hueRadians
        }));
      }
      
      // Add saturation filter if not zero
      if (saturation !== 0) {
        // Convert from percentage (-100 to 100) to fabric's range (0 to 2)
        // where 0 is grayscale, 1 is normal, 2 is oversaturated
        const saturationValue = 1 + (saturation / 100);
        newFilters.push(new fabric.Image.filters.Saturation({
          saturation: saturationValue
        }));
      }
      
      // Add brightness filter if not zero
      if (brightness !== 0) {
        // Convert from percentage (-100 to 100) to fabric's range (-1 to 1)
        const brightnessValue = brightness / 100;
        newFilters.push(new fabric.Image.filters.Brightness({
          brightness: brightnessValue
        }));
      }
    }
    
    // Apply filters
    imgObj.filters = newFilters;
    imgObj.applyFilters();
    canvas.requestRenderAll();
    canvas.fire('object:modified', { target: imgObj });
  };

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
        <p className="text-sm text-secondary-600 capitalize">{isImage ? 'Image' : isText ? 'Text' : 'Object'}</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Color Palette - only shown for image objects */}
        {isImage && (
          <section>
            <h4 className="text-sm font-semibold text-secondary-900 mb-3">Color Palette</h4>
            <Palette />
          </section>
        )}
        
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
        {isText && (
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
                <div className="flex justify-between items-center mb-1">
                  <label className="label">Font Family</label>
                  {isText && (
                    <button
                      onClick={() => detectFont()}
                      className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center"
                      disabled={detectingFont}
                    >
                      {detectingFont ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Detecting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Detect Font
                        </>
                      )}
                    </button>
                  )}
                </div>
                <select
                  value={properties.fontFamily}
                  onChange={(e) => updateProperty('fontFamily', e.target.value)}
                  className="input"
                  style={{ fontFamily: properties.fontFamily }}
                >
                  {/* Standard system fonts */}
                  <optgroup label="System Fonts">
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Courier New">Courier New</option>
                  </optgroup>
                  
                  {/* Google fonts */}
                  <optgroup label="Google Fonts">
                    {fontOptions.map(font => (
                      <option key={font.family} value={font.family} style={{ fontFamily: font.family }}>
                        {font.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                
                {fontDetection.active && (
                  <div className="mt-2 p-3 bg-primary-50 border border-primary-200 rounded-md">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-primary-800">Font Detection Results</h4>
                      <button 
                        onClick={() => setFontDetection({active: false, results: null})}
                        className="text-xs text-primary-600 hover:text-primary-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {fontDetection.results ? (
                      <>
                        <p className="text-xs text-secondary-600 mb-2">
                          Detected category: <span className="font-medium">{fontDetection.results.category}</span>
                        </p>
                        <p className="text-xs font-medium text-secondary-800 mb-1">Suggestions:</p>
                        <div className="space-y-2">
                          {fontDetection.results.suggestions.map((font, idx) => {
                            // Find the font option with matching name
                            const fontOption = fontOptions.find(
                              f => f.name === font || f.family === font
                            );
                            
                            return (
                              <button
                                key={idx}
                                className="flex items-center justify-between w-full p-2 border border-primary-200 hover:border-primary-400 rounded bg-white text-left"
                                onClick={() => {
                                  if (fontOption) {
                                    updateProperty('fontFamily', fontOption.family);
                                  } else {
                                    updateProperty('fontFamily', font);
                                  }
                                }}
                              >
                                <span 
                                  style={{ 
                                    fontFamily: fontOption?.family || font 
                                  }} 
                                  className="text-sm"
                                >
                                  {font}
                                </span>
                                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-2">
                        <div className="animate-spin inline-block w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                  </div>
                )}
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

              {/* Text-specific border/outline controls */}
              <div className="pt-2 border-t border-secondary-100">
                <h5 className="text-xs font-medium text-secondary-700 mb-2">Text Outline</h5>
                <ColorPicker
                  label="Outline Color"
                  value={properties.strokeColor}
                  onChange={(color) => updateProperty('strokeColor', color)}
                />
                <Slider
                  label="Outline Width"
                  value={properties.strokeWidth}
                  min={0}
                  max={5}
                  step={0.1}
                  unit="px"
                  onChange={(value) => updateProperty('strokeWidth', value)}
                />
              </div>
            </div>
          </section>
        )}

        {/* Appearance */}
        <section>
          <h4 className="text-sm font-semibold text-secondary-900 mb-3">Appearance</h4>
          <div className="space-y-3">
            {!isText && (
              <>
                <ColorPicker
                  label="Fill Color"
                  value={properties.fillColor}
                  onChange={(color) => updateProperty('fillColor', color)}
                />
                {!isImage && (
                  <>
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
                  </>
                )}
              </>
            )}
            
            {/* Opacity slider for all object types */}
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
            {/* Image specific effects */}
            {isImage && (
              <>
                <Slider
                  label="Blur"
                  value={properties.blur}
                  min={0}
                  max={20}
                  unit="px"
                  onChange={(value) => updateProperty('blur', value)}
                />
                
                {/* HSL Adjustments */}
                <div className="mt-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={properties.hslEnabled}
                      onChange={(e) => updateProperty('hslEnabled', e.target.checked)}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-secondary-700">HSL Adjustment</span>
                  </label>
                </div>

                {properties.hslEnabled && (
                  <div className="space-y-3 pl-6 border-l-2 border-secondary-200">
                    <Slider
                      label="Hue"
                      value={properties.hue}
                      min={-180}
                      max={180}
                      unit="°"
                      onChange={(value) => updateProperty('hue', value)}
                    />
                    <Slider
                      label="Saturation"
                      value={properties.saturation}
                      min={-100}
                      max={100}
                      unit="%"
                      onChange={(value) => updateProperty('saturation', value)}
                    />
                    <Slider
                      label="Brightness"
                      value={properties.brightness}
                      min={-100}
                      max={100}
                      unit="%"
                      onChange={(value) => updateProperty('brightness', value)}
                    />
                    <button
                      onClick={() => {
                        updateProperty('hue', 0);
                        updateProperty('saturation', 0);
                        updateProperty('brightness', 0);
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700 hover:underline mt-1"
                    >
                      Reset adjustments
                    </button>
                  </div>
                )}
              </>
            )}
            
            {/* Shadow for all object types */}
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
              onClick={() => {
                if (!canvas || !selectedObject) return;
                
                // Clone the selected object
                selectedObject.clone((cloned: fabric.Object) => {
                  if (!canvas) return;
                  
                  // Offset the cloned object slightly
                  cloned.set({
                    left: (selectedObject.left || 0) + 10,
                    top: (selectedObject.top || 0) + 10,
                    evented: true,
                    id: `${objectType}_${Date.now()}`,
                    name: `${objectType} copy`
                  });
                  
                  // If it's an IText, ensure it's properly set up
                  if (isText && cloned instanceof fabric.IText) {
                    cloned.set({
                      editable: true,
                      cursorColor: '#4F46E5',
                      cursorWidth: 2,
                      cursorDuration: 600,
                      selectionColor: 'rgba(79, 70, 229, 0.3)'
                    });
                  }
                  
                  canvas.add(cloned);
                  canvas.setActiveObject(cloned);
                  canvas.requestRenderAll();
                });
              }}
              className="btn-outline w-full justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Duplicate
            </button>
            <button
              onClick={() => {
                if (!canvas || !selectedObject) return;
                canvas.remove(selectedObject);
                canvas.requestRenderAll();
              }}
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
              onClick={() => {
                if (!canvas || !selectedObject) return;
                selectedObject.bringToFront();
                canvas.requestRenderAll();
                canvas.fire('object:modified', { target: selectedObject });
              }}
              className="btn-outline text-xs justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Front
            </button>
            <button
              onClick={() => {
                if (!canvas || !selectedObject) return;
                selectedObject.sendToBack();
                canvas.requestRenderAll();
                canvas.fire('object:modified', { target: selectedObject });
              }}
              className="btn-outline text-xs justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3 3m0 0l3-3m-3 3V8" />
              </svg>
              Back
            </button>
            <button
              onClick={() => {
                if (!canvas || !selectedObject) return;
                selectedObject.bringForward();
                canvas.requestRenderAll();
                canvas.fire('object:modified', { target: selectedObject });
              }}
              className="btn-outline text-xs justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Forward
            </button>
            <button
              onClick={() => {
                if (!canvas || !selectedObject) return;
                selectedObject.sendBackwards();
                canvas.requestRenderAll();
                canvas.fire('object:modified', { target: selectedObject });
              }}
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
