import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-dark-50">
      <Header />
      <main className="flex-grow bg-dark-50">
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  )
}

export default Layout

