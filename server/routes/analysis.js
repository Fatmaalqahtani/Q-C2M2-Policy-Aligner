const express = require('express');
const { query } = require('../database/database');
const router = express.Router();

/* =====================================================
   GAP MATRIX
===================================================== */
router.get('/gap-matrix', async (req, res) => {
  try {
    const { document_ids } = req.query;
    const framework = req.query.framework || "C2M2";
    const params = [framework];
    let extraFilter = '';

    if (document_ids) {
      const docIds = document_ids.split(',').map(id => parseInt(id.trim()));
      extraFilter = 'AND d.id IN (' + docIds.map(() => '?').join(',') + ')';
      params.push(...docIds);
    }

    const matrix = await query(`
      SELECT 
        qd.domain_name,
        qd.domain_code,
        d.id as document_id,
        d.original_name as document_name,
        d.relevant_agency,
        COUNT(m.id) as total_mappings,
        SUM(CASE WHEN m.alignment_status = 'fully_aligned' THEN 1 ELSE 0 END) as fully_aligned,
        SUM(CASE WHEN m.alignment_status = 'partially_aligned' THEN 1 ELSE 0 END) as partially_aligned,
        SUM(CASE WHEN m.alignment_status = 'not_aligned' THEN 1 ELSE 0 END) as not_aligned,
        AVG(m.maturity_level) as avg_maturity_level,
        CASE 
          WHEN COUNT(m.id) = 0 THEN 'no_coverage'
          WHEN SUM(CASE WHEN m.alignment_status = 'fully_aligned' THEN 1 ELSE 0 END) > 0 THEN 'strong_coverage'
          WHEN SUM(CASE WHEN m.alignment_status = 'partially_aligned' THEN 1 ELSE 0 END) > 0 THEN 'partial_coverage'
          ELSE 'weak_coverage'
        END as coverage_status
      FROM qc2m2_domains qd
      CROSS JOIN documents d
      LEFT JOIN mappings m ON qd.id = m.domain_id AND d.id = m.document_id
      WHERE qd.framework = ?
      ${extraFilter}
      GROUP BY qd.id, d.id
      ORDER BY qd.id, d.original_name
    `, params);

    res.json(matrix);
  } catch (error) {
    console.error('Gap matrix error:', error);
    res.status(500).json({ error: 'Failed to generate gap matrix' });
  }
});

/* =====================================================
   DOMAIN COVERAGE
===================================================== */
router.get('/domain-coverage', async (req, res) => {
  try {
    const { document_ids } = req.query;
    const framework = req.query.framework || "C2M2";
    const params = [framework];
    let extraFilter = '';

    if (document_ids) {
      const docIds = document_ids.split(',').map(id => parseInt(id.trim()));
      extraFilter = 'AND d.id IN (' + docIds.map(() => '?').join(',') + ')';
      params.push(...docIds);
    }

    const coverage = await query(`
      SELECT 
        qd.domain_name,
        qd.domain_code,
        qd.description,
        COUNT(m.id) as total_mappings,
        SUM(CASE WHEN m.alignment_status = 'fully_aligned' THEN 1 ELSE 0 END) as fully_aligned,
        SUM(CASE WHEN m.alignment_status = 'partially_aligned' THEN 1 ELSE 0 END) as partially_aligned,
        SUM(CASE WHEN m.alignment_status = 'not_aligned' THEN 1 ELSE 0 END) as not_aligned,
        AVG(m.maturity_level) as avg_maturity_level,
        ROUND(
          (SUM(CASE WHEN m.alignment_status = 'fully_aligned' THEN 1 ELSE 0 END) * 1.0 + 
           SUM(CASE WHEN m.alignment_status = 'partially_aligned' THEN 1 ELSE 0 END) * 0.5) / 
          NULLIF(COUNT(m.id), 0) * 100, 2
        ) as alignment_percentage
      FROM qc2m2_domains qd
      LEFT JOIN mappings m ON qd.id = m.domain_id
      LEFT JOIN documents d ON m.document_id = d.id
      WHERE qd.framework = ?
      ${extraFilter}
      GROUP BY qd.id
      ORDER BY qd.id
    `, params);

    res.json(coverage);
  } catch (error) {
    console.error('Domain coverage error:', error);
    res.status(500).json({ error: 'Failed to generate domain coverage' });
  }
});

/* =====================================================
   MATURITY DISTRIBUTION
===================================================== */
router.get('/maturity-distribution', async (req, res) => {
  try {
    const { document_ids } = req.query;
    const framework = req.query.framework || "C2M2";
    const params = [framework];
    let extraFilter = '';

    if (document_ids) {
      const docIds = document_ids.split(',').map(id => parseInt(id.trim()));
      extraFilter = 'AND d.id IN (' + docIds.map(() => '?').join(',') + ')';
      params.push(...docIds);
    }

    const distribution = await query(`
      SELECT 
        qd.domain_name,
        m.maturity_level,
        COUNT(m.id) as count
      FROM qc2m2_domains qd
      LEFT JOIN mappings m ON qd.id = m.domain_id
      LEFT JOIN documents d ON m.document_id = d.id
      WHERE qd.framework = ?
      AND m.maturity_level IS NOT NULL
      ${extraFilter}
      GROUP BY qd.id, m.maturity_level
      ORDER BY qd.id, m.maturity_level
    `, params);

    res.json(distribution);
  } catch (error) {
    console.error('Maturity distribution error:', error);
    res.status(500).json({ error: 'Failed to generate maturity distribution' });
  }
});
/* =====================================================
   AREAS OF CONCERN
===================================================== */
router.get('/areas-of-concern', async (req, res) => {
  try {
    const { document_ids } = req.query;
    const framework = req.query.framework || "C2M2";
    const params = [framework];
    let extraFilter = '';

    if (document_ids) {
      const docIds = document_ids.split(',').map(id => parseInt(id.trim()));
      extraFilter = 'AND d.id IN (' + docIds.map(() => '?').join(',') + ')';
      params.push(...docIds);
    }

    const concerns = await query(`
      SELECT 
        qd.domain_name,
        qd.domain_code,
        qd.description,
        COUNT(m.id) as total_mappings,
        SUM(CASE WHEN m.alignment_status = 'fully_aligned' THEN 1 ELSE 0 END) as fully_aligned,
        SUM(CASE WHEN m.alignment_status = 'partially_aligned' THEN 1 ELSE 0 END) as partially_aligned,
        SUM(CASE WHEN m.alignment_status = 'not_aligned' THEN 1 ELSE 0 END) as not_aligned,
        ROUND(
          (SUM(CASE WHEN m.alignment_status = 'fully_aligned' THEN 1 ELSE 0 END) * 1.0 + 
           SUM(CASE WHEN m.alignment_status = 'partially_aligned' THEN 1 ELSE 0 END) * 0.5) / 
          NULLIF(COUNT(m.id), 0) * 100, 2
        ) as alignment_percentage
      FROM qc2m2_domains qd
      LEFT JOIN mappings m ON qd.id = m.domain_id
      LEFT JOIN documents d ON m.document_id = d.id
      WHERE qd.framework = ?
      ${extraFilter}
      GROUP BY qd.id
      HAVING alignment_percentage < 50
      ORDER BY alignment_percentage ASC
    `, params);

    res.json(concerns);
  } catch (error) {
    console.error('Areas of concern error:', error);
    res.status(500).json({ error: 'Failed to generate areas of concern' });
  }
});

module.exports = router;
