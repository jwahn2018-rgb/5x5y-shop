import express from 'express'
import { getCategories, getCategoryBySlug, createCategory } from '../controllers/categoryController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.get('/', getCategories)
router.get('/:slug', getCategoryBySlug)
router.post('/', authenticate, createCategory)

export default router

