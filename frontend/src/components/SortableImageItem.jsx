import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const SortableImageItem = ({ 
  id, 
  index, 
  url, 
  file, 
  tempFilename, 
  isUploading,
  onFileSelect,
  onUpload,
  onRemove,
  previewUrl
}) => {
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

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-white transition-colors"
              type="button"
            >
              ☰
            </button>
            <label className="block text-sm font-medium text-white">
              {index === 0 ? '대표 이미지 (썸네일) *' : `이미지 ${index + 1}`}
            </label>
          </div>
          <input
            type="file"
            accept="image/*"
            className="input"
            onChange={(e) => {
              const selectedFile = e.target.files[0]
              if (selectedFile) {
                onFileSelect(index, selectedFile)
              }
            }}
          />
          {file && !tempFilename && (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUpload(index, file)}
                disabled={isUploading}
                className="btn-secondary text-sm"
              >
                {isUploading ? '업로드 중...' : '업로드'}
              </button>
              <span className="text-sm text-gray-400">{file.name}</span>
            </div>
          )}
          {tempFilename && (
            <div className="mt-2 text-sm text-green-400">
              ✓ 업로드 완료
            </div>
          )}
        </div>
        {(index > 0 || (url || file)) && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="mt-6 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            삭제
          </button>
        )}
      </div>
      {previewUrl && (
        <div className="mt-2 w-32 h-32 bg-dark-200 rounded-lg overflow-hidden">
          <img
            src={previewUrl}
            alt={`Preview ${index + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        </div>
      )}
    </div>
  )
}

export default SortableImageItem

