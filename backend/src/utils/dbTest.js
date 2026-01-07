// 데이터베이스 연결 테스트 유틸리티
import pool from '../config/database.js'

export const testConnection = async () => {
  try {
    const [result] = await pool.execute('SELECT 1 as test')
    return { success: true, message: 'Database connection successful' }
  } catch (error) {
    return { 
      success: false, 
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    }
  }
}

