import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { login, register } from '../api'
import useAuthStore from '../store/authStore'

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isPartner, setIsPartner] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [businessNumber, setBusinessNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const { login: loginStore } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // 회원가입 시 비밀번호 확인
    if (!isLogin && password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    
    if (!isLogin && password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }
    
    setLoading(true)

    try {
      if (isLogin) {
        const response = await login(email, password)
        loginStore(response.user, response.token)
        navigate('/')
      } else {
        const registerData = { 
          email, 
          password, 
          name, 
          phone,
          role: isPartner ? 'partner' : 'user',
          ...(isPartner && { companyName, businessNumber })
        }
        await register(registerData)
        // 회원가입 후 자동 로그인
        const response = await login(email, password)
        loginStore(response.user, response.token)
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.error || '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {isLogin ? '로그인' : '회원가입'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input"
                placeholder={isLogin ? "비밀번호를 입력하세요" : "비밀번호를 입력하세요 (최소 6자)"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1">
                    비밀번호 확인
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className={`input ${confirmPassword && password !== confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">비밀번호가 일치하지 않습니다.</p>
                  )}
                </div>
              </>
            )}

            {!isLogin && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white mb-1">
                    이름
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="input"
                    placeholder="이름을 입력하세요"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-white mb-1">
                    전화번호
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="input"
                    placeholder="전화번호를 입력하세요 (선택)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {isPartner && (
                  <>
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-white mb-1">
                        회사명 <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="companyName"
                        name="companyName"
                        type="text"
                        required={isPartner}
                        className="input"
                        placeholder="회사명을 입력하세요"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="businessNumber" className="block text-sm font-medium text-white mb-1">
                        사업자등록번호
                      </label>
                      <input
                        id="businessNumber"
                        name="businessNumber"
                        type="text"
                        className="input"
                        placeholder="사업자등록번호를 입력하세요 (선택)"
                        value={businessNumber}
                        onChange={(e) => setBusinessNumber(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setPassword('')
                setConfirmPassword('')
                setIsPartner(false)
                setCompanyName('')
                setBusinessNumber('')
              }}
              className="text-white hover:text-gray-300 text-sm transition-colors"
            >
              {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
            </button>
          </div>

          {!isLogin && (
            <div className="text-center pt-4 border-t border-dark-600">
              <button
                type="button"
                onClick={() => setIsPartner(!isPartner)}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                {isPartner ? '일반 회원가입' : '파트너사로 회원가입'}
              </button>
            </div>
          )}
        </form>
      </motion.div>
    </div>
  )
}

export default LoginPage
