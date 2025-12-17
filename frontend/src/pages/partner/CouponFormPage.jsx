import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { createCoupon, updateCoupon, getPartnerCoupons } from '../../api'

const CouponFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase_amount: '',
    max_discount_amount: '',
    valid_from: '',
    valid_until: '',
    usage_limit: '',
    status: 'active'
  })
  
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit) {
      fetchCoupon()
    } else {
      // 기본값 설정
      const now = new Date()
      const nextMonth = new Date(now)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      
      setFormData({
        ...formData,
        valid_from: now.toISOString().slice(0, 16),
        valid_until: nextMonth.toISOString().slice(0, 16)
      })
    }
  }, [id, isEdit])

  const fetchCoupon = async () => {
    try {
      const coupons = await getPartnerCoupons()
      const coupon = coupons.find(c => c.id === parseInt(id))
      if (coupon) {
        setFormData({
          name: coupon.name || '',
          description: coupon.description || '',
          discount_type: coupon.discount_type || 'percentage',
          discount_value: coupon.discount_value || '',
          min_purchase_amount: coupon.min_purchase_amount || '',
          max_discount_amount: coupon.max_discount_amount || '',
          valid_from: coupon.valid_from ? new Date(coupon.valid_from).toISOString().slice(0, 16) : '',
          valid_until: coupon.valid_until ? new Date(coupon.valid_until).toISOString().slice(0, 16) : '',
          usage_limit: coupon.usage_limit || '',
          status: coupon.status || 'active'
        })
      }
    } catch (error) {
      console.error('쿠폰 로딩 실패:', error)
      alert('쿠폰을 불러올 수 없습니다.')
      navigate('/partner')
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = '쿠폰명을 입력하세요'
    }
    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      newErrors.discount_value = '올바른 할인 값을 입력하세요'
    }
    if (formData.discount_type === 'percentage' && parseFloat(formData.discount_value) > 100) {
      newErrors.discount_value = '할인율은 100%를 초과할 수 없습니다'
    }
    if (!formData.valid_from) {
      newErrors.valid_from = '시작일을 선택하세요'
    }
    if (!formData.valid_until) {
      newErrors.valid_until = '종료일을 선택하세요'
    }
    if (formData.valid_from && formData.valid_until && new Date(formData.valid_from) >= new Date(formData.valid_until)) {
      newErrors.valid_until = '종료일은 시작일보다 늦어야 합니다'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const couponData = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : 0,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: new Date(formData.valid_until).toISOString()
      }

      if (isEdit) {
        await updateCoupon(id, couponData)
        alert('쿠폰이 수정되었습니다.')
      } else {
        await createCoupon(couponData)
        alert('쿠폰이 등록되었습니다.')
      }
      
      navigate('/partner')
    } catch (error) {
      alert(error.response?.data?.error || '쿠폰 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-dark-50">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          {isEdit ? '쿠폰 수정' : '쿠폰 등록'}
        </h1>
        <p className="text-gray-400">쿠폰 정보를 입력하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        {/* 기본 정보 */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">기본 정보</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                쿠폰명 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                className={`input ${errors.name ? 'border-red-500' : ''}`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 신규 가입 10% 할인"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                쿠폰 설명
              </label>
              <textarea
                className="input"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="쿠폰에 대한 설명을 입력하세요"
              />
            </div>
          </div>
        </div>

        {/* 할인 정보 */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">할인 정보</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                할인 유형 <span className="text-red-400">*</span>
              </label>
              <select
                className="input"
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
              >
                <option value="percentage">퍼센트 할인 (%)</option>
                <option value="fixed">정액 할인 (원)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                할인 값 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className={`input pr-12 ${errors.discount_value ? 'border-red-500' : ''}`}
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  placeholder={formData.discount_type === 'percentage' ? '10' : '5000'}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                  {formData.discount_type === 'percentage' ? '%' : '원'}
                </span>
              </div>
              {errors.discount_value && <p className="text-red-400 text-sm mt-1">{errors.discount_value}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                최소 구매 금액
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input pr-12"
                  value={formData.min_purchase_amount}
                  onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">이 금액 이상 구매 시 쿠폰 사용 가능</p>
            </div>

            {formData.discount_type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  최대 할인 금액
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input pr-12"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                    placeholder="제한 없음"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">퍼센트 할인 시 최대 할인 금액 제한</p>
              </div>
            )}
          </div>
        </div>

        {/* 유효 기간 */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">유효 기간</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                시작일 <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                required
                className={`input ${errors.valid_from ? 'border-red-500' : ''}`}
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
              />
              {errors.valid_from && <p className="text-red-400 text-sm mt-1">{errors.valid_from}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                종료일 <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                required
                className={`input ${errors.valid_until ? 'border-red-500' : ''}`}
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              />
              {errors.valid_until && <p className="text-red-400 text-sm mt-1">{errors.valid_until}</p>}
            </div>
          </div>
        </div>

        {/* 사용 제한 */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">사용 제한</h2>
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              발급 제한 수량
            </label>
            <input
              type="number"
              min="1"
              className="input"
              value={formData.usage_limit}
              onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
              placeholder="제한 없음 (빈 값)"
            />
            <p className="text-sm text-gray-500 mt-1">이 쿠폰을 받을 수 있는 최대 사용자 수 (빈 값이면 제한 없음)</p>
          </div>
        </div>

        {/* 상태 */}
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            쿠폰 상태
          </label>
          <select
            className="input"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
        </div>

        {/* 버튼 */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? '저장 중...' : isEdit ? '수정하기' : '등록하기'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/partner')}
            className="btn-secondary flex-1"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}

export default CouponFormPage

