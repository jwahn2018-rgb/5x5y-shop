import express from 'express'
import { upload } from '../config/upload.js'
import { uploadImage, uploadImages } from '../controllers/uploadController.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

// 파트너사만 이미지 업로드 가능
router.use(authenticate)
router.use(requireRole('partner', 'admin'))

// 단일 이미지 업로드
router.post('/image', upload.single('image'), uploadImage)

// 다중 이미지 업로드
router.post('/images', upload.array('images', 10), uploadImages)

export default router

