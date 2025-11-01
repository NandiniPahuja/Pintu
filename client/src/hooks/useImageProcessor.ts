import { useState, useCallback } from 'react';
import { processImage, ProcessedImage } from '@/lib/aiService';

export interface UseImageProcessorState {
  isProcessing: boolean;
  progress: number;
  error: string | null;
  result: ProcessedImage | null;
}

export interface UseImageProcessorReturn extends UseImageProcessorState {
  processImageFile: (file: File) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for processing images with AI service
 */
export function useImageProcessor(): UseImageProcessorReturn {
  const [state, setState] = useState<UseImageProcessorState>({
    isProcessing: false,
    progress: 0,
    error: null,
    result: null,
  });

  const processImageFile = useCallback(async (file: File) => {
    setState({
      isProcessing: true,
      progress: 0,
      error: null,
      result: null,
    });

    try {
      // Simulate progress updates
      setState(prev => ({ ...prev, progress: 10 }));

      // Process image
      const result = await processImage(file);

      setState({
        isProcessing: false,
        progress: 100,
        error: null,
        result,
      });
    } catch (error) {
      setState({
        isProcessing: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        result: null,
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      progress: 0,
      error: null,
      result: null,
    });
  }, []);

  return {
    ...state,
    processImageFile,
    reset,
  };
}
