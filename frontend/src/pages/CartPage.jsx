import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getCart, removeFromCart } from '../api'
import useAuthStore from '../store/authStore'

const CartPage = () => {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchCart()
  }, [isAuthenticated, navigate])

  const fetchCart = async () => {
    try {
      const data = await getCart()
      setCartItems(data)
    } catch (error) {
      console.error('장바구니 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (productId) => {
    setUpdating({ ...updating, [productId]: true })
    try {
      await removeFromCart(productId)
      setCartItems(cartItems.filter(item => item.product_id !== productId))
    } catch (error) {
      console.error('장바구니 삭제 실패:', error)
    } finally {
      setUpdating({ ...updating, [productId]: false })
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = item.discount_price || item.price
      return sum + (price * item.quantity)
    }, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-dark-50">
      <h1 className="text-4xl font-bold text-white mb-8">장바구니</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-4">장바구니가 비어있습니다.</p>
          <Link to="/" className="btn-primary inline-block">
            쇼핑하러 가기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const price = item.discount_price || item.price
              const total = price * item.quantity
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card p-6"
                >
                  <div className="flex gap-4">
                    <Link to={`/product/${item.product_id}`}>
                      <div className="w-24 h-24 bg-dark-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image_url || '/placeholder.jpg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                    
                    <div className="flex-grow">
                      <Link to={`/product/${item.product_id}`}>
                        <h3 className="font-semibold text-white mb-2 hover:text-gray-300 transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-bold text-white">
                            {price.toLocaleString()}원
                          </div>
                          <div className="text-sm text-gray-400">
                            수량: {item.quantity}개
                          </div>
                          <div className="text-lg font-bold text-white mt-2">
                            총 {total.toLocaleString()}원
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleRemove(item.product_id)}
                          disabled={updating[item.product_id]}
                          className="text-red-400 hover:text-red-300 px-4 py-2 rounded-lg hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        >
                          {updating[item.product_id] ? '삭제 중...' : '삭제'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-white mb-4">주문 요약</h2>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-gray-400">
                  <span>상품 합계</span>
                  <span>{calculateTotal().toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>배송비</span>
                  <span>무료</span>
                </div>
                <div className="border-t border-dark-600 pt-2 mt-2">
                  <div className="flex justify-between text-xl font-bold text-white">
                    <span>총 결제금액</span>
                    <span>{calculateTotal().toLocaleString()}원</span>
                  </div>
                </div>
              </div>

              <button className="btn-primary w-full mb-4">
                주문하기
              </button>
              
              <Link to="/" className="btn-secondary w-full block text-center">
                쇼핑 계속하기
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CartPage
