import pool from '../config/database.js'
import bcrypt from 'bcryptjs'

// 비밀번호 변경
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' })
    }

    // 현재 비밀번호 확인
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password)

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    // 새 비밀번호 해시
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 비밀번호 업데이트
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    )

    res.json({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('Error changing password:', error)
    res.status(500).json({ error: 'Failed to change password' })
  }
}

// 사용자 정보 업데이트
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id
    const { name, phone } = req.body

    await pool.execute(
      'UPDATE users SET name = ?, phone = ? WHERE id = ?',
      [name, phone, userId]
    )

    // 업데이트된 사용자 정보 가져오기
    const [users] = await pool.execute(
      'SELECT id, email, name, phone, role FROM users WHERE id = ?',
      [userId]
    )

    res.json({ 
      message: 'Profile updated successfully',
      user: users[0]
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

