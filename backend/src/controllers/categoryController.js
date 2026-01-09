import pool from '../config/database.js'

export const getCategories = async (req, res) => {
  try {
    const [categories] = await pool.execute(`
      SELECT id, name, slug, parent_id, image_url, display_order
      FROM categories
      ORDER BY display_order, name
    `)
    
    res.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
}

export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params
    
    const [categories] = await pool.execute(`
      SELECT * FROM categories WHERE slug = ?
    `, [slug])
    
    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' })
    }
    
    res.json(categories[0])
  } catch (error) {
    console.error('Error fetching category:', error)
    res.status(500).json({ error: 'Failed to fetch category' })
  }
}

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '카테고리 이름을 입력하세요' })
    }
    
    // slug 생성 (한글은 그대로, 공백은 하이픈으로)
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-')
    
    // 중복 체크
    const [existing] = await pool.execute(
      'SELECT id FROM categories WHERE name = ? OR slug = ?',
      [name.trim(), slug]
    )
    
    if (existing.length > 0) {
      return res.status(400).json({ error: '이미 존재하는 카테고리입니다' })
    }
    
    // 최대 display_order 조회
    const [maxOrder] = await pool.execute(
      'SELECT MAX(display_order) as max_order FROM categories'
    )
    const displayOrder = (maxOrder[0].max_order || 0) + 1
    
    const [result] = await pool.execute(
      'INSERT INTO categories (name, slug, display_order) VALUES (?, ?, ?)',
      [name.trim(), slug, displayOrder]
    )
    
    res.status(201).json({
      id: result.insertId,
      name: name.trim(),
      slug,
      display_order: displayOrder
    })
  } catch (error) {
    console.error('Error creating category:', error)
    res.status(500).json({ error: 'Failed to create category' })
  }
}

