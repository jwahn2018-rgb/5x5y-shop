import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import productRoutes from './routes/products.js'
import cartRoutes from './routes/cart.js'
import authRoutes from './routes/auth.js'
import categoryRoutes from './routes/categories.js'
import userRoutes from './routes/user.js'
import shippingRoutes from './routes/shipping.js'
import partnerRoutes from './routes/partner.js'
import uploadRoutes from './routes/upload.js'
import path from 'path'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 정적 파일 서빙 제거 (S3/CloudFront 사용)
// 이미지는 CloudFront를 통해 제공됨

// Routes
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/user', userRoutes)
app.use('/api/shipping', shippingRoutes)
app.use('/api/partner', partnerRoutes)
app.use('/api/upload', uploadRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// 프로덕션: frontend 정적 파일 서빙
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(process.cwd(), 'public')))
  
  // SPA fallback - API 외 모든 요청은 index.html로
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next()
    }
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'))
  })
}

// 404 handler (API only)
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ 
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`
    })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  console.error('Error stack:', err.stack)
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

