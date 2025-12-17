import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getRandomProducts } from '../api'

const HomePage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getRandomProducts()
        setProducts(data)
      } catch (error) {
        console.error('상품 로딩 실패:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-dark-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16"
      >
        <div className="bg-dark-100 border border-dark-600 rounded-3xl p-12">
          <h1 className="text-5xl font-bold mb-4 text-white">새로운 쇼핑 경험</h1>
          <p className="text-xl mb-8 text-gray-400">최고의 상품을 만나보세요</p>
          <button className="bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            쇼핑 시작하기
          </button>
        </div>
      </motion.div>

      {/* Random Products */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">추천 상품</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/product/${product.id}`} className="card p-4 block">
                <div className="aspect-square bg-dark-200 rounded-lg mb-4 overflow-hidden">
                  <img
                    src={product.image_url || '/placeholder.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-white mb-2 line-clamp-2">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <div>
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
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage

