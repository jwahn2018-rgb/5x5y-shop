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

