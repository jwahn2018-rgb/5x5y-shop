import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuthStore from '../store/authStore'
import { 
  changePassword, 
  updateProfile, 
  getShippingAddresses, 
  addShippingAddress, 
  updateShippingAddress, 
  deleteShippingAddress 
} from '../api'

const MyPage = () => {
  const { user, logout, isAuthenticated, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const isPartner = user?.role === 'partner'
  const [activeTab, setActiveTab] = useState(isPartner ? 'profile' : 'orders')
  const [loading, setLoading] = useState(true)
  
  // 비밀번호 수정 관련
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  
  // 프로필 수정 관련
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileName, setProfileName] = useState(user?.name || '')
  const [profilePhone, setProfilePhone] = useState(user?.phone || '')
  const [profileLoading, setProfileLoading] = useState(false)
  
  // 배송지 관련
  const [addresses, setAddresses] = useState([])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    address: '',
    postal_code: '',
    is_default: false
  })
  const [addressLoading, setAddressLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      const state = useAuthStore.getState()
      if (!state.user && !state.isAuthenticated) {
        navigate('/login')
      } else {
        setLoading(false)
        if (state.user) {
          setProfileName(state.user.name)
          setProfilePhone(state.user.phone || '')
        }
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [navigate])

  useEffect(() => {
    if (activeTab === 'addresses' && !isPartner) {
      fetchAddresses()
    }
  }, [activeTab, isPartner])

  const fetchAddresses = async () => {
    try {
      const data = await getShippingAddresses()
      setAddresses(data)
    } catch (error) {
      console.error('배송지 로딩 실패:', error)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')

    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setPasswordLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      alert('비밀번호가 변경되었습니다.')
      setShowPasswordForm(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      setPasswordError(error.response?.data?.error || '비밀번호 변경에 실패했습니다.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleProfileUpdate = async () => {
    setProfileLoading(true)
    try {
      const response = await updateProfile(profileName, profilePhone)
      updateUser(response.user)
      setEditingProfile(false)
      alert('회원 정보가 수정되었습니다.')
    } catch (error) {
      alert(error.response?.data?.error || '회원 정보 수정에 실패했습니다.')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleAddressSubmit = async (e) => {
    e.preventDefault()
    setAddressLoading(true)
    try {
      if (editingAddress) {
        await updateShippingAddress(editingAddress.id, addressForm)
        alert('배송지가 수정되었습니다.')
      } else {
        await addShippingAddress(addressForm)
        alert('배송지가 추가되었습니다.')
      }
      setShowAddressForm(false)
      setEditingAddress(null)
      setAddressForm({ name: '', phone: '', address: '', postal_code: '', is_default: false })
      fetchAddresses()
    } catch (error) {
      alert(error.response?.data?.error || '배송지 저장에 실패했습니다.')
    } finally {
      setAddressLoading(false)
    }
  }

  const handleAddressDelete = async (id) => {
    if (!confirm('배송지를 삭제하시겠습니까?')) return
    
    try {
      await deleteShippingAddress(id)
      alert('배송지가 삭제되었습니다.')
      fetchAddresses()
    } catch (error) {
      alert(error.response?.data?.error || '배송지 삭제에 실패했습니다.')
    }
  }

  const handleSetDefault = async (id) => {
    try {
      await updateShippingAddress(id, { ...addresses.find(a => a.id === id), is_default: true })
      fetchAddresses()
    } catch (error) {
      alert('기본 배송지 설정에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user || !isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center bg-dark-50">
        <p className="text-gray-400 text-lg mb-4">로그인이 필요합니다.</p>
        <button onClick={() => navigate('/login')} className="btn-primary">
          로그인하기
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-dark-50">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">마이페이지</h1>
        <p className="text-gray-400">안녕하세요, {user.name}님</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <div className="mb-6">
              <div className="w-20 h-20 bg-dark-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-white">
                  {user.name.charAt(0)}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-center text-white">
                {user.name}
              </h3>
              <p className="text-center text-gray-400 text-sm">{user.email}</p>
            </div>

            <nav className="space-y-2">
              {!isPartner && (
                <>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'orders'
                        ? 'bg-dark-600 text-white font-semibold'
                        : 'text-gray-400 hover:bg-dark-200 hover:text-white'
                    }`}
                  >
                    주문 내역
                  </button>
                  <button
                    onClick={() => setActiveTab('coupons')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'coupons'
                        ? 'bg-dark-600 text-white font-semibold'
                        : 'text-gray-400 hover:bg-dark-200 hover:text-white'
                    }`}
                  >
                    쿠폰
                  </button>
                  <button
                    onClick={() => setActiveTab('addresses')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'addresses'
                        ? 'bg-dark-600 text-white font-semibold'
                        : 'text-gray-400 hover:bg-dark-200 hover:text-white'
                    }`}
                  >
                    배송지 관리
                  </button>
                </>
              )}
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-dark-600 text-white font-semibold'
                    : 'text-gray-400 hover:bg-dark-200 hover:text-white'
                }`}
              >
                회원 정보
              </button>
            </nav>

            <button
              onClick={() => {
                logout()
                navigate('/')
              }}
              className="w-full mt-6 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            {!isPartner && activeTab === 'orders' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">주문 내역</h2>
                <div className="text-center py-12 text-gray-400">
                  주문 내역이 없습니다.
                </div>
              </div>
            )}

            {!isPartner && activeTab === 'coupons' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">보유 쿠폰</h2>
                <div className="text-center py-12 text-gray-400">
                  사용 가능한 쿠폰이 없습니다.
                </div>
              </div>
            )}

            {!isPartner && activeTab === 'addresses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">배송지 관리</h2>
                  <button
                    onClick={() => {
                      setShowAddressForm(true)
                      setEditingAddress(null)
                      setAddressForm({ name: '', phone: '', address: '', postal_code: '', is_default: false })
                    }}
                    className="btn-primary"
                  >
                    배송지 추가
                  </button>
                </div>

                {showAddressForm && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-6 bg-dark-200 rounded-lg"
                  >
                    <h3 className="text-lg font-semibold mb-4">
                      {editingAddress ? '배송지 수정' : '배송지 추가'}
                    </h3>
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">
                          받는 분 이름
                        </label>
                        <input
                          type="text"
                          required
                          className="input"
                          value={addressForm.name}
                          onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">
                          전화번호
                        </label>
                        <input
                          type="tel"
                          required
                          className="input"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">
                          주소
                        </label>
                        <textarea
                          required
                          className="input"
                          rows={3}
                          value={addressForm.address}
                          onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">
                          우편번호
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={addressForm.postal_code}
                          onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_default"
                          className="mr-2"
                          checked={addressForm.is_default}
                          onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                        />
                        <label htmlFor="is_default" className="text-sm text-white">
                          기본 배송지로 설정
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={addressLoading}
                          className="btn-primary"
                        >
                          {addressLoading ? '저장 중...' : '저장'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddressForm(false)
                            setEditingAddress(null)
                          }}
                          className="btn-secondary"
                        >
                          취소
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {addresses.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    등록된 배송지가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="p-4 border border-dark-600 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-grow">
                            {address.is_default && (
                              <span className="inline-block bg-dark-600 text-white text-xs px-2 py-1 rounded mb-2">
                                기본 배송지
                              </span>
                            )}
                            <p className="font-semibold text-white">{address.name}</p>
                            <p className="text-gray-400">{address.phone}</p>
                            <p className="text-gray-400">{address.address}</p>
                            {address.postal_code && (
                              <p className="text-sm text-gray-400">우편번호: {address.postal_code}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!address.is_default && (
                              <button
                                onClick={() => handleSetDefault(address.id)}
                                className="text-sm text-white hover:text-gray-300 transition-colors"
                              >
                                기본 설정
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingAddress(address)
                                setAddressForm({
                                  name: address.name,
                                  phone: address.phone,
                                  address: address.address,
                                  postal_code: address.postal_code || '',
                                  is_default: address.is_default
                                })
                                setShowAddressForm(true)
                              }}
                              className="text-sm text-gray-400 hover:text-white"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleAddressDelete(address.id)}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">회원 정보</h2>
                  {!editingProfile && (
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="btn-secondary"
                    >
                      수정
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      이름
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="input"
                      readOnly={!editingProfile}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      이메일
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      className="input"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="input"
                      readOnly={!editingProfile}
                    />
                  </div>
                  
                  {editingProfile && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleProfileUpdate}
                        disabled={profileLoading}
                        className="btn-primary"
                      >
                        {profileLoading ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingProfile(false)
                          setProfileName(user.name)
                          setProfilePhone(user.phone || '')
                        }}
                        className="btn-secondary"
                      >
                        취소
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-8 border-t border-dark-600">
                  <h3 className="text-lg font-semibold text-white mb-4">비밀번호 변경</h3>
                  
                  {!showPasswordForm ? (
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="btn-secondary"
                    >
                      비밀번호 변경
                    </button>
                  ) : (
                    <motion.form
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handlePasswordChange}
                      className="space-y-4"
                    >
                      {passwordError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                          {passwordError}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">
                          현재 비밀번호
                        </label>
                        <input
                          type="password"
                          required
                          className="input"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">
                          새 비밀번호
                        </label>
                        <input
                          type="password"
                          required
                          className="input"
                          placeholder="최소 6자 이상"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">
                          새 비밀번호 확인
                        </label>
                        <input
                          type="password"
                          required
                          className={`input ${confirmPassword && newPassword !== confirmPassword ? 'border-red-500' : ''}`}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {confirmPassword && newPassword !== confirmPassword && (
                          <p className="text-red-500 text-sm mt-1">비밀번호가 일치하지 않습니다.</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={passwordLoading}
                          className="btn-primary"
                        >
                          {passwordLoading ? '변경 중...' : '비밀번호 변경'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordForm(false)
                            setCurrentPassword('')
                            setNewPassword('')
                            setConfirmPassword('')
                            setPasswordError('')
                          }}
                          className="btn-secondary"
                        >
                          취소
                        </button>
                      </div>
                    </motion.form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyPage
