import pool from '../config/database.js'

export const getRandomProducts = async (req, res) => {
  try {
    // 데이터베이스 연결 테스트
    try {
      await pool.execute('SELECT 1')
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return res.status(500).json({ 
        error: 'Database connection failed',
        message: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      })
    }
    
    const [products] = await pool.execute(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.discount_price,
        p.description,
        pi.image_url,
        c.name as category_name
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
      ORDER BY RAND()
      LIMIT 12
    `)
    
    res.json(products)
  } catch (error) {
    console.error('Error fetching random products:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      error: 'Failed to fetch products',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params
    
    const [products] = await pool.execute(`
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        pt.company_name as partner_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN partners pt ON p.partner_id = pt.id
      WHERE p.id = ?
    `, [id])
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    const product = products[0]
    
    // 상품 이미지 가져오기
    const [images] = await pool.execute(`
      SELECT image_url, display_order, is_primary
      FROM product_images
      WHERE product_id = ?
      ORDER BY display_order, is_primary DESC
    `, [id])
    
    product.images = images
    
    res.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
}

export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' })
    }
    
    const [products] = await pool.execute(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.discount_price,
        pi.image_url
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE p.status = 'active' 
        AND (p.name LIKE ? OR p.description LIKE ?)
      LIMIT 50
    `, [`%${q}%`, `%${q}%`])
    
    res.json(products)
  } catch (error) {
    console.error('Error searching products:', error)
    res.status(500).json({ error: 'Failed to search products' })
  }
}

export const getProductsByCategory = async (req, res) => {
  try {
    const { slug } = req.params
    
    const [products] = await pool.execute(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.discount_price,
        pi.image_url
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE c.slug = ? AND p.status = 'active'
      ORDER BY p.created_at DESC
    `, [slug])
    
    res.json(products)
  } catch (error) {
    console.error('Error fetching products by category:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
}

