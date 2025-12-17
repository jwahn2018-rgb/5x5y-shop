import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

// DB 연결 설정 로그 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  console.log('DB Connection Config:', {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'shopping_mall',
    password: process.env.DB_PASSWORD ? '***' : '(not set)'
  })
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shopping_mall',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
})

// 연결 테스트
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connection successful!')
    connection.release()
  })
  .catch(error => {
    console.error('❌ Database connection failed:', error.message)
    console.error('Please check:')
    console.error('1. SSH tunneling is running (ssh-tunnel.bat)')
    console.error('2. .env file has correct DB settings')
    console.error('3. MySQL server is running')
  })

export default pool

