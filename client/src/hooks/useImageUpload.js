import { useState, useRef, useCallback } from 'react'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function useImageUpload() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [mimeType, setMimeType] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = useCallback((file) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 10MB')
      return
    }

    setError(null)
    setMimeType(file.type)

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]
      setImage(base64)
      setPreview(reader.result)
    }
    reader.onerror = () => {
      setError('Failed to read file. Please try another image.')
    }
    reader.readAsDataURL(file)
  }, [])

  const clearImage = useCallback(() => {
    setImage(null)
    setPreview(null)
    setMimeType(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return {
    image,
    preview,
    mimeType,
    error,
    fileInputRef,
    handleFileSelect,
    clearImage,
    openFilePicker,
    setError,
  }
}
