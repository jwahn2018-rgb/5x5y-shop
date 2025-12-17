const Footer = () => {
  return (
    <footer className="bg-dark-50 border-t border-dark-600 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">고객센터</h3>
            <p className="text-gray-400">1588-0000</p>
            <p className="text-gray-400 text-sm mt-2">평일 09:00 - 18:00</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">회사정보</h3>
            <p className="text-gray-400 text-sm">대표: 홍길동</p>
            <p className="text-gray-400 text-sm">사업자등록번호: 000-00-00000</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">이용약관</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">이용약관</a></li>
              <li><a href="#" className="hover:text-white transition-colors">개인정보처리방침</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">소셜</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Instagram</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Facebook</a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-dark-600 text-center text-sm text-gray-400">
          <p>© 2024 USINSA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

