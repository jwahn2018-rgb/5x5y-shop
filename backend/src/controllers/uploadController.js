import { 
  generatePresignedUploadUrl, 
  generatePresignedUploadUrls,
  getImageUrl,
  deleteS3Object,
  validateImageFile
} from '../config/upload.js'
import { readPool, writePool, isReadQuery } from '../config/database.js'

// Presigned URL 발급 (단일 이미지)
export const getPresignedUploadUrl = async (req, res) => {
  try {
    const { productId, filename, contentType } = req.body
    
    if (!filename || !contentType) {
      return res.status(400).json({ 
        error: 'filename, contentType가 필요합니다.' 
      })
    }
    
    // partnerId는 req.user.id에서 자동으로 찾기
    const [partners] = await readPool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    // productId가 없으면 0 사용 (상품 생성 전)
    const finalProductId = productId || 0
    
    // 파일 검증
    try {
      validateImageFile(filename, contentType)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
    
    // Presigned URL 생성
    const result = await generatePresignedUploadUrl(
      partnerId,
      finalProductId,
      filename,
      contentType
    )
    
    res.json({
      message: 'Presigned URL 생성 성공',
      presignedUrl: result.presignedUrl,
      key: result.key,
      url: result.url, // CloudFront URL
      expiresIn: 300 // 5분
    })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    res.status(500).json({ 
      error: 'Presigned URL 생성 실패',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Presigned URL 발급 (다중 이미지)
export const getPresignedUploadUrls = async (req, res) => {
  try {
    const { productId, files } = req.body
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ 
        error: 'files 배열이 필요합니다.' 
      })
    }
    
    // partnerId는 req.user.id에서 자동으로 찾기
    const [partners] = await readPool.execute(
      'SELECT id FROM partners WHERE user_id = ?',
      [req.user.id]
    )
    
    if (partners.length === 0) {
      return res.status(403).json({ error: 'Partner not found' })
    }
    
    const partnerId = partners[0].id
    // productId가 없으면 0 사용 (상품 생성 전)
    const finalProductId = productId || 0
    
    // 파일 검증
    for (const file of files) {
      try {
        validateImageFile(file.filename || file.name, file.contentType || file.type)
      } catch (error) {
        return res.status(400).json({ error: error.message })
      }
    }
    
    // Presigned URL 생성
    const results = await generatePresignedUploadUrls(partnerId, finalProductId, files)
    
    res.json({
      message: 'Presigned URL 생성 성공',
      images: results.map(result => ({
        presignedUrl: result.presignedUrl,
        key: result.key,
        url: result.url, // CloudFront URL
        expiresIn: 300 // 5분
      }))
    })
  } catch (error) {
    console.error('Error generating presigned URLs:', error)
    res.status(500).json({ 
      error: 'Presigned URL 생성 실패',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// 상품 이미지 최종화 (DB에 저장) - 자체 트랜잭션 사용
// 클라이언트가 S3에 업로드한 후 호출
export const finalizeProductImages = async (partnerId, productId, s3Keys) => {
  const imageUrls = []
  const connection = await writePool.getConnection()
  
  try {
    await connection.beginTransaction()
    
    for (let i = 0; i < s3Keys.length; i++) {
      const key = s3Keys[i]
      const imageUrl = getImageUrl(key)
      
      // DB에 이미지 정보 저장
      const [result] = await connection.execute(`
        INSERT INTO product_images (product_id, image_url, display_order, is_primary)
        VALUES (?, ?, ?, ?)
      `, [productId, imageUrl, i, i === 0]) // 첫 번째 이미지를 primary로
      
      imageUrls.push({
        id: result.insertId,
        url: imageUrl,
        key: key
      })
    }
    
    await connection.commit()
    return imageUrls
  } catch (error) {
    await connection.rollback()
    console.error('Error finalizing product images:', error)
    throw error
  } finally {
    connection.release()
  }
}

// 상품 이미지 최종화 (DB에 저장) - 기존 트랜잭션 사용
// 기존 connection을 사용하여 중첩 트랜잭션 방지
export const finalizeProductImagesWithConnection = async (connection, partnerId, productId, s3Keys) => {
  const imageUrls = []
  
  for (let i = 0; i < s3Keys.length; i++) {
    const key = s3Keys[i]
    const imageUrl = getImageUrl(key)
    
    // DB에 이미지 정보 저장
    const [result] = await connection.execute(`
      INSERT INTO product_images (product_id, image_url, display_order, is_primary)
      VALUES (?, ?, ?, ?)
    `, [productId, imageUrl, i, i === 0]) // 첫 번째 이미지를 primary로
    
    imageUrls.push({
      id: result.insertId,
      url: imageUrl,
      key: key
    })
  }
  
  return imageUrls
}

// 이미지 삭제
export const deleteProductImage = async (req, res) => {
  try {
    const { imageId } = req.params
    const { key } = req.body // S3 키
    
    if (!key) {
      return res.status(400).json({ error: 'S3 key가 필요합니다.' })
    }
    
    const connection = await writePool.getConnection()
    
    try {
      await connection.beginTransaction()
      
      // DB에서 이미지 정보 삭제
      const [result] = await connection.execute(
        'DELETE FROM product_images WHERE id = ?',
        [imageId]
      )
      
      if (result.affectedRows === 0) {
        await connection.rollback()
        return res.status(404).json({ error: '이미지를 찾을 수 없습니다.' })
      }
      
      // S3에서 객체 삭제
      await deleteS3Object(key)
      
      await connection.commit()
      
      res.json({ 
        message: '이미지 삭제 성공',
        imageId: imageId
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Error deleting product image:', error)
    res.status(500).json({ 
      error: '이미지 삭제 실패',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
