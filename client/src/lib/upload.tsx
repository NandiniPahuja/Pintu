import React, { useCallback } from 'react'
import { useDropzone, DropzoneOptions, FileRejection } from 'react-dropzone'
import { filesApi } from './api'

// Types
export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: Date
}

export interface FileDropzoneProps {
  onFilesAdded: (files: File[]) => void
  onFilesRejected?: (rejections: FileRejection[]) => void
  onUploadProgress?: (progress: number) => void
  onUploadComplete?: (files: UploadedFile[]) => void
  onUploadError?: (error: string) => void
  accept?: Record<string, string[]>
  maxFiles?: number
  maxSize?: number
  disabled?: boolean
  children?: React.ReactNode
  className?: string
}

// Default accepted file types
const DEFAULT_ACCEPT = {
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'],
  'application/pdf': ['.pdf'],
  'text/*': ['.txt', '.csv', '.json'],
}

// File size formatter
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// File type checker
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/')
}

export const isPdfFile = (file: File): boolean => {
  return file.type === 'application/pdf'
}

export const isTextFile = (file: File): boolean => {
  return file.type.startsWith('text/')
}

// Image preview generator
export const generateImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// File validation
export const validateFile = (
  file: File,
  maxSize: number = 10 * 1024 * 1024, // 10MB default
  allowedTypes: string[] = []
): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`
    }
  }
  
  // Check file type if allowedTypes is specified
  if (allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0]
        return file.type.startsWith(baseType)
      }
      return file.type === type
    })
    
    if (!isAllowed) {
      return {
        valid: false,
        error: `File type "${file.type}" is not allowed`
      }
    }
  }
  
  return { valid: true }
}

// Main FileDropzone component
export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesAdded,
  onFilesRejected,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  accept = DEFAULT_ACCEPT,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  children,
  className = '',
}) => {
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (acceptedFiles.length > 0) {
      onFilesAdded(acceptedFiles)
    }
    
    if (rejectedFiles.length > 0 && onFilesRejected) {
      onFilesRejected(rejectedFiles)
    }
  }, [onFilesAdded, onFilesRejected])
  
  const dropzoneOptions: DropzoneOptions = {
    onDrop,
    accept,
    maxFiles,
    maxSize,
    disabled,
    multiple: maxFiles > 1,
  }
  
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone(dropzoneOptions)
  
  const baseClasses = 'border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer'
  const stateClasses = isDragActive
    ? isDragAccept
      ? 'border-primary-400 bg-primary-50'
      : 'border-red-400 bg-red-50'
    : 'border-secondary-300 hover:border-primary-400 hover:bg-primary-50'
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''
  
  return (
    <div
      {...getRootProps()}
      className={`${baseClasses} ${stateClasses} ${disabledClasses} ${className}`}
    >
      <input {...getInputProps()} />
      {children || (
        <div className="space-y-2">
          <div className="text-4xl">📁</div>
          <div className="text-secondary-700">
            {isDragActive ? (
              isDragAccept ? (
                <p>Drop the files here...</p>
              ) : (
                <p>Some files are not supported</p>
              )
            ) : (
              <>
                <p className="font-medium">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-secondary-500">
                  Max {maxFiles} files, up to {formatFileSize(maxSize)} each
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// File upload hook
export const useFileUpload = () => {
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  
  const uploadFiles = async (
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<UploadedFile[]> => {
    setUploading(true)
    setError(null)
    setProgress(0)
    
    try {
      const uploadPromises = files.map(async (file, index) => {
        const result = await filesApi.upload(file, (fileProgress) => {
          const totalProgress = ((index + fileProgress / 100) / files.length) * 100
          setProgress(totalProgress)
          onProgress?.(totalProgress)
        })
        
        return {
          id: result.id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: result.url,
          uploadedAt: new Date(),
        }
      })
      
      const uploadedFiles = await Promise.all(uploadPromises)
      setProgress(100)
      return uploadedFiles
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setUploading(false)
    }
  }
  
  const reset = () => {
    setUploading(false)
    setProgress(0)
    setError(null)
  }
  
  return {
    uploading,
    progress,
    error,
    uploadFiles,
    reset,
  }
}

// File preview component
export interface FilePreviewProps {
  file: File
  onRemove?: () => void
  showProgress?: boolean
  progress?: number
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onRemove,
  showProgress = false,
  progress = 0,
}) => {
  const [preview, setPreview] = React.useState<string>('')
  
  React.useEffect(() => {
    if (isImageFile(file)) {
      generateImagePreview(file)
        .then(setPreview)
        .catch(() => setPreview(''))
    }
  }, [file])
  
  const getFileIcon = () => {
    if (isImageFile(file)) return '🖼️'
    if (isPdfFile(file)) return '📄'
    if (isTextFile(file)) return '📝'
    return '📁'
  }
  
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {preview ? (
            <img
              src={preview}
              alt={file.name}
              className="w-12 h-12 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center text-2xl">
              {getFileIcon()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-secondary-900 truncate">
              {file.name}
            </p>
            <p className="text-xs text-secondary-500">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-secondary-400 hover:text-red-500 p-1"
          >
            ✕
          </button>
        )}
      </div>
      
      {showProgress && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-secondary-500">
            <span>Uploading...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-secondary-200 rounded-full h-1">
            <div
              className="bg-primary-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
