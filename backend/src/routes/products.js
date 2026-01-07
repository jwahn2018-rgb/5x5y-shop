import express from 'express'
import { getRandomProducts, getProductById, searchProducts, getProductsByCategory } from '../controllers/productController.js'

const router = express.Router()

router.get('/random', getRandomProducts)
router.get('/:id', getProductById)
router.get('/search', searchProducts)
router.get('/category/:slug', getProductsByCategory)

export default router

