import { readPool, writePool, getTransactionConnection } from '../config/database.js'
import { finalizeProductImages, finalizeProductImagesWithConnection } from './uploadController.js'
import { deleteS3Object } from '../config/upload.js'

// 파트너사의 상품 목록 조회
export const getPartnerProducts = async (req, res) => {
  try {
    // 먼저 user_id로 partner_id 찾기
    const [partners] = await readPool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    
    const [products] = await readPool.execute(`
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
    const [partners] = await readPool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    
    const connection = await getTransactionConnection()
    await connection.beginTransaction()
    
    try {
      // 상품 생성
      const [result] = await connection.execute(`
        INSERT INTO products (partner_id, category_id, name, description, price, discount_price, stock, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [partnerId, category_id, name, description, price, discount_price || null, stock || 0, status || 'draft'])
      
      const productId = result.insertId
      
      // 이미지 처리: S3 키를 받아서 DB에 저장
      if (images && images.length > 0) {
        // S3 키 배열 추출 (프론트엔드에서 업로드 완료 후 전달)
        const s3Keys = images
          .map(img => img.key || img.s3Key)
          .filter(key => key) // null/undefined 제거
        
        if (s3Keys.length > 0) {
          // S3 키를 이미지 URL로 변환하고 DB에 저장 (기존 트랜잭션 사용)
          const imageUrls = await finalizeProductImagesWithConnection(connection, partnerId, productId, s3Keys)
          
          // 결과 로그
          console.log(`Product images saved: ${imageUrls.length} images`)
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
    const [partners] = await readPool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    
    // 상품 소유권 확인
    const [products] = await readPool.execute(
      'SELECT id FROM products WHERE id = ? AND partner_id = ?',
      [id, partnerId]
    )
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    const connection = await getTransactionConnection()
    await connection.beginTransaction()
    
    try {
      // 상품 업데이트
      await connection.execute(`
        UPDATE products 
        SET name = ?, description = ?, price = ?, discount_price = ?, stock = ?, category_id = ?, status = ?
        WHERE id = ? AND partner_id = ?
      `, [name, description, price, discount_price || null, stock, category_id, status, id, partnerId])
      
      // 이미지 처리
      if (images) {
        // 1. 기존 이미지 정보 가져오기 (삭제 전 S3 키 추출용)
        const [existingImagesInDb] = await readPool.execute(
          'SELECT id, image_url FROM product_images WHERE product_id = ?',
          [id]
        )
        
        // 2. 새로 업로드된 이미지와 기존 이미지 분리
        // 새 이미지: S3 키가 있는 경우
        const newImages = images.filter(img => img.key || img.s3Key)
        // 유지할 기존 이미지: URL만 있는 경우 (이미 DB에 저장됨)
        const keepImageUrls = images
          .filter(img => img.url && !img.key && !img.s3Key)
          .map(img => img.url)
        
        // 3. 삭제할 이미지 찾기 (기존 DB에 있지만 새 배열에 없는 것)
        const imagesToDelete = existingImagesInDb.filter(
          img => !keepImageUrls.includes(img.image_url)
        )
        
        // 4. 삭제할 이미지의 S3 객체 삭제
        const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN || 'img.usinsa.minn.my'
        for (const imgToDelete of imagesToDelete) {
          try {
            const url = imgToDelete.image_url
            if (url.includes(cloudfrontDomain)) {
              const key = url.replace(`https://${cloudfrontDomain}/`, '')
              await deleteS3Object(key)
            }
          } catch (error) {
            console.error(`Failed to delete S3 object for ${imgToDelete.image_url}:`, error)
            // S3 삭제 실패해도 계속 진행
          }
        }
        
        // 5. 기존 이미지 삭제 (DB에서)
        await connection.execute(
          'DELETE FROM product_images WHERE product_id = ?',
          [id]
        )
        
        // 6. 새 이미지 처리: S3 키를 이미지 URL로 변환하고 DB에 저장
        if (newImages.length > 0) {
          const s3Keys = newImages.map(img => img.key || img.s3Key)
          await finalizeProductImagesWithConnection(connection, partnerId, id, s3Keys)
        }
        
        // 7. 유지할 기존 이미지 재저장 (display_order 포함)
        // 전체 순서: 새 이미지 + 유지할 기존 이미지
        // is_primary: 새 이미지가 없고 첫 번째 기존 이미지인 경우에만 true
        let displayOrder = newImages.length
        for (let i = 0; i < keepImageUrls.length; i++) {
          const imageUrl = keepImageUrls[i]
          const isPrimary = (newImages.length === 0 && i === 0) // 새 이미지가 없고 첫 번째 기존 이미지
          await connection.execute(`
            INSERT INTO product_images (product_id, image_url, display_order, is_primary)
            VALUES (?, ?, ?, ?)
          `, [id, imageUrl, displayOrder + i, isPrimary])
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
    const [partners] = await readPool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    
    // 상품 소유권 확인
    const [products] = await readPool.execute(
      'SELECT id FROM products WHERE id = ? AND partner_id = ?',
      [id, partnerId]
    )
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    // 상품 이미지 S3 키 가져오기 (삭제 전)
    const [productImages] = await readPool.execute(
      'SELECT image_url FROM product_images WHERE product_id = ?',
      [id]
    )
    
    // 상품 삭제 (CASCADE로 이미지도 자동 삭제됨)
    await writePool.execute(
      'DELETE FROM products WHERE id = ? AND partner_id = ?',
      [id, partnerId]
    )
    
    // S3 이미지 삭제 (비동기, 실패해도 무시)
    if (productImages.length > 0) {
      const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN || 'img.usinsa.minn.my'
      
      // Promise.all을 사용하여 모든 S3 삭제 작업을 기다림
      const deletePromises = productImages.map(async (img) => {
        try {
          // image_url에서 S3 키 추출 (CloudFront URL에서 키 추출)
          const url = img.image_url
          if (url.includes(cloudfrontDomain)) {
            const key = url.replace(`https://${cloudfrontDomain}/`, '')
            await deleteS3Object(key)
          }
        } catch (error) {
          console.error(`Failed to delete S3 object for ${img.image_url}:`, error)
          // S3 삭제 실패해도 상품 삭제는 성공으로 처리
        }
      })
      
      // 모든 S3 삭제 작업 완료 대기 (실패해도 상품 삭제는 성공)
      await Promise.allSettled(deletePromises)
    }
    
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
    const [partners] = await readPool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    
    const [coupons] = await readPool.execute(`
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
    const [partners] = await readPool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    
      const [result] = await writePool.execute(`
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
    const [partners] = await readPool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    
    // 쿠폰 소유권 확인
    const [coupons] = await readPool.execute(
      'SELECT id FROM coupons WHERE id = ? AND partner_id = ?',
      [id, partnerId]
    )
    
    if (coupons.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' })
    }
    
    await writePool.execute(`
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
    const [partners] = await readPool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    
    // 쿠폰 소유권 확인
    const [coupons] = await readPool.execute(
      'SELECT id FROM coupons WHERE id = ? AND partner_id = ?',
      [id, partnerId]
    )
    
    if (coupons.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' })
    }
    
    await writePool.execute(
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
    const [partners] = await readPool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    
    const [orders] = await readPool.execute(`
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

