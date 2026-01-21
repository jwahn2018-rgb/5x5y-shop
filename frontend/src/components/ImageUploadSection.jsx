import { useState, useCallback, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const SortableImageListItem = ({ id, image, index, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const previewUrl = image.file 
    ? URL.createObjectURL(image.file) 
    : image.url || null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-dark-200 rounded-lg border border-dark-600 hover:border-dark-500 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-white transition-colors"
        type="button"
        aria-label="순서 변경"
      >
        ☰
      </button>
      
      {previewUrl && (
        <div className="w-16 h-16 bg-dark-300 rounded overflow-hidden flex-shrink-0">
          <img
            src={previewUrl}
            alt={image.file?.name || `이미지 ${index + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">
          {image.file?.name || image.filename || `이미지 ${index + 1}`}
        </p>
        {image.file && (
          <p className="text-xs text-gray-400">
            {(image.file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        )}
      </div>
      
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-red-400 hover:text-red-300 px-3 py-1 rounded transition-colors"
        aria-label="삭제"
      >
        삭제
      </button>
    </div>
  )
}

const ImageUploadSection = ({ 
  type, 
  label, 
  images, 
  onImagesChange, 
  errors 
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('이미지 파일만 업로드 가능합니다. (JPEG, PNG, GIF, WEBP)')
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.')
      return false
    }
    return true
  }

  const handleFiles = useCallback((files) => {
    const fileArray = Array.from(files).filter(validateFile)
    
    if (fileArray.length === 0) return
    
    const newImages = fileArray.map(file => ({
      file,
      filename: file.name,
      url: null,
      isPrimary: false,
    }))
    
    // 파일명 오름차순 정렬
    newImages.sort((a, b) => a.filename.localeCompare(b.filename))
    
    onImagesChange([...images, ...newImages])
  }, [images, onImagesChange])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }, [handleFiles])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e) => {
    const files = e.target.files
    if (files.length > 0) {
      handleFiles(files)
    }
    // 같은 파일 다시 선택 가능하도록
    e.target.value = ''
  }, [handleFiles])

  const handleRemove = (index) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id)
      const newIndex = parseInt(over.id)
      onImagesChange(arrayMove(images, oldIndex, newIndex))
    }
  }

  const imageIds = images.map((_, i) => String(i))

  return (
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        {label}
      </label>
      
      {/* 드래그 앤 드롭 영역 */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-white bg-dark-200'
            : 'border-dark-600 hover:border-dark-500'
          }
          ${errors ? 'border-red-500' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="space-y-2">
          <p className="text-gray-400">
            {isDragging
              ? '여기에 이미지를 놓으세요'
              : '이미지를 드래그하거나 클릭하여 선택하세요'}
          </p>
          <p className="text-xs text-gray-500">
            여러 이미지를 동시에 선택할 수 있습니다 (JPEG, PNG, GIF, WEBP)
          </p>
        </div>
      </div>

      {/* 이미지 리스트 */}
      {images.length > 0 && (
        <div className="mt-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={imageIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {images.map((image, index) => (
                  <SortableImageListItem
                    key={imageIds[index]}
                    id={imageIds[index]}
                    image={image}
                    index={index}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {errors && (
        <p className="text-red-400 text-sm mt-1">{errors}</p>
      )}
    </div>
  )
}

export default ImageUploadSection
