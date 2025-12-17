import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import useAuthStore from '../store/authStore'

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-dark-50/95 backdrop-blur-md border-b border-dark-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-3xl font-bold text-white tracking-tight">
            USINSA
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-8">
            <input
              type="text"
              placeholder="상품 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-dark-200 border border-dark-600 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-white placeholder-gray-500"
            />
          </form>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            {isAuthenticated && user?.role !== 'partner' && (
              <Link to="/cart" className="text-white hover:text-gray-300 transition-colors font-medium">
                장바구니
              </Link>
            )}
            {isAuthenticated ? (
              <>
                {user.role === 'partner' && (
                  <Link to="/partner" className="text-white hover:text-gray-300 transition-colors font-medium">
                    파트너사
                  </Link>
                )}
                <Link to="/mypage" className="text-white hover:text-gray-300 transition-colors font-medium">
                  마이페이지
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-gray-300 transition-colors font-medium"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary text-sm">
                로그인
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header

