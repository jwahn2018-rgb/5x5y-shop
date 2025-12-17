import express from 'express'
import { 
  getShippingAddresses, 
  addShippingAddress, 
  updateShippingAddress, 
  deleteShippingAddress 
} from '../controllers/shippingController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticate) // 모든 라우트는 인증 필요

router.get('/', getShippingAddresses)
router.post('/', addShippingAddress)
router.put('/:id', updateShippingAddress)
router.delete('/:id', deleteShippingAddress)

export default router

