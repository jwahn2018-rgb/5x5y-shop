import express from 'express'
import { getCategories, getCategoryBySlug, createCategory } from '../controllers/categoryController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/', getCategories)
router.get('/:slug', getCategoryBySlug)
router.post('/', authenticateToken, createCategory)

export default router

