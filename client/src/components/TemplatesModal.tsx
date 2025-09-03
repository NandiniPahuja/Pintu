import React, { useState, useEffect } from 'react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: any) => void;
}

const TemplatesModal: React.FC<TemplatesModalProps> = ({ isOpen, onClose, onApplyTemplate }) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadTemplates = async () => {
    try {
      // This is a placeholder - in real implementation, fetch templates from the server
      // For now, we'll import them from local files
      const templateFiles = [
        'split_layout_square.json',
        'vertical_story.json',
        'widescreen_video.json',
        'dark_minimal.json',
        'square_minimal.json',
        'portrait_accent.json',
        'landscape_wide.json',
        'square_modern_card.json',
        'clean_portrait.json',
        'video_cover.json'
      ];
      
      const loadedTemplates = await Promise.all(
        templateFiles.map(async (file) => {
          try {
            const module = await import(`../templates/${file}`);
            return module.default || module;
          } catch (error) {
            console.error(`Failed to load template: ${file}`, error);
            return null;
          }
        })
      );
      
      const validTemplates = loadedTemplates.filter(Boolean);
      setTemplates(validTemplates);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(validTemplates.map(template => template.metadata?.category || 'uncategorized'))
      );
      setCategories(['all', ...uniqueCategories]);
    } catch (error) {
      console.error('Failed to load templates', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      onApplyTemplate(selectedTemplate);
      onClose();
    }
  };

  const applySmartLayout = () => {
    if (selectedTemplate) {
      const smartLayoutTemplate = { ...selectedTemplate };
      
      // Add text at strategic points (top-left, center, golden-ratio points)
      const canvas = smartLayoutTemplate;
      const width = canvas.width;
      const height = canvas.height;
      
      // Golden ratio points
      const goldenRatio = 0.618;
      const goldenX = width * goldenRatio;
      const goldenY = height * goldenRatio;
      
      const textOptions = {
        type: 'i-text',
        version: '6.0.0',
        originX: 'center',
        originY: 'center',
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#333333',
        fontWeight: 'normal',
        textAlign: 'center'
      };
      
      // Add text at top-left
      const topLeftText = {
        ...textOptions,
        left: width * 0.1,
        top: height * 0.1,
        text: 'Top Left',
        id: 'smart_top_left',
        name: 'Smart Top Left'
      };
      
      // Add text at center
      const centerText = {
        ...textOptions,
        left: width / 2,
        top: height / 2,
        text: 'Center',
        id: 'smart_center',
        name: 'Smart Center'
      };
      
      // Add text at golden ratio point
      const goldenText = {
        ...textOptions,
        left: goldenX,
        top: goldenY,
        text: 'Golden Ratio',
        id: 'smart_golden',
        name: 'Smart Golden'
      };
      
      smartLayoutTemplate.objects = [
        ...smartLayoutTemplate.objects,
        topLeftText,
        centerText,
        goldenText
      ];
      
      onApplyTemplate(smartLayoutTemplate);
      onClose();
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.metadata?.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      (template.metadata?.templateName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       template.metadata?.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-5/6 max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Templates</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        
        <div className="p-4 flex gap-4">
          <div className="w-1/4">
            <input
              type="text"
              placeholder="Search templates..."
              className="w-full mb-4 px-3 py-2 border rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <h3 className="font-bold mb-2">Categories</h3>
            <ul className="space-y-1">
              {categories.map(category => (
                <li key={category}>
                  <button
                    className={`w-full text-left px-3 py-2 rounded ${selectedCategory === category ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="w-3/4 overflow-y-auto">
            <div className="grid grid-cols-3 gap-4">
              {filteredTemplates.map((template, index) => (
                <div
                  key={index}
                  className={`border rounded-lg overflow-hidden cursor-pointer ${selectedTemplate === template ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div 
                    className="h-40 bg-gray-200 flex items-center justify-center"
                    style={{
                      backgroundColor: template.background || '#f8f8f8',
                      aspectRatio: template.metadata?.aspectRatio === '4:5' ? '4/5' : 
                                  template.metadata?.aspectRatio === '16:9' ? '16/9' : '1/1'
                    }}
                  >
                    <div className="text-center p-2">
                      <div className="font-bold text-sm">{template.metadata?.templateName || `Template ${index + 1}`}</div>
                      <div className="text-xs text-gray-600">{template.metadata?.aspectRatio || '1:1'}</div>
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="text-sm font-medium truncate">{template.metadata?.templateName || `Template ${index + 1}`}</h3>
                    <p className="text-xs text-gray-500 truncate">{template.metadata?.description || 'No description available'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-100 px-4 py-3 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={applySmartLayout}
            className="px-4 py-2 border rounded bg-green-600 text-white hover:bg-green-700"
            disabled={!selectedTemplate}
          >
            Apply Smart Layout
          </button>
          <button
            onClick={handleApplyTemplate}
            className="px-4 py-2 border rounded bg-blue-600 text-white hover:bg-blue-700"
            disabled={!selectedTemplate}
          >
            Apply Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatesModal;
