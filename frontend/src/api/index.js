import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터: 토큰 자동 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage')
  if (token) {
    try {
      const parsed = JSON.parse(token)
      if (parsed.state?.token) {
        config.headers.Authorization = `Bearer ${parsed.state.token}`
      }
    } catch (e) {
      // 무시
    }
  }
  return config
})

// 상품 관련 API
export const getRandomProducts = async () => {
  const response = await api.get('/products/random')
  return response.data
}

export const getProduct = async (id) => {
  const response = await api.get(`/products/${id}`)
  return response.data
}

export const searchProducts = async (query) => {
  const response = await api.get('/products/search', { params: { q: query } })
  return response.data
}

export const getProductsByCategory = async (categorySlug) => {
  const response = await api.get(`/products/category/${categorySlug}`)
  return response.data
}

export const getCategories = async () => {
  const response = await api.get('/categories')
  return response.data
}

export const getCategoryBySlug = async (slug) => {
  const response = await api.get(`/categories/${slug}`)
  return response.data
}

export const createCategory = async (name) => {
  const response = await api.post('/categories', { name })
  return response.data
}

// 장바구니 관련 API
export const getCart = async () => {
  const response = await api.get('/cart')
  return response.data
}

export const addToCart = async (productId, quantity = 1) => {
  const response = await api.post('/cart', { productId, quantity })
  return response.data
}

export const removeFromCart = async (productId) => {
  const response = await api.delete(`/cart/${productId}`)
  return response.data
}

// 인증 관련 API
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password })
  return response.data
}

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData)
  return response.data
}

// 사용자 관련 API
export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/user/password', { currentPassword, newPassword })
  return response.data
}

export const updateProfile = async (name, phone) => {
  const response = await api.put('/user/profile', { name, phone })
  return response.data
}

// 배송지 관련 API
export const getShippingAddresses = async () => {
  const response = await api.get('/shipping')
  return response.data
}

export const addShippingAddress = async (addressData) => {
  const response = await api.post('/shipping', addressData)
  return response.data
}

export const updateShippingAddress = async (id, addressData) => {
  const response = await api.put(`/shipping/${id}`, addressData)
  return response.data
}

export const deleteShippingAddress = async (id) => {
  const response = await api.delete(`/shipping/${id}`)
  return response.data
}

// 파트너사 관련 API
export const getPartnerProducts = async () => {
  const response = await api.get('/partner/products')
  return response.data
}

export const createProduct = async (productData) => {
  const response = await api.post('/partner/products', productData)
  return response.data
}

export const updateProduct = async (id, productData) => {
  const response = await api.put(`/partner/products/${id}`, productData)
  return response.data
}

export const deleteProduct = async (id) => {
  const response = await api.delete(`/partner/products/${id}`)
  return response.data
}

export const getPartnerCoupons = async () => {
  const response = await api.get('/partner/coupons')
  return response.data
}

export const createCoupon = async (couponData) => {
  const response = await api.post('/partner/coupons', couponData)
  return response.data
}

export const updateCoupon = async (id, couponData) => {
  const response = await api.put(`/partner/coupons/${id}`, couponData)
  return response.data
}

export const deleteCoupon = async (id) => {
  const response = await api.delete(`/partner/coupons/${id}`)
  return response.data
}

export const getPartnerOrders = async () => {
  const response = await api.get('/partner/orders')
  return response.data
}

// Presigned URL 발급 (단일 이미지)
// productId는 선택사항 (상품 생성 전에는 undefined)
export const getPresignedUploadUrl = async (productId, filename, contentType) => {
  const response = await api.post('/upload/presigned', {
    productId: productId || undefined, // undefined면 백엔드에서 0 사용
    filename,
    contentType
  })
  return response.data
}

// Presigned URL 발급 (다중 이미지)
// productId는 선택사항 (상품 생성 전에는 undefined)
export const getPresignedUploadUrls = async (productId, files) => {
  const response = await api.post('/upload/presigned/batch', {
    productId: productId || undefined, // undefined면 백엔드에서 0 사용
    files: files.map(file => ({
      filename: file.name,
      contentType: file.type
    }))
  })
  return response.data
}

// S3에 직접 업로드 (Presigned URL 사용)
export const uploadToS3 = async (presignedUrl, file) => {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  })
  
  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.statusText}`)
  }
  
  return response
}

// 이미지 업로드 (Presigned URL 발급 + S3 업로드)
// productId는 선택사항 (상품 생성 전에는 undefined 또는 0)
export const uploadImage = async (file, productId = undefined) => {
  // 1. Presigned URL 발급 (백엔드에서 partnerId 자동 찾음)
  const { presignedUrl, key, url } = await getPresignedUploadUrl(
    productId,
    file.name,
    file.type
  )
  
  // 2. S3에 직접 업로드
  await uploadToS3(presignedUrl, file)
  
  // 3. 결과 반환
  return {
    key,
    url,
    filename: file.name
  }
}

// 다중 이미지 업로드
// productId는 선택사항 (상품 생성 전에는 undefined 또는 0)
export const uploadImages = async (files, productId = undefined) => {
  // 1. Presigned URL 발급 (백엔드에서 partnerId 자동 찾음)
  const { images } = await getPresignedUploadUrls(productId, files)
  
  // 2. 모든 파일을 S3에 업로드
  const uploadPromises = files.map((file, index) => 
    uploadToS3(images[index].presignedUrl, file)
  )
  
  await Promise.all(uploadPromises)
  
  // 3. 결과 반환
  return images.map(img => ({
    key: img.key,
    url: img.url
  }))
}

// default export에 api도 포함
const apiExports = {
  api,
  getRandomProducts,
  getProduct,
  searchProducts,
  getProductsByCategory,
  getCategories,
  getCategoryBySlug,
  getCart,
  addToCart,
  removeFromCart,
  login,
  register,
  changePassword,
  updateProfile,
  getShippingAddresses,
  addShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
}

export default apiExports

