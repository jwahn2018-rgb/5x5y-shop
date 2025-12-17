import pool from '../config/database.js'

// 배송지 목록 조회
export const getShippingAddresses = async (req, res) => {
  try {
    const userId = req.user.id

    const [addresses] = await pool.execute(`
      SELECT * FROM shipping_addresses 
      WHERE user_id = ? 
      ORDER BY is_default DESC, created_at DESC
    `, [userId])

    res.json(addresses)
  } catch (error) {
    console.error('Error fetching shipping addresses:', error)
    res.status(500).json({ error: 'Failed to fetch shipping addresses' })
  }
}

// 배송지 추가
export const addShippingAddress = async (req, res) => {
  try {
    const userId = req.user.id
    const { name, phone, address, postal_code, is_default } = req.body

    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 기본 배송지로 설정하는 경우, 기존 기본 배송지 해제
      if (is_default) {
        await connection.execute(
          'UPDATE shipping_addresses SET is_default = FALSE WHERE user_id = ?',
          [userId]
        )
      }

      // 배송지 추가
      const [result] = await connection.execute(`
        INSERT INTO shipping_addresses (user_id, name, phone, address, postal_code, is_default)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, name, phone, address, postal_code || null, is_default || false])

      await connection.commit()
      connection.release()

      res.status(201).json({ 
        message: 'Shipping address added successfully',
        id: result.insertId
      })
    } catch (error) {
      await connection.rollback()
      connection.release()
      throw error
    }
  } catch (error) {
    console.error('Error adding shipping address:', error)
    res.status(500).json({ error: 'Failed to add shipping address' })
  }
}

// 배송지 수정
export const updateShippingAddress = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const { name, phone, address, postal_code, is_default } = req.body

    // 배송지 소유권 확인
    const [addresses] = await pool.execute(
      'SELECT id FROM shipping_addresses WHERE id = ? AND user_id = ?',
      [id, userId]
    )

    if (addresses.length === 0) {
      return res.status(404).json({ error: 'Shipping address not found' })
    }

    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 기본 배송지로 설정하는 경우, 기존 기본 배송지 해제
      if (is_default) {
        await connection.execute(
          'UPDATE shipping_addresses SET is_default = FALSE WHERE user_id = ? AND id != ?',
          [userId, id]
        )
      }

      // 배송지 업데이트
      await connection.execute(`
        UPDATE shipping_addresses 
        SET name = ?, phone = ?, address = ?, postal_code = ?, is_default = ?
        WHERE id = ? AND user_id = ?
      `, [name, phone, address, postal_code || null, is_default || false, id, userId])

      await connection.commit()
      connection.release()

      res.json({ message: 'Shipping address updated successfully' })
    } catch (error) {
      await connection.rollback()
      connection.release()
      throw error
    }
  } catch (error) {
    console.error('Error updating shipping address:', error)
    res.status(500).json({ error: 'Failed to update shipping address' })
  }
}

// 배송지 삭제
export const deleteShippingAddress = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    // 배송지 소유권 확인
    const [addresses] = await pool.execute(
      'SELECT id FROM shipping_addresses WHERE id = ? AND user_id = ?',
      [id, userId]
    )

    if (addresses.length === 0) {
      return res.status(404).json({ error: 'Shipping address not found' })
    }

    await pool.execute(
      'DELETE FROM shipping_addresses WHERE id = ? AND user_id = ?',
      [id, userId]
    )

    res.json({ message: 'Shipping address deleted successfully' })
  } catch (error) {
    console.error('Error deleting shipping address:', error)
    res.status(500).json({ error: 'Failed to delete shipping address' })
  }
}

