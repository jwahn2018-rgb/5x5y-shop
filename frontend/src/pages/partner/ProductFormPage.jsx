import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
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
import { getCategories, createProduct, updateProduct, getProduct, uploadImage } from '../../api'
import SortableImageItem from '../../components/SortableImageItem'

const ProductFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    stock: '',
    category_id: '',
    status: 'draft',
    images: []
  })
  
  const [imageFiles, setImageFiles] = useState([null]) // 선택된 파일들
  const [imageUrls, setImageUrls] = useState(['']) // 업로드된 URL들 (수정 시 기존 이미지)
  const [tempFilenames, setTempFilenames] = useState([null]) // 임시 파일명들 (업로드 후)
  const [errors, setErrors] = useState({})

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchCategories()
    if (isEdit) {
      fetchProduct()
    }
  }, [id, isEdit])

  const fetchCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      console.error('카테고리 로딩 실패:', error)
    }
  }

  const fetchProduct = async () => {
    try {
      const product = await getProduct(id)
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        discount_price: product.discount_price || '',
        stock: product.stock || '',
        category_id: product.category_id || '',
        status: product.status || 'draft',
        images: product.images || []
      })
      if (product.images && product.images.length > 0) {
        setImageUrls(product.images.map(img => img.image_url))
        setTempFilenames(new Array(product.images.length).fill(null)) // 기존 이미지는 tempFilename 없음
        setImageFiles(new Array(product.images.length).fill(null)) // 기존 이미지는 파일 없음
      } else {
        // 이미지가 없으면 기본 필드 하나
        setImageUrls([''])
        setTempFilenames([null])
        setImageFiles([null])
      }
    } catch (error) {
      console.error('상품 로딩 실패:', error)
      alert('상품을 불러올 수 없습니다.')
      navigate('/partner')
    }
  }

  const handleImageSelect = (index, file) => {
    if (!file) return
    
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }
    
    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.')
      return
    }

    const newFiles = [...imageFiles]
    newFiles[index] = file
    setImageFiles(newFiles)
  }

  const handleImageUpload = async (index, file) => {
    if (!file) return

    setUploadingImages(prev => ({ ...prev, [index]: true }))
    
    try {
      const response = await uploadImage(file)
      // tempFilename 저장
      const newTempFilenames = [...tempFilenames]
      newTempFilenames[index] = response.tempFilename
      setTempFilenames(newTempFilenames)
      
      // 미리보기용 임시 URL 저장
      const newUrls = [...imageUrls]
      newUrls[index] = response.tempUrl
      setImageUrls(newUrls)
      
      // 업로드 완료 후 파일 제거
      const newFiles = [...imageFiles]
      newFiles[index] = null
      setImageFiles(newFiles)
    } catch (error) {
      alert(error.response?.data?.error || '이미지 업로드에 실패했습니다.')
    } finally {
      setUploadingImages(prev => ({ ...prev, [index]: false }))
    }
  }

  const addImageField = () => {
    setImageUrls([...imageUrls, ''])
    setImageFiles([...imageFiles, null])
    setTempFilenames([...tempFilenames, null])
  }

  const removeImageField = (index) => {
    if (imageUrls.length > 1 || imageFiles.length > 1) {
      const newUrls = imageUrls.filter((_, i) => i !== index)
      const newFiles = imageFiles.filter((_, i) => i !== index)
      const newTempFilenames = tempFilenames.filter((_, i) => i !== index)
      setImageUrls(newUrls)
      setImageFiles(newFiles)
      setTempFilenames(newTempFilenames)
    }
  }

  // 드래그 앤 드롭 핸들러
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id)
      const newIndex = parseInt(over.id)

      // 배열 재정렬
      setImageUrls(arrayMove(imageUrls, oldIndex, newIndex))
      setImageFiles(arrayMove(imageFiles, oldIndex, newIndex))
      setTempFilenames(arrayMove(tempFilenames, oldIndex, newIndex))
    }
  }

  // 이미지 항목 ID 배열 생성
  const imageItemIds = Array.from({ 
    length: Math.max(imageUrls.length, imageFiles.length, 1) 
  }).map((_, i) => String(i))

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = '상품명을 입력하세요'
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = '올바른 가격을 입력하세요'
    }
    if (formData.discount_price && parseFloat(formData.discount_price) >= parseFloat(formData.price)) {
      newErrors.discount_price = '할인가격은 정가보다 낮아야 합니다'
    }
    if (!formData.category_id) {
      newErrors.category_id = '카테고리를 선택하세요'
    }
    
    // 이미지 검증: 업로드 완료된 이미지 또는 기존 이미지가 있어야 함
    const hasImages = tempFilenames.some(fn => fn) || imageUrls.some(url => url && !url.includes('/temp/'))
    if (!hasImages) {
      newErrors.images = '최소 1개 이상의 이미지가 필요합니다'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // 먼저 아직 업로드하지 않은 파일들 업로드
      for (let i = 0; i < imageFiles.length; i++) {
        if (imageFiles[i] && !tempFilenames[i]) {
          try {
            const response = await uploadImage(imageFiles[i])
            const newTempFilenames = [...tempFilenames]
            newTempFilenames[i] = response.tempFilename
            setTempFilenames(newTempFilenames)
            
            const newUrls = [...imageUrls]
            newUrls[i] = response.tempUrl
            setImageUrls(newUrls)
            
            const newFiles = [...imageFiles]
            newFiles[i] = null
            setImageFiles(newFiles)
          } catch (error) {
            throw new Error(`이미지 ${i + 1} 업로드 실패: ${error.response?.data?.error || error.message}`)
          }
        }
      }

      // 이미지 배열 생성: tempFilename 또는 기존 URL
      const images = []
      for (let i = 0; i < Math.max(imageUrls.length, tempFilenames.length); i++) {
        if (tempFilenames[i]) {
          // 새로 업로드된 이미지 (tempFilename 전송)
          images.push({
            tempFilename: tempFilenames[i],
            display_order: images.length,
            is_primary: images.length === 0
          })
        } else if (imageUrls[i]) {
          // 기존 이미지 (수정 시, URL 전송)
          images.push({
            url: imageUrls[i],
            display_order: images.length,
            is_primary: images.length === 0
          })
        }
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        stock: parseInt(formData.stock) || 0,
        category_id: parseInt(formData.category_id),
        images
      }

      if (isEdit) {
        await updateProduct(id, productData)
        alert('상품이 수정되었습니다.')
      } else {
        await createProduct(productData)
        alert('상품이 등록되었습니다.')
      }
      
      navigate('/partner')
    } catch (error) {
      alert(error.message || error.response?.data?.error || '상품 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-dark-50">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          {isEdit ? '상품 수정' : '상품 등록'}
        </h1>
        <p className="text-gray-400">상품 정보를 입력하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        {/* 기본 정보 */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">기본 정보</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                상품명 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                className={`input ${errors.name ? 'border-red-500' : ''}`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="상품명을 입력하세요"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                상품 설명
              </label>
              <textarea
                className="input"
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="상품에 대한 자세한 설명을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                카테고리 <span className="text-red-400">*</span>
              </label>
              <select
                required
                className={`input ${errors.category_id ? 'border-red-500' : ''}`}
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">카테고리를 선택하세요</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="text-red-400 text-sm mt-1">{errors.category_id}</p>}
            </div>
          </div>
        </div>

        {/* 가격 정보 */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">가격 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                정가 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className={`input pr-12 ${errors.price ? 'border-red-500' : ''}`}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
              {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                할인가격
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`input pr-12 ${errors.discount_price ? 'border-red-500' : ''}`}
                  value={formData.discount_price}
                  onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                  placeholder="할인가격 (선택)"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
              {errors.discount_price && <p className="text-red-400 text-sm mt-1">{errors.discount_price}</p>}
              {formData.price && formData.discount_price && (
                <p className="text-sm text-gray-400 mt-1">
                  할인율: {Math.round((1 - parseFloat(formData.discount_price) / parseFloat(formData.price)) * 100)}%
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 재고 및 상태 */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">재고 및 상태</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                재고 수량
              </label>
              <input
                type="number"
                min="0"
                className="input"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                상품 상태
              </label>
              <select
                className="input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="draft">임시저장</option>
                <option value="active">판매중</option>
                <option value="inactive">판매중지</option>
                <option value="sold_out">품절</option>
              </select>
            </div>
          </div>
        </div>

        {/* 이미지 */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">상품 이미지</h2>
          <p className="text-sm text-gray-400 mb-4">
            이미지를 선택하세요. 드래그하여 순서를 변경할 수 있습니다. 첫 번째 이미지가 대표 이미지(썸네일)로 사용됩니다.
          </p>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={imageItemIds}
              strategy={verticalListSortingStrategy}
            >
              {imageItemIds.map((itemId, index) => {
                const url = imageUrls[index] || ''
                const file = imageFiles[index]
                const isUploading = uploadingImages[index]
                const previewUrl = file ? URL.createObjectURL(file) : url

                return (
                  <SortableImageItem
                    key={itemId}
                    id={itemId}
                    index={index}
                    url={url}
                    file={file}
                    tempFilename={tempFilenames[index]}
                    isUploading={isUploading}
                    onFileSelect={handleImageSelect}
                    onUpload={handleImageUpload}
                    onRemove={removeImageField}
                    previewUrl={previewUrl}
                  />
                )
              })}
            </SortableContext>
          </DndContext>
          
          {errors.images && <p className="text-red-400 text-sm mt-1">{errors.images}</p>}
          
          <button
            type="button"
            onClick={addImageField}
            className="btn-secondary mt-2"
          >
            + 이미지 추가
          </button>
        </div>

        {/* 버튼 */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? '저장 중...' : isEdit ? '수정하기' : '등록하기'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/partner')}
            className="btn-secondary flex-1"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductFormPage
