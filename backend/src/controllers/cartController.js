import pool from '../config/database.js'

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id
    
    const [cartItems] = await pool.execute(`
      SELECT 
        c.id,
        c.quantity,
        p.id as product_id,
        p.name,
        p.price,
        p.discount_price,
        pi.image_url
      FROM cart c
      JOIN products p ON c.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE c.user_id = ?
    `, [userId])
    
    res.json(cartItems)
  } catch (error) {
    console.error('Error fetching cart:', error)
    res.status(500).json({ error: 'Failed to fetch cart' })
  }
}

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id
    const { productId, quantity } = req.body
    
    // 기존 장바구니에 있는지 확인
    const [existing] = await pool.execute(`
      SELECT id, quantity FROM cart 
      WHERE user_id = ? AND product_id = ?
    `, [userId, productId])
    
    if (existing.length > 0) {
      // 수량 업데이트
      await pool.execute(`
        UPDATE cart 
        SET quantity = quantity + ?
        WHERE id = ?
      `, [quantity || 1, existing[0].id])
    } else {
      // 새로 추가
      await pool.execute(`
        INSERT INTO cart (user_id, product_id, quantity)
        VALUES (?, ?, ?)
      `, [userId, productId, quantity || 1])
    }
    
    res.json({ message: 'Product added to cart' })
  } catch (error) {
    console.error('Error adding to cart:', error)
    res.status(500).json({ error: 'Failed to add to cart' })
  }
}

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id
    const { productId } = req.params
    
    await pool.execute(`
      DELETE FROM cart 
      WHERE user_id = ? AND product_id = ?
    `, [userId, productId])
    
    res.json({ message: 'Product removed from cart' })
  } catch (error) {
    console.error('Error removing from cart:', error)
    res.status(500).json({ error: 'Failed to remove from cart' })
  }
}

