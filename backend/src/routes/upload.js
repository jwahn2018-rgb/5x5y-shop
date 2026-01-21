import express from 'express'
import { 
  getPresignedUploadUrl, 
  getPresignedUploadUrls,
  finalizeProductImages,
  deleteProductImage
} from '../controllers/uploadController.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

// 파트너사만 이미지 업로드 가능
router.use(authenticate)
router.use(requireRole('partner', 'admin'))

// Presigned URL 발급 (단일 이미지)
router.post('/presigned', getPresignedUploadUrl)

// Presigned URL 발급 (다중 이미지)
router.post('/presigned/batch', getPresignedUploadUrls)

// 이미지 삭제
router.delete('/image/:imageId', deleteProductImage)

export default router

// finalizeProductImages는 다른 컨트롤러에서 직접 호출 (예: productController)