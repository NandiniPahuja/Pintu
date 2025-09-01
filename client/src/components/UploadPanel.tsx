import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDesignCanvas } from './DesignCanvas';

interface UploadPanelProps {
  className?: string;
}

const UploadPanel: React.FC<UploadPanelProps> = ({ className }) => {
  const { addImageFromURL, replaceImageLayer } = useDesignCanvas();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];
    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported.');
      return;
    }
    setLoading(true);
    try {
      // Preview image immediately
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      const imageObj = await addImageFromURL(localUrl);
      // POST to server for background removal
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:8000/remove-bg', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to process image.');
      const blob = await res.blob();
      const cutoutUrl = URL.createObjectURL(blob);
      // Replace canvas image with cutout
      await replaceImageLayer(imageObj, cutoutUrl);
      setPreviewUrl(cutoutUrl);
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  }, [addImageFromURL, replaceImageLayer]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
    },
    multiple: false,
  });

  return (
    <div className={`p-4 flex flex-col items-center ${className || ''}`}>
      <div
        {...getRootProps()}
        className={`w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-secondary-300 bg-secondary-50'}`}
        style={{ minHeight: 160 }}
      >
        <input {...getInputProps()} />
        {loading ? (
          <div className="flex flex-col items-center justify-center h-32 animate-pulse-soft">
            <span className="text-4xl mb-2">⏳</span>
            <span className="text-secondary-600">Processing image...</span>
          </div>
        ) : previewUrl ? (
          <img src={previewUrl} alt="Preview" className="mx-auto max-h-32 rounded shadow mb-2" />
        ) : (
          <>
            <span className="text-4xl mb-2">📤</span>
            <span className="block text-secondary-700 font-medium mb-1">Drag & drop or click to upload</span>
            <span className="text-xs text-secondary-500">PNG, JPG, JPEG, WEBP</span>
          </>
        )}
      </div>
      {error && (
        <div className="mt-3 text-red-600 text-sm text-center animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
};

export default UploadPanel;
