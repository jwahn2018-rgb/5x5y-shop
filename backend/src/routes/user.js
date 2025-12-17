import express from 'express'
import { changePassword, updateProfile } from '../controllers/userController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticate) // 모든 라우트는 인증 필요

router.put('/password', changePassword)
router.put('/profile', updateProfile)

export default router

