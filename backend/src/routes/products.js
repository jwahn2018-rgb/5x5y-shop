import express from 'express'
import { getRandomProducts, getProductById, searchProducts, getProductsByCategory } from '../controllers/productController.js'

const router = express.Router()

router.get('/random', getRandomProducts)
router.get('/search', searchProducts)
router.get('/category/:slug', getProductsByCategory)
router.get('/:id', getProductById)

export default router

