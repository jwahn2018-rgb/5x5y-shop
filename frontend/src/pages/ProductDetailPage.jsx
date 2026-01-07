import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, getProduct, addToCart, getProductsByCategory } from '../api'
import useAuthStore from '../store/authStore'

const ProductDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProduct(id)
        setProduct(data)
        
        // 관련 상품 가져오기 (같은 카테고리)
        if (data.category_slug) {
          try {
            const related = await getProductsByCategory(data.category_slug)
            setRelatedProducts(related.filter(p => p.id !== parseInt(id)).slice(0, 4))
          } catch (e) {
            // 무시
          }
        }
      } catch (error) {
        console.error('상품 로딩 실패:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    setAddingToCart(true)
    try {
      await addToCart(id, quantity)
      alert('장바구니에 추가되었습니다!')
    } catch (error) {
      alert(error.response?.data?.error || '장바구니 추가에 실패했습니다.')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    // 주문 페이지로 이동 (구현 필요)
    alert('주문 기능은 준비 중입니다.')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center bg-dark-50">
        <p className="text-gray-400 text-lg">상품을 찾을 수 없습니다.</p>
        <Link to="/" className="btn-primary mt-4 inline-block">
          홈으로 가기
        </Link>
      </div>
    )
  }

  const images = (product.images || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  const mainImage = images.find(img => img.is_primary) || images[0] || { image_url: '/placeholder.jpg' }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-dark-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Product Images */}
        <div>
          <div className="bg-dark-200 rounded-2xl overflow-hidden mb-4 flex items-center justify-center w-[800px] min-h-[400px]">
            <img
              src={images[selectedImageIndex]?.image_url || mainImage.image_url || '/placeholder.jpg'}
              alt={product.name}
              className="max-w-[800px] w-auto h-auto object-contain"
            />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 max-w-[800px]">
              {images.map((img, index) => (
                <button
                  key={img.id || index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square bg-dark-200 rounded-lg overflow-hidden border-2 ${
                    selectedImageIndex === index ? 'border-white' : 'border-transparent'
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="mb-4">
            <Link 
              to={`/category/${product.category_slug}`}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              {product.category_name}
            </Link>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">{product.name}</h1>
          <p className="text-gray-400 mb-6 whitespace-pre-line">{product.description}</p>
          
          <div className="mb-6">
            {product.discount_price ? (
              <div>
                <span className="text-4xl font-bold text-white">
                  {product.discount_price.toLocaleString()}원
                </span>
                <span className="text-xl text-gray-500 line-through ml-4">
                  {product.price.toLocaleString()}원
                </span>
                <div className="mt-2">
                  <span className="bg-white text-black px-3 py-1 rounded-full text-sm font-semibold">
                    {Math.round((1 - product.discount_price / product.price) * 100)}% 할인
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-4xl font-bold text-white">
                {product.price.toLocaleString()}원
              </span>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              수량
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg border border-dark-600 hover:bg-dark-200 text-white"
              >
                -
              </button>
              <span className="text-lg font-semibold w-12 text-center text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-lg border border-dark-600 hover:bg-dark-200 text-white"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="btn-primary w-full"
            >
              {addingToCart ? '추가 중...' : '장바구니에 추가'}
            </button>
            <button
              onClick={handleBuyNow}
              className="btn-secondary w-full"
            >
              바로 구매
            </button>
          </div>

          <div className="border-t border-dark-600 pt-6 space-y-2 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>재고</span>
              <span className={product.stock > 0 ? 'text-green-400' : 'text-red-400'}>
                {product.stock > 0 ? `${product.stock}개` : '품절'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>판매자</span>
              <span className="text-white">{product.partner_name || '알 수 없음'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white mb-8">관련 상품</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((related) => (
              <Link
                key={related.id}
                to={`/product/${related.id}`}
                className="card p-4 block"
              >
                <div className="aspect-square bg-dark-200 rounded-lg mb-4 overflow-hidden">
                  <img
                    src={related.image_url || '/placeholder.jpg'}
                    alt={related.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-white mb-2 line-clamp-2">
                  {related.name}
                </h3>
                <div>
                  {related.discount_price ? (
                    <>
                      <span className="text-lg font-bold text-white">
                        {related.discount_price.toLocaleString()}원
                      </span>
                      <span className="text-sm text-gray-500 line-through ml-2">
                        {related.price.toLocaleString()}원
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {related.price.toLocaleString()}원
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetailPage
