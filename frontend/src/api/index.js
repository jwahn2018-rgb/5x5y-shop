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

// 이미지 업로드 API
export const uploadImage = async (file) => {
  const formData = new FormData()
  formData.append('image', file)
  
  const response = await api.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const uploadImages = async (files) => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('images', file)
  })
  
  const response = await api.post('/upload/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
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

