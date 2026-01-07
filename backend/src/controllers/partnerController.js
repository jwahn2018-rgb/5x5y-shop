import pool from '../config/database.js'
import { finalizeProductImages } from './uploadController.js'

// 파트너사의 상품 목록 조회
export const getPartnerProducts = async (req, res) => {
  try {
    // 먼저 user_id로 partner_id 찾기
    const [partners] = await pool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    
    const [products] = await pool.execute(`
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        pi.image_url
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE p.partner_id = ?
      ORDER BY p.created_at DESC
    `, [partnerId])
    
    res.json(products)
  } catch (error) {
    console.error('Error fetching partner products:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
}

// 상품 등록
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, discount_price, stock, category_id, status, images } = req.body
    
    // partner_id 찾기
    const [partners] = await pool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    
    const connection = await pool.getConnection()
    await connection.beginTransaction()
    
    try {
      // 상품 생성
      const [result] = await connection.execute(`
        INSERT INTO products (partner_id, category_id, name, description, price, discount_price, stock, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [partnerId, category_id, name, description, price, discount_price || null, stock || 0, status || 'draft'])
      
      const productId = result.insertId
      
      // 이미지 처리: 임시 파일을 최종 경로로 이동하고 DB에 저장
      if (images && images.length > 0) {
        // tempFilename 배열 추출
        const tempFilenames = images
          .map(img => img.tempFilename)
          .filter(filename => filename) // null/undefined 제거
        
        if (tempFilenames.length > 0) {
          // 임시 파일을 최종 경로로 이동
          const imageUrls = await finalizeProductImages(partnerId, productId, tempFilenames)
          
          // DB에 이미지 URL 저장
          for (let i = 0; i < imageUrls.length; i++) {
            await connection.execute(`
              INSERT INTO product_images (product_id, image_url, display_order, is_primary)
              VALUES (?, ?, ?, ?)
            `, [productId, imageUrls[i], i, i === 0])
          }
        }
      }
      
      await connection.commit()
      connection.release()
      
      res.status(201).json({ 
        message: 'Product created successfully',
        productId: productId
      })
    } catch (error) {
      await connection.rollback()
      connection.release()
      throw error
    }
  } catch (error) {
    console.error('Error creating product:', error)
    res.status(500).json({ error: 'Failed to create product' })
  }
}

// 상품 수정
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, price, discount_price, stock, category_id, status, images } = req.body
    
    // partner_id 찾기
    const [partners] = await pool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    
    // 상품 소유권 확인
    const [products] = await pool.execute(
      'SELECT id FROM products WHERE id = ? AND partner_id = ?',
      [id, partnerId]
    )
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    const connection = await pool.getConnection()
    await connection.beginTransaction()
    
    try {
      // 상품 업데이트
      await connection.execute(`
        UPDATE products 
        SET name = ?, description = ?, price = ?, discount_price = ?, stock = ?, category_id = ?, status = ?
        WHERE id = ? AND partner_id = ?
      `, [name, description, price, discount_price || null, stock, category_id, status, id, partnerId])
      
      // 기존 이미지 삭제 후 새로 추가
      if (images) {
        await connection.execute(
          'DELETE FROM product_images WHERE product_id = ?',
          [id]
        )
        
        // 새로 업로드된 이미지와 기존 이미지 분리
        const newImages = images.filter(img => img.tempFilename)
        const existingImages = images.filter(img => img.url && !img.tempFilename)
        
        // 새 이미지 처리: 임시 파일을 최종 경로로 이동
        if (newImages.length > 0) {
          const tempFilenames = newImages.map(img => img.tempFilename)
          const newImageUrls = await finalizeProductImages(partnerId, id, tempFilenames)
          
          // 새 이미지 URL을 기존 이미지 배열에 추가
          existingImages.push(...newImageUrls.map(url => ({ url })))
        }
        
        // 모든 이미지 DB에 저장
        for (let i = 0; i < existingImages.length; i++) {
          const image = existingImages[i]
          await connection.execute(`
            INSERT INTO product_images (product_id, image_url, display_order, is_primary)
            VALUES (?, ?, ?, ?)
          `, [id, image.url, i, i === 0])
        }
      }
      
      await connection.commit()
      connection.release()
      
      res.json({ message: 'Product updated successfully' })
    } catch (error) {
      await connection.rollback()
      connection.release()
      throw error
    }
  } catch (error) {
    console.error('Error updating product:', error)
    res.status(500).json({ error: 'Failed to update product' })
  }
}

// 상품 삭제
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params
    
    // partner_id 찾기
    const [partners] = await pool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    
    // 상품 소유권 확인
    const [products] = await pool.execute(
      'SELECT id FROM products WHERE id = ? AND partner_id = ?',
      [id, partnerId]
    )
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    await pool.execute(
      'DELETE FROM products WHERE id = ? AND partner_id = ?',
      [id, partnerId]
    )
    
    res.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({ error: 'Failed to delete product' })
  }
}

// 파트너사의 쿠폰 목록 조회
export const getPartnerCoupons = async (req, res) => {
  try {
    // partner_id 찾기
    const [partners] = await pool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    
    const [coupons] = await pool.execute(`
      SELECT * FROM coupons 
      WHERE partner_id = ?
      ORDER BY created_at DESC
    `, [partnerId])
    
    res.json(coupons)
  } catch (error) {
    console.error('Error fetching partner coupons:', error)
    res.status(500).json({ error: 'Failed to fetch coupons' })
  }
}

// 쿠폰 등록
export const createCoupon = async (req, res) => {
  try {
    const { name, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, valid_from, valid_until, usage_limit } = req.body
    
    // partner_id 찾기
    const [partners] = await pool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    
    const [result] = await pool.execute(`
      INSERT INTO coupons (
        partner_id, name, description, discount_type, discount_value,
        min_purchase_amount, max_discount_amount, valid_from, valid_until, usage_limit, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [
      partnerId, name, description, discount_type, discount_value,
      min_purchase_amount || 0, max_discount_amount || null,
      valid_from, valid_until, usage_limit || null
    ])
    
    res.status(201).json({ 
      message: 'Coupon created successfully',
      couponId: result.insertId
    })
  } catch (error) {
    console.error('Error creating coupon:', error)
    res.status(500).json({ error: 'Failed to create coupon' })
  }
}

// 쿠폰 수정
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, valid_from, valid_until, usage_limit, status } = req.body
    
    // partner_id 찾기
    const [partners] = await pool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    
    // 쿠폰 소유권 확인
    const [coupons] = await pool.execute(
      'SELECT id FROM coupons WHERE id = ? AND partner_id = ?',
      [id, partnerId]
    )
    
    if (coupons.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' })
    }
    
    await pool.execute(`
      UPDATE coupons 
      SET name = ?, description = ?, discount_type = ?, discount_value = ?,
          min_purchase_amount = ?, max_discount_amount = ?, valid_from = ?, valid_until = ?,
          usage_limit = ?, status = ?
      WHERE id = ? AND partner_id = ?
    `, [
      name, description, discount_type, discount_value,
      min_purchase_amount || 0, max_discount_amount || null,
      valid_from, valid_until, usage_limit || null, status,
      id, partnerId
    ])
    
    res.json({ message: 'Coupon updated successfully' })
  } catch (error) {
    console.error('Error updating coupon:', error)
    res.status(500).json({ error: 'Failed to update coupon' })
  }
}

// 쿠폰 삭제
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params
    
    // partner_id 찾기
    const [partners] = await pool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    
    // 쿠폰 소유권 확인
    const [coupons] = await pool.execute(
      'SELECT id FROM coupons WHERE id = ? AND partner_id = ?',
      [id, partnerId]
    )
    
    if (coupons.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' })
    }
    
    await pool.execute(
      'DELETE FROM coupons WHERE id = ? AND partner_id = ?',
      [id, partnerId]
    )
    
    res.json({ message: 'Coupon deleted successfully' })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    res.status(500).json({ error: 'Failed to delete coupon' })
  }
}

// 파트너사의 주문 목록 조회
export const getPartnerOrders = async (req, res) => {
  try {
    // partner_id 찾기
    const [partners] = await pool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    
    const [orders] = await pool.execute(`
      SELECT DISTINCT
        o.*,
        u.name as customer_name,
        u.email as customer_email
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      JOIN users u ON o.user_id = u.id
      WHERE p.partner_id = ?
      ORDER BY o.created_at DESC
    `, [partnerId])
    
    res.json(orders)
  } catch (error) {
    console.error('Error fetching partner orders:', error)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
}

