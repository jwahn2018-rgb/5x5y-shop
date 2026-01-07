import pool from '../config/database.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const register = async (req, res) => {
  try {
    const { email, password, name, phone, role, companyName, businessNumber } = req.body
    
    // 이메일 중복 확인
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already exists' })
    }
    
    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // 사용자 role 설정 (기본값: 'user')
    const userRole = role === 'partner' ? 'partner' : 'user'
    
    // 트랜잭션 시작
    const connection = await pool.getConnection()
    await connection.beginTransaction()
    
    try {
      // 사용자 생성
      const [result] = await connection.execute(`
        INSERT INTO users (email, password, name, phone, role)
        VALUES (?, ?, ?, ?, ?)
      `, [email, hashedPassword, name, phone, userRole])
      
      const userId = result.insertId
      
      // 파트너사인 경우 partners 테이블에 추가
      if (userRole === 'partner' && companyName) {
        await connection.execute(`
          INSERT INTO partners (user_id, company_name, business_number, status)
          VALUES (?, ?, ?, 'pending')
        `, [userId, companyName, businessNumber || null])
      }
      
      await connection.commit()
      connection.release()
      
      res.status(201).json({ 
        message: 'User registered successfully',
        userId: userId,
        role: userRole
      })
    } catch (error) {
      await connection.rollback()
      connection.release()
      throw error
    }
  } catch (error) {
    console.error('Error registering user:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      error: 'Failed to register user',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    
    // 사용자 찾기
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    const user = users[0]
    
    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Error logging in:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      error: 'Failed to login',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

