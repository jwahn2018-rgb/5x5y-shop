import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getProductsByCategory, getCategoryBySlug } from '../api'

const CategoryPage = () => {
  const { slug } = useParams()
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoryData] = await Promise.all([
          getProductsByCategory(slug),
          getCategoryBySlug(slug).catch(() => null)
        ])
        setProducts(productsData)
        setCategory(categoryData)
      } catch (error) {
        console.error('데이터 로딩 실패:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-dark-50">
      {category && (
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">{category.name}</h1>
          {category.description && (
            <p className="text-gray-400">{category.description}</p>
          )}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">이 카테고리에 상품이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
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
      )}
    </div>
  )
}

export default CategoryPage
