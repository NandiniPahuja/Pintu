import React, { useState, useEffect } from 'react'

// Font family options with corresponding @fontsource packages
export interface FontOption {
  name: string;
  family: string;
  importName: string;
  category: 'serif' | 'sans-serif' | 'monospace' | 'display';
  weights: number[];
  styles?: ('normal' | 'italic')[];
}

export const fontOptions: FontOption[] = [
  { name: 'Inter', family: 'Inter', importName: 'inter', category: 'sans-serif', weights: [400, 500, 600, 700], styles: ['normal'] },
  { name: 'Poppins', family: 'Poppins', importName: 'poppins', category: 'sans-serif', weights: [400, 500, 600, 700], styles: ['normal', 'italic'] },
  { name: 'Roboto', family: 'Roboto', importName: 'roboto', category: 'sans-serif', weights: [400, 500, 700], styles: ['normal', 'italic'] },
  { name: 'Open Sans', family: 'Open Sans', importName: 'open-sans', category: 'sans-serif', weights: [400, 600, 700], styles: ['normal', 'italic'] },
  { name: 'Montserrat', family: 'Montserrat', importName: 'montserrat', category: 'sans-serif', weights: [400, 500, 600, 700], styles: ['normal', 'italic'] },
  { name: 'Raleway', family: 'Raleway', importName: 'raleway', category: 'sans-serif', weights: [400, 500, 600, 700], styles: ['normal', 'italic'] },
  { name: 'Source Sans Pro', family: 'Source Sans Pro', importName: 'source-sans-pro', category: 'sans-serif', weights: [400, 600, 700], styles: ['normal', 'italic'] },
  { name: 'Playfair Display', family: 'Playfair Display', importName: 'playfair-display', category: 'serif', weights: [400, 500, 600, 700], styles: ['normal', 'italic'] },
  { name: 'Merriweather', family: 'Merriweather', importName: 'merriweather', category: 'serif', weights: [400, 700], styles: ['normal', 'italic'] },
  { name: 'Lora', family: 'Lora', importName: 'lora', category: 'serif', weights: [400, 500, 600, 700], styles: ['normal', 'italic'] },
  { name: 'Oswald', family: 'Oswald', importName: 'oswald', category: 'sans-serif', weights: [400, 500, 600, 700], styles: ['normal'] },
  { name: 'Roboto Mono', family: 'Roboto Mono', importName: 'roboto-mono', category: 'monospace', weights: [400, 500, 700], styles: ['normal', 'italic'] },
]

interface FontPreviewCardProps {
  font: FontOption;
  onClick: () => void;
  isSelected: boolean;
  sampleText: string;
}

const FontPreviewCard: React.FC<FontPreviewCardProps> = ({ 
  font, 
  onClick, 
  isSelected, 
  sampleText 
}) => {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    const loadFont = async () => {
      try {
        await import(`@fontsource/${font.importName}`);
        setLoaded(true);
      } catch (error) {
        console.error(`Error loading font ${font.name}:`, error);
      }
    };
    
    loadFont();
  }, [font.importName, font.name]);
  
  return (
    <button
      className={`w-full text-left p-3 rounded-lg transition-all ${
        isSelected 
          ? 'bg-primary-50 border-2 border-primary-500 shadow-sm' 
          : 'border border-secondary-200 hover:border-primary-300 hover:shadow-sm'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-sm text-secondary-900">{font.name}</h4>
        <span className="text-xs text-secondary-500">{font.category}</span>
      </div>
      
      <div 
        className={`text-xl mb-1 truncate transition-opacity ${loaded ? 'opacity-100' : 'opacity-30'}`}
        style={{ 
          fontFamily: font.family,
          fontWeight: 400,
        }}
      >
        {sampleText}
      </div>
      
      <div className="flex items-center space-x-2">
        {font.weights.includes(400) && (
          <span 
            className={`text-xs transition-opacity ${loaded ? 'opacity-100' : 'opacity-30'}`}
            style={{ 
              fontFamily: font.family,
              fontWeight: 400,
            }}
          >
            Aa
          </span>
        )}
        
        {font.weights.includes(700) && (
          <span 
            className={`text-xs transition-opacity ${loaded ? 'opacity-100' : 'opacity-30'}`}
            style={{ 
              fontFamily: font.family,
              fontWeight: 700,
            }}
          >
            Aa
          </span>
        )}
        
        {font.styles?.includes('italic') && (
          <span 
            className={`text-xs transition-opacity ${loaded ? 'opacity-100' : 'opacity-30'}`}
            style={{ 
              fontFamily: font.family,
              fontWeight: 400,
              fontStyle: 'italic'
            }}
          >
            Aa
          </span>
        )}
      </div>
    </button>
  );
};

interface FontPreviewPanelProps {
  onSelectFont: (fontFamily: string) => void;
  selectedFontFamily: string;
}

const FontPreviewPanel: React.FC<FontPreviewPanelProps> = ({
  onSelectFont,
  selectedFontFamily
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sampleText, setSampleText] = useState('The quick brown fox jumps');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const filteredFonts = fontOptions
    .filter(font => font.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(font => filterCategory === 'all' || font.category === filterCategory);

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      <h3 className="text-lg font-medium text-secondary-900">Font Selection</h3>
      
      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search fonts..."
          className="block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      {/* Category filter */}
      <div className="flex space-x-2 pb-2 overflow-x-auto scrollbar-hide">
        {['all', 'sans-serif', 'serif', 'monospace', 'display'].map(category => (
          <button
            key={category}
            onClick={() => setFilterCategory(category)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              filterCategory === category
                ? 'bg-primary-100 text-primary-700'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
          >
            {category === 'all' ? 'All Fonts' : category}
          </button>
        ))}
      </div>
      
      {/* Sample text input */}
      <div>
        <label htmlFor="sample-text" className="block text-sm font-medium text-secondary-700 mb-1">
          Sample Text
        </label>
        <input
          id="sample-text"
          type="text"
          value={sampleText}
          onChange={e => setSampleText(e.target.value)}
          className="block w-full rounded-md border border-secondary-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      {/* Font grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        {filteredFonts.map(font => (
          <FontPreviewCard
            key={font.name}
            font={font}
            onClick={() => onSelectFont(font.family)}
            isSelected={selectedFontFamily === font.family}
            sampleText={sampleText || 'The quick brown fox jumps'}
          />
        ))}
        
        {filteredFonts.length === 0 && (
          <div className="col-span-2 py-8 text-center text-secondary-500">
            No fonts match your search
          </div>
        )}
      </div>
    </div>
  );
};

export default FontPreviewPanel;
