import { useState, useEffect } from 'react'
import { useNavigate, Routes, Route, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuthStore from '../store/authStore'
import { 
  getPartnerProducts, 
  deleteProduct, 
  getPartnerCoupons, 
  deleteCoupon,
  getPartnerOrders 
} from '../api'
import ProductFormPage from './partner/ProductFormPage'
import CouponFormPage from './partner/CouponFormPage'

const PartnerPage = () => {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('products')
  
  const [products, setProducts] = useState([])
  const [coupons, setCoupons] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts()
    } else if (activeTab === 'coupons') {
      fetchCoupons()
    } else if (activeTab === 'orders') {
      fetchOrders()
    }
  }, [activeTab])

  const fetchProducts = async () => {
    try {
      const data = await getPartnerProducts()
      setProducts(data)
    } catch (error) {
      console.error('상품 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCoupons = async () => {
    try {
      const data = await getPartnerCoupons()
      setCoupons(data)
    } catch (error) {
      console.error('쿠폰 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const data = await getPartnerOrders()
      setOrders(data)
    } catch (error) {
      console.error('주문 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!confirm('상품을 삭제하시겠습니까?')) return
    
    try {
      await deleteProduct(id)
      alert('상품이 삭제되었습니다.')
      fetchProducts()
    } catch (error) {
      alert(error.response?.data?.error || '상품 삭제에 실패했습니다.')
    }
  }

  const handleDeleteCoupon = async (id) => {
    if (!confirm('쿠폰을 삭제하시겠습니까?')) return
    
    try {
      await deleteCoupon(id)
      alert('쿠폰이 삭제되었습니다.')
      fetchCoupons()
    } catch (error) {
      alert(error.response?.data?.error || '쿠폰 삭제에 실패했습니다.')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gray-400 text-lg mb-4">로그인이 필요합니다.</p>
        <button onClick={() => navigate('/login')} className="btn-primary">
          로그인하기
        </button>
      </div>
    )
  }

  if (user.role !== 'partner' && user.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center bg-dark-50">
        <p className="text-gray-400 text-lg mb-4">파트너사 전용 페이지입니다.</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          홈으로 가기
        </button>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="product/new" element={<ProductFormPage />} />
      <Route path="product/edit/:id" element={<ProductFormPage />} />
      <Route path="coupon/new" element={<CouponFormPage />} />
      <Route path="coupon/edit/:id" element={<CouponFormPage />} />
      <Route path="*" element={<PartnerDashboard activeTab={activeTab} setActiveTab={setActiveTab} products={products} coupons={coupons} orders={orders} loading={loading} onDeleteProduct={handleDeleteProduct} onDeleteCoupon={handleDeleteCoupon} />} />
    </Routes>
  )
}

const PartnerDashboard = ({ activeTab, setActiveTab, products, coupons, orders, loading, onDeleteProduct, onDeleteCoupon }) => {
  const navigate = useNavigate()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-dark-50">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">파트너사 관리</h1>
        <p className="text-gray-400">상품 및 쿠폰을 관리하세요</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-dark-600 mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'products'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            상품 관리
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'coupons'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            쿠폰 관리
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'orders'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            주문 관리
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">상품 목록</h2>
            <button 
              onClick={() => navigate('/partner/product/new')}
              className="btn-primary"
            >
              상품 등록
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="card p-6">
              <div className="text-center py-12 text-gray-400">
                등록된 상품이 없습니다.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-4"
                >
                  <div className="aspect-square bg-dark-200 rounded-lg mb-4 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder.jpg'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        이미지 없음
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-white mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="mb-2">
                    {product.discount_price ? (
                      <>
                        <span className="text-lg font-bold text-white">
                          {product.discount_price.toLocaleString()}원
                        </span>
                        <span className="text-sm text-gray-500 line-through ml-2">
                          {product.price.toLocaleString()}원
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-white">
                        {product.price.toLocaleString()}원
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      product.status === 'active' ? 'bg-green-900/30 text-green-400 border border-green-500' :
                      product.status === 'draft' ? 'bg-dark-600 text-gray-400 border border-dark-600' :
                      product.status === 'sold_out' ? 'bg-red-900/30 text-red-400 border border-red-500' :
                      'bg-yellow-900/30 text-yellow-400 border border-yellow-500'
                    }`}>
                      {product.status === 'active' ? '판매중' :
                       product.status === 'draft' ? '임시저장' :
                       product.status === 'sold_out' ? '품절' : '판매중지'}
                    </span>
                    <span className="text-sm text-gray-400">재고: {product.stock}개</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => navigate(`/partner/product/edit/${product.id}`)}
                      className="btn-secondary flex-1 text-sm"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => onDeleteProduct(product.id)}
                      className="px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg text-sm transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'coupons' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">쿠폰 목록</h2>
            <button 
              onClick={() => navigate('/partner/coupon/new')}
              className="btn-primary"
            >
              쿠폰 등록
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : coupons.length === 0 ? (
            <div className="card p-6">
              <div className="text-center py-12 text-gray-400">
                등록된 쿠폰이 없습니다.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <motion.div
                  key={coupon.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {coupon.name}
                      </h3>
                      {coupon.description && (
                        <p className="text-gray-400 mb-4">{coupon.description}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">할인:</span>
                          <span className="ml-2 font-semibold text-white">
                            {coupon.discount_type === 'percentage' 
                              ? `${coupon.discount_value}%`
                              : `${coupon.discount_value.toLocaleString()}원`}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">최소 구매:</span>
                          <span className="ml-2 text-white">{coupon.min_purchase_amount.toLocaleString()}원</span>
                        </div>
                        <div>
                          <span className="text-gray-400">유효기간:</span>
                          <span className="ml-2 text-white">
                            {new Date(coupon.valid_from).toLocaleDateString()} ~ {new Date(coupon.valid_until).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">사용:</span>
                          <span className="ml-2 text-white">
                            {coupon.used_count} / {coupon.usage_limit || '무제한'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className={`text-xs px-2 py-1 rounded ${
                          coupon.status === 'active' ? 'bg-green-900/30 text-green-400 border border-green-500' :
                          coupon.status === 'expired' ? 'bg-red-900/30 text-red-400 border border-red-500' :
                          'bg-dark-600 text-gray-400 border border-dark-600'
                        }`}>
                          {coupon.status === 'active' ? '활성' :
                           coupon.status === 'expired' ? '만료' : '비활성'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => navigate(`/partner/coupon/edit/${coupon.id}`)}
                        className="btn-secondary text-sm"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => onDeleteCoupon(coupon.id)}
                        className="px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg text-sm transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">주문 목록</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="card p-6">
              <div className="text-center py-12 text-gray-400">
                주문 내역이 없습니다.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="card p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        주문번호: {order.order_number}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        주문일: {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm border ${
                      order.status === 'delivered' ? 'bg-green-900/30 text-green-400 border-green-500' :
                      order.status === 'cancelled' ? 'bg-red-900/30 text-red-400 border-red-500' :
                      order.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-500' :
                      'bg-blue-900/30 text-blue-400 border-blue-500'
                    }`}>
                      {order.status === 'pending' ? '대기중' :
                       order.status === 'confirmed' ? '확인됨' :
                       order.status === 'preparing' ? '준비중' :
                       order.status === 'shipping' ? '배송중' :
                       order.status === 'delivered' ? '배송완료' : '취소됨'}
                    </span>
                  </div>
                  <div className="border-t border-dark-600 pt-4">
                    <p className="text-sm text-gray-400">고객: {order.customer_name} ({order.customer_email})</p>
                    <p className="text-lg font-bold text-white mt-2">
                      총 결제금액: {order.final_amount.toLocaleString()}원
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PartnerPage
