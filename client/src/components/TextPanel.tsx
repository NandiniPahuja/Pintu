import React, { useState, useEffect } from 'react'
import { useDesignCanvas } from './DesignCanvas'
import FontPreviewPanel, { fontOptions } from './FontPreviewPanel'

// Text presets with styling options
interface TextPreset {
  name: string;
  type: 'heading' | 'subheading' | 'body' | 'caption';
  fontSize: number;
  fontWeight: string | number;
  fontStyle: string;
  lineHeight: number;
  letterSpacing: number;
  textAlign: string;
}

const textPresets: TextPreset[] = [
  {
    name: 'Heading 1',
    type: 'heading',
    fontSize: 36,
    fontWeight: 700,
    fontStyle: 'normal',
    lineHeight: 1.2,
    letterSpacing: 0,
    textAlign: 'left'
  },
  {
    name: 'Heading 2',
    type: 'heading',
    fontSize: 28,
    fontWeight: 700,
    fontStyle: 'normal',
    lineHeight: 1.3,
    letterSpacing: 0,
    textAlign: 'left'
  },
  {
    name: 'Subheading',
    type: 'subheading',
    fontSize: 20,
    fontWeight: 600,
    fontStyle: 'normal',
    lineHeight: 1.4,
    letterSpacing: 0,
    textAlign: 'left'
  },
  {
    name: 'Body',
    type: 'body',
    fontSize: 16,
    fontWeight: 400,
    fontStyle: 'normal',
    lineHeight: 1.5,
    letterSpacing: 0,
    textAlign: 'left'
  },
  {
    name: 'Caption',
    type: 'caption',
    fontSize: 12,
    fontWeight: 400,
    fontStyle: 'normal',
    lineHeight: 1.5,
    letterSpacing: 0.5,
    textAlign: 'left'
  },
  {
    name: 'Quote',
    type: 'body',
    fontSize: 18,
    fontWeight: 400,
    fontStyle: 'italic',
    lineHeight: 1.6,
    letterSpacing: 0,
    textAlign: 'center'
  }
]

// Interface for text settings
interface TextSettings {
  fontFamily: string;
  fontSize: number;
  fontWeight: string | number;
  fontStyle: string;
  color: string;
  lineHeight: number;
  letterSpacing: number;
  textAlign: string;
  text: string;
}

// Local storage key
const TEXT_SETTINGS_STORAGE_KEY = 'pintu-text-settings';

// Color palette for quick selection
const colorPalette = [
  '#000000', '#FFFFFF', '#F44336', '#E91E63', 
  '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
  '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
  '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107',
  '#FF9800', '#FF5722', '#795548', '#607D8B'
];

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-secondary-700 mb-1">{label}</label>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 rounded border border-secondary-300 shadow-sm"
          style={{ backgroundColor: value }}
          aria-label={`Pick a color, current color: ${value}`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          placeholder="#000000"
        />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 p-3 bg-white rounded-md shadow-lg border border-secondary-200">
          <div className="grid grid-cols-5 gap-1 mb-2">
            {colorPalette.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color);
                  setIsOpen(false);
                }}
                className="w-6 h-6 rounded-sm border border-secondary-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                aria-label={`Select color: ${color}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TextPanel: React.FC = () => {
  const { canvas, addText } = useDesignCanvas();
  
  // State to toggle font preview panel
  const [showFontPanel, setShowFontPanel] = useState(false);
  
  // State for text settings with default values
  const [textSettings, setTextSettings] = useState<TextSettings>({
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: 400,
    fontStyle: 'normal',
    color: '#000000',
    lineHeight: 1.5,
    letterSpacing: 0,
    textAlign: 'left',
    text: 'Double click to edit'
  });

  // Load saved settings from local storage
  useEffect(() => {
    const savedSettings = localStorage.getItem(TEXT_SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setTextSettings(prev => ({...prev, ...parsedSettings}));
      } catch (error) {
        console.error('Failed to parse saved text settings', error);
      }
    }
  }, []);

  // Save settings to local storage when they change
  useEffect(() => {
    localStorage.setItem(TEXT_SETTINGS_STORAGE_KEY, JSON.stringify(textSettings));
  }, [textSettings]);

  // Load the selected font
  useEffect(() => {
    const loadFont = async () => {
      const selectedFont = fontOptions.find(f => f.family === textSettings.fontFamily);
      if (selectedFont) {
        try {
          await import(`@fontsource/${selectedFont.importName}`);
          console.log(`Loaded font: ${selectedFont.name}`);
        } catch (error) {
          console.error(`Error loading font ${selectedFont.name}:`, error);
        }
      }
    };
    
    loadFont();
  }, [textSettings.fontFamily]);

  // Update a specific setting
  const updateSetting = <K extends keyof TextSettings>(key: K, value: TextSettings[K]) => {
    setTextSettings(prev => ({ ...prev, [key]: value }));
  };

  // Apply preset to current settings
  const applyPreset = (preset: TextPreset) => {
    setTextSettings(prev => ({
      ...prev,
      fontSize: preset.fontSize,
      fontWeight: preset.fontWeight,
      fontStyle: preset.fontStyle,
      lineHeight: preset.lineHeight,
      letterSpacing: preset.letterSpacing,
      textAlign: preset.textAlign
    }));
  };

  // Add text to canvas with current settings
  const addTextWithCurrentSettings = () => {
    if (!canvas) return;
    
    const { fontFamily, fontSize, fontWeight, fontStyle, color, lineHeight, letterSpacing, textAlign, text } = textSettings;
    
    addText(text, {
      fontFamily,
      fontSize,
      fontWeight: fontWeight.toString(),
      fontStyle,
      fill: color,
      lineHeight,
      charSpacing: letterSpacing * 100, // Convert to fabric.js units
      textAlign: textAlign as any, // 'left' | 'center' | 'right' | 'justify'
      editable: true
    });
  };

  return (
    <div className="p-4 space-y-6 overflow-y-auto">
      {/* Text presets */}
      <section>
        <h3 className="text-sm font-semibold text-secondary-900 mb-3">Text Presets</h3>
        <div className="grid grid-cols-2 gap-2">
          {textPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="p-3 text-left border border-secondary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
              style={{ 
                fontFamily: textSettings.fontFamily,
                lineHeight: preset.lineHeight
              }}
            >
              <div 
                className={`font-${preset.fontWeight} text-secondary-900`}
                style={{ 
                  fontSize: `${preset.fontSize / 2}px`,
                  fontStyle: preset.fontStyle,
                  letterSpacing: `${preset.letterSpacing}px`
                }}
              >
                {preset.name}
              </div>
              <div className="text-xs text-secondary-500 mt-1">
                {preset.fontSize}px
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Add text button */}
      <section>
        <button
          onClick={addTextWithCurrentSettings}
          className="w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
        >
          Add Text to Canvas
        </button>
      </section>

      {/* Text input */}
      <section>
        <label htmlFor="text-content" className="block text-sm font-medium text-secondary-700 mb-1">
          Text Content
        </label>
        <textarea
          id="text-content"
          value={textSettings.text}
          onChange={(e) => updateSetting('text', e.target.value)}
          className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          rows={3}
        />
      </section>

      {/* Font family selection */}
      <section>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="font-family" className="block text-sm font-medium text-secondary-700">
            Font Family
          </label>
          <button 
            onClick={() => setShowFontPanel(prev => !prev)}
            className="text-xs text-primary-600 hover:text-primary-800 font-medium"
          >
            {showFontPanel ? 'Close Font Panel' : 'Browse All Fonts'}
          </button>
        </div>
        
        {showFontPanel ? (
          <div className="bg-white rounded-lg shadow-lg border border-secondary-200 mt-2">
            <FontPreviewPanel 
              onSelectFont={(family) => {
                updateSetting('fontFamily', family);
                setShowFontPanel(false);
              }}
              selectedFontFamily={textSettings.fontFamily}
            />
          </div>
        ) : (
          <div className="relative">
            <select
              id="font-family"
              value={textSettings.fontFamily}
              onChange={(e) => updateSetting('fontFamily', e.target.value)}
              className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-preview"
              style={{ fontFamily: textSettings.fontFamily }}
            >
              {fontOptions.map((font) => (
                <option key={font.name} value={font.family} style={{ fontFamily: font.family }}>
                  {font.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="h-5 w-5 text-secondary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </section>

      {/* Text appearance */}
      <section>
        <h3 className="text-sm font-semibold text-secondary-900 mb-3">Appearance</h3>
        
        <div className="space-y-3">
          {/* Font size */}
          <div>
            <label htmlFor="font-size" className="block text-sm font-medium text-secondary-700 mb-1">
              Font Size ({textSettings.fontSize}px)
            </label>
            <input
              id="font-size"
              type="range"
              min="8"
              max="144"
              value={textSettings.fontSize}
              onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
              className="block w-full"
            />
          </div>

          {/* Color picker */}
          <ColorPicker
            label="Color"
            value={textSettings.color}
            onChange={(color) => updateSetting('color', color)}
          />

          {/* Text alignment */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Alignment
            </label>
            <div className="flex border border-secondary-300 rounded-md divide-x divide-secondary-300 overflow-hidden">
              {['left', 'center', 'right', 'justify'].map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => updateSetting('textAlign', align)}
                  className={`flex-1 py-1.5 transition-colors ${
                    textSettings.textAlign === align
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-white text-secondary-700 hover:bg-secondary-50'
                  }`}
                  aria-label={`Align text ${align}`}
                >
                  {align === 'left' && (
                    <svg className="mx-auto w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h8" />
                    </svg>
                  )}
                  {align === 'center' && (
                    <svg className="mx-auto w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M6 12h12M8 18h8" />
                    </svg>
                  )}
                  {align === 'right' && (
                    <svg className="mx-auto w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M12 18h8" />
                    </svg>
                  )}
                  {align === 'justify' && (
                    <svg className="mx-auto w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Font style and weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="font-weight" className="block text-sm font-medium text-secondary-700 mb-1">
                Weight
              </label>
              <select
                id="font-weight"
                value={textSettings.fontWeight}
                onChange={(e) => updateSetting('fontWeight', e.target.value)}
                className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="400">Regular (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semibold (600)</option>
                <option value="700">Bold (700)</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="font-style" className="block text-sm font-medium text-secondary-700 mb-1">
                Style
              </label>
              <select
                id="font-style"
                value={textSettings.fontStyle}
                onChange={(e) => updateSetting('fontStyle', e.target.value)}
                className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
              </select>
            </div>
          </div>
          
          {/* Line height and letter spacing */}
          <div>
            <label htmlFor="line-height" className="block text-sm font-medium text-secondary-700 mb-1">
              Line Height ({textSettings.lineHeight})
            </label>
            <input
              id="line-height"
              type="range"
              min="0.8"
              max="3"
              step="0.1"
              value={textSettings.lineHeight}
              onChange={(e) => updateSetting('lineHeight', Number(e.target.value))}
              className="block w-full"
            />
          </div>
          
          <div>
            <label htmlFor="letter-spacing" className="block text-sm font-medium text-secondary-700 mb-1">
              Letter Spacing ({textSettings.letterSpacing}px)
            </label>
            <input
              id="letter-spacing"
              type="range"
              min="-3"
              max="10"
              step="0.5"
              value={textSettings.letterSpacing}
              onChange={(e) => updateSetting('letterSpacing', Number(e.target.value))}
              className="block w-full"
            />
          </div>
        </div>
      </section>
      
      {/* Preview section */}
      <section>
        <h3 className="text-sm font-semibold text-secondary-900 mb-3">Preview</h3>
        <div
          className="p-4 border border-secondary-300 rounded-lg min-h-[100px] whitespace-pre-wrap"
          style={{
            fontFamily: textSettings.fontFamily,
            fontSize: `${textSettings.fontSize}px`,
            fontWeight: textSettings.fontWeight,
            fontStyle: textSettings.fontStyle,
            color: textSettings.color,
            lineHeight: textSettings.lineHeight,
            letterSpacing: `${textSettings.letterSpacing}px`,
            textAlign: textSettings.textAlign as 'left' | 'center' | 'right' | 'justify'
          }}
        >
          {textSettings.text || 'Type something to preview here'}
        </div>
      </section>
    </div>
  );
};

export default TextPanel;
