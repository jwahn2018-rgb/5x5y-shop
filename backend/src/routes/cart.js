import express from 'express'
import { getCart, addToCart, removeFromCart } from '../controllers/cartController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticate) // 모든 장바구니 라우트는 인증 필요

router.get('/', getCart)
router.post('/', addToCart)
router.delete('/:productId', removeFromCart)

export default router

