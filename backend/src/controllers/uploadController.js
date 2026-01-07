import path from 'path'
import fs from 'fs'
import { getFileServerUrl, getTempUploadDir, moveTempFileToProduct, getImageUrl } from '../config/upload.js'
import pool from '../config/database.js'

// 단일 이미지 업로드 (임시 저장)
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '이미지 파일이 필요합니다.' })
    }

    // 임시 파일명 반환 (나중에 상품 생성 시 최종 경로로 이동)
    res.json({
      message: '이미지 업로드 성공 (임시 저장)',
      tempFilename: req.file.filename,
      tempUrl: `${getFileServerUrl()}/temp/${req.file.filename}`
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    res.status(500).json({ 
      error: '이미지 업로드 실패',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// 다중 이미지 업로드 (임시 저장)
export const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '이미지 파일이 필요합니다.' })
    }

    const fileServerUrl = getFileServerUrl()
    const images = req.files.map(file => ({
      tempFilename: file.filename,
      tempUrl: `${fileServerUrl}/temp/${file.filename}`
    }))

    res.json({
      message: '이미지 업로드 성공 (임시 저장)',
      images: images
    })
  } catch (error) {
    console.error('Error uploading images:', error)
    res.status(500).json({ 
      error: '이미지 업로드 실패',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// 상품 생성 시 임시 파일을 최종 경로로 이동하고 DB에 저장
export const finalizeProductImages = async (partnerId, productId, tempFilenames) => {
  const imageUrls = []
  
  for (const tempFilename of tempFilenames) {
    try {
      // 임시 파일을 최종 경로로 이동
      const finalFilename = moveTempFileToProduct(tempFilename, partnerId, productId)
      const imageUrl = getImageUrl(partnerId, productId, finalFilename)
      imageUrls.push(imageUrl)
    } catch (error) {
      console.error(`Error moving file ${tempFilename}:`, error)
      // 파일 이동 실패 시 임시 파일 삭제
      const tempPath = path.join(getTempUploadDir(), tempFilename)
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath)
      }
    }
  }
  
  return imageUrls
}
