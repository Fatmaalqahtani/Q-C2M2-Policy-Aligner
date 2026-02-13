const express = require('express');
const { query, queryOne, run } = require('../database/database');

const router = express.Router();

// Get all Q-C2M2 domains
router.get('/domains', async (req, res) => {
  try {
    const domains = await query('SELECT * FROM qc2m2_domains ORDER BY id');
    res.json(domains);
  } catch (error) {
    console.error('Get domains error:', error);
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
});

// Get all mappings
router.get('/', async (req, res) => {
  try {
    const { document_id, domain_id, alignment_status } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (document_id) {
      whereClause += ' AND m.document_id = ?';
      params.push(document_id);
    }
    
    if (domain_id) {
      whereClause += ' AND m.domain_id = ?';
      params.push(domain_id);
    }
    
    if (alignment_status) {
      whereClause += ' AND m.alignment_status = ?';
      params.push(alignment_status);
    }
    
    const mappings = await query(`
      SELECT m.*, 
             d.original_name as document_name,
             qd.domain_name, qd.domain_code,
             u.username as mapped_by_name,
             ds.section_text
      FROM mappings m
      LEFT JOIN documents d ON m.document_id = d.id
      LEFT JOIN qc2m2_domains qd ON m.domain_id = qd.id
      LEFT JOIN users u ON m.mapped_by = u.id
      LEFT JOIN document_sections ds ON m.section_id = ds.id
      ${whereClause}
      ORDER BY m.created_at DESC
    `, params);
    
    res.json(mappings);
  } catch (error) {
    console.error('Get mappings error:', error);
    res.status(500).json({ error: 'Failed to fetch mappings' });
  }
});

// Create new mapping
router.post('/', async (req, res) => {
  try {
    const { 
      document_id, 
      section_id, 
      domain_id, 
      maturity_level, 
      alignment_status, 
      notes 
    } = req.body;
    
    const mappedBy = req.user?.id || 1; // Default to user 1 if no auth
    
    // Validate required fields
    if (!document_id || !domain_id || !maturity_level || !alignment_status) {
      return res.status(400).json({ 
        error: 'Missing required fields: document_id, domain_id, maturity_level, alignment_status' 
      });
    }
    
    // Validate alignment status
    const validStatuses = ['fully_aligned', 'partially_aligned', 'not_aligned'];
    if (!validStatuses.includes(alignment_status)) {
      return res.status(400).json({ 
        error: 'Invalid alignment_status. Must be one of: fully_aligned, partially_aligned, not_aligned' 
      });
    }
    
    // Check if mapping already exists for this document-section-domain combination
    const existingMapping = await queryOne(
      'SELECT id FROM mappings WHERE document_id = ? AND section_id = ? AND domain_id = ?',
      [document_id, section_id || null, domain_id]
    );
    
    if (existingMapping) {
      return res.status(409).json({ 
        error: 'Mapping already exists for this document-section-domain combination' 
      });
    }
    
    const result = await run(
      `INSERT INTO mappings (document_id, section_id, domain_id, maturity_level, alignment_status, notes, mapped_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [document_id, section_id || null, domain_id, maturity_level, alignment_status, notes || null, mappedBy]
    );
    
    // Get the created mapping with full details
    const newMapping = await queryOne(`
      SELECT m.*, 
             d.original_name as document_name,
             qd.domain_name, qd.domain_code,
             u.username as mapped_by_name,
             ds.section_text
      FROM mappings m
      LEFT JOIN documents d ON m.document_id = d.id
      LEFT JOIN qc2m2_domains qd ON m.domain_id = qd.id
      LEFT JOIN users u ON m.mapped_by = u.id
      LEFT JOIN document_sections ds ON m.section_id = ds.id
      WHERE m.id = ?
    `, [result.id]);
    
    res.status(201).json(newMapping);
  } catch (error) {
    console.error('Create mapping error:', error);
    res.status(500).json({ error: 'Failed to create mapping' });
  }
});

// Update mapping
router.put('/:id', async (req, res) => {
  try {
    const { domain_id, maturity_level, alignment_status, notes } = req.body;
    
    // Validate alignment status if provided
    if (alignment_status) {
      const validStatuses = ['fully_aligned', 'partially_aligned', 'not_aligned'];
      if (!validStatuses.includes(alignment_status)) {
        return res.status(400).json({ 
          error: 'Invalid alignment_status. Must be one of: fully_aligned, partially_aligned, not_aligned' 
        });
      }
    }
    
    const updateFields = [];
    const params = [];
    
    if (domain_id !== undefined) {
      updateFields.push('domain_id = ?');
      params.push(domain_id);
    }
    
    if (maturity_level !== undefined) {
      updateFields.push('maturity_level = ?');
      params.push(maturity_level);
    }
    
    if (alignment_status !== undefined) {
      updateFields.push('alignment_status = ?');
      params.push(alignment_status);
    }
    
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(notes);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(req.params.id);
    
    await run(
      `UPDATE mappings SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
    
    // Get updated mapping
    const updatedMapping = await queryOne(`
      SELECT m.*, 
             d.original_name as document_name,
             qd.domain_name, qd.domain_code,
             u.username as mapped_by_name,
             ds.section_text
      FROM mappings m
      LEFT JOIN documents d ON m.document_id = d.id
      LEFT JOIN qc2m2_domains qd ON m.domain_id = qd.id
      LEFT JOIN users u ON m.mapped_by = u.id
      LEFT JOIN document_sections ds ON m.section_id = ds.id
      WHERE m.id = ?
    `, [req.params.id]);
    
    res.json(updatedMapping);
  } catch (error) {
    console.error('Update mapping error:', error);
    res.status(500).json({ error: 'Failed to update mapping' });
  }
});

// Delete mapping
router.delete('/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM mappings WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Mapping not found' });
    }
    
    res.json({ success: true, message: 'Mapping deleted successfully' });
  } catch (error) {
    console.error('Delete mapping error:', error);
    res.status(500).json({ error: 'Failed to delete mapping' });
  }
});

// Get mapping statistics
router.get('/statistics', async (req, res) => {
  try {
    const { document_id } = req.query;
    
    let whereClause = '';
    const params = [];
    
    if (document_id) {
      whereClause = 'WHERE m.document_id = ?';
      params.push(document_id);
    }
    
    const stats = await query(`
      SELECT 
        qd.domain_name,
        qd.domain_code,
        COUNT(m.id) as total_mappings,
        SUM(CASE WHEN m.alignment_status = 'fully_aligned' THEN 1 ELSE 0 END) as fully_aligned,
        SUM(CASE WHEN m.alignment_status = 'partially_aligned' THEN 1 ELSE 0 END) as partially_aligned,
        SUM(CASE WHEN m.alignment_status = 'not_aligned' THEN 1 ELSE 0 END) as not_aligned,
        AVG(m.maturity_level) as avg_maturity_level
      FROM qc2m2_domains qd
      LEFT JOIN mappings m ON qd.id = m.domain_id
      ${whereClause}
      GROUP BY qd.id, qd.domain_name, qd.domain_code
      ORDER BY qd.id
    `, params);
    
    res.json(stats);
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router; 