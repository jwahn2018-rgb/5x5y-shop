import express from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import {
  getPartnerProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getPartnerCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getPartnerOrders
} from '../controllers/partnerController.js'

const router = express.Router()

router.use(authenticate) // 모든 라우트는 인증 필요
router.use(requireRole('partner', 'admin')) // 파트너사 또는 관리자만 접근

// 상품 관리
router.get('/products', getPartnerProducts)
router.post('/products', createProduct)
router.put('/products/:id', updateProduct)
router.delete('/products/:id', deleteProduct)

// 쿠폰 관리
router.get('/coupons', getPartnerCoupons)
router.post('/coupons', createCoupon)
router.put('/coupons/:id', updateCoupon)
router.delete('/coupons/:id', deleteCoupon)

// 주문 관리
router.get('/orders', getPartnerOrders)

export default router

