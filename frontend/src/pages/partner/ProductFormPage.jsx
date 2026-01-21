import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getCategories, createCategory, createProduct, updateProduct, getProduct, uploadImages } from '../../api'
import ImageUploadSection from '../../components/ImageUploadSection'

const ProductFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadingProgress, setUploadingProgress] = useState(0)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    stock: '',
    category_id: '',
    status: 'draft',
  })
  
  // 썸네일 이미지 (is_primary = 1)
  const [thumbnailImages, setThumbnailImages] = useState([])
  // 본문 이미지 (is_primary = 0)
  const [detailImages, setDetailImages] = useState([])
  
  const [errors, setErrors] = useState({})

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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    
    setAddingCategory(true)
    try {
      const newCategory = await createCategory(newCategoryName.trim())
      setCategories([...categories, newCategory])
      setFormData({ ...formData, category_id: newCategory.id })
      setNewCategoryName('')
    } catch (error) {
      alert(error.response?.data?.error || '카테고리 추가에 실패했습니다.')
    } finally {
      setAddingCategory(false)
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
      })
      
      if (product.images && product.images.length > 0) {
        // 썸네일과 본문 이미지 분리
        const thumbnails = product.images
          .filter(img => img.is_primary)
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
          .map(img => ({
            url: img.image_url,
            filename: img.image_url.split('/').pop() || '이미지',
            file: null,
            isPrimary: true,
          }))
        
        const details = product.images
          .filter(img => !img.is_primary)
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
          .map(img => ({
            url: img.image_url,
            filename: img.image_url.split('/').pop() || '이미지',
            file: null,
            isPrimary: false,
          }))
        
        setThumbnailImages(thumbnails)
        setDetailImages(details)
      }
    } catch (error) {
      console.error('상품 로딩 실패:', error)
      alert('상품을 불러올 수 없습니다.')
      navigate('/partner')
    }
  }

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
    
    // 썸네일 이미지 최소 1개 필요
    const hasThumbnails = thumbnailImages.length > 0
    if (!hasThumbnails) {
      newErrors.thumbnails = '최소 1개 이상의 썸네일 이미지가 필요합니다'
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
    setUploadingProgress(0)
    
    try {
      const productId = isEdit ? parseInt(id) : undefined
      
      // 1. 새로 추가된 파일들만 업로드 (file이 있는 것들)
      const thumbnailFiles = thumbnailImages.filter(img => img.file).map(img => img.file)
      const detailFiles = detailImages.filter(img => img.file).map(img => img.file)
      const allFiles = [...thumbnailFiles, ...detailFiles]
      
      let uploadedResults = []
      
      if (allFiles.length > 0) {
        // 일괄 업로드
        setUploadingProgress(10)
        try {
          uploadedResults = await uploadImages(allFiles, productId)
          setUploadingProgress(50)
        } catch (uploadError) {
          console.error('이미지 업로드 실패:', uploadError)
          throw new Error(`이미지 업로드 실패: ${uploadError.response?.data?.error || uploadError.message}`)
        }
      }
      
      // 2. 이미지 배열 구성
      const images = []
      let uploadIndex = 0
      
      // 썸네일 이미지 (is_primary = 1)
      thumbnailImages.forEach((img, index) => {
        if (img.file) {
          // 새로 업로드된 이미지
          images.push({
            key: uploadedResults[uploadIndex].key,
            display_order: index,
            is_primary: true,
          })
          uploadIndex++
        } else if (img.url) {
          // 기존 이미지
          images.push({
            url: img.url,
            display_order: index,
            is_primary: true,
          })
        }
      })
      
      // 본문 이미지 (is_primary = 0)
      detailImages.forEach((img, index) => {
        if (img.file) {
          // 새로 업로드된 이미지
          images.push({
            key: uploadedResults[uploadIndex].key,
            display_order: index,
            is_primary: false,
          })
          uploadIndex++
        } else if (img.url) {
          // 기존 이미지
          images.push({
            url: img.url,
            display_order: index,
            is_primary: false,
          })
        }
      })
      
      setUploadingProgress(80)

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        stock: parseInt(formData.stock) || 0,
        category_id: parseInt(formData.category_id),
        images
      }

      setUploadingProgress(90)
      
      if (isEdit) {
        await updateProduct(id, productData)
        alert('상품이 수정되었습니다.')
      } else {
        await createProduct(productData)
        alert('상품이 등록되었습니다.')
      }
      
      setUploadingProgress(100)
      navigate('/partner')
    } catch (error) {
      alert(error.message || error.response?.data?.error || '상품 저장에 실패했습니다.')
    } finally {
      setLoading(false)
      setUploadingProgress(0)
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

              {categories.length === 0 && (
                <div className="mb-3 p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    등록된 카테고리가 없습니다. 아래에서 새 카테고리를 추가해주세요.
                  </p>
                </div>
              )}

              <select
                required
                className={`input ${errors.category_id ? 'border-red-500' : ''}`}
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                disabled={categories.length === 0}
              >
                <option value="">
                  {categories.length === 0 ? '카테고리를 먼저 추가하세요' : '카테고리를 선택하세요'}
                </option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="text-red-400 text-sm mt-1">{errors.category_id}</p>}

              <div className="mt-3 p-4 bg-dark-200 rounded-lg border border-dark-300">
                <p className="text-sm text-gray-400 mb-2">새 카테고리 추가</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="카테고리 이름 입력"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={addingCategory || !newCategoryName.trim()}
                    className="btn-primary whitespace-nowrap"
                  >
                    {addingCategory ? '추가 중...' : '+ 추가'}
                  </button>
                </div>
              </div>
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

        {/* 이미지 업로드 - 썸네일 */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">썸네일 이미지</h2>
          <p className="text-sm text-gray-400 mb-4">
            상품 상세페이지 왼쪽 상단에 표시될 이미지입니다. 여러 장을 업로드하면 썸네일 목록으로 표시됩니다.
          </p>
          <ImageUploadSection
            type="thumbnail"
            label="썸네일 이미지 *"
            images={thumbnailImages}
            onImagesChange={setThumbnailImages}
            errors={errors.thumbnails}
          />
        </div>

        {/* 이미지 업로드 - 본문 */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">본문 이미지</h2>
          <p className="text-sm text-gray-400 mb-4">
            상품 상세페이지 본문 영역에 표시될 이미지입니다. 가로폭 전체로 세로로 이어져 표시됩니다.
          </p>
          <ImageUploadSection
            type="detail"
            label="본문 이미지"
            images={detailImages}
            onImagesChange={setDetailImages}
            errors={errors.details}
          />
        </div>

        {/* 업로드 진행률 */}
        {loading && uploadingProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>이미지 업로드 중...</span>
              <span>{uploadingProgress}%</span>
            </div>
            <div className="w-full bg-dark-600 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadingProgress}%` }}
              />
            </div>
          </div>
        )}

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
            disabled={loading}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductFormPage
