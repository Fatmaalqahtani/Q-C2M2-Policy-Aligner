const express = require('express');
const { query } = require('../database/database');

const router = express.Router();

// Generate comprehensive report
router.get('/comprehensive', async (req, res) => {
  try {
    const { document_ids, format = 'json' } = req.query;
    
    if (!document_ids) {
      return res.status(400).json({ error: 'document_ids parameter is required' });
    }
    
    const docIds = document_ids.split(',').map(id => parseInt(id.trim()));
    const placeholders = docIds.map(() => '?').join(',');
    
    // Get document information
    const documents = await query(`
      SELECT id, original_name, relevant_agency, publication_date, created_at
      FROM documents
      WHERE id IN (${placeholders})
      ORDER BY original_name
    `, docIds);
    
    // Get domain coverage
    const domainCoverage = await query(`
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
      WHERE d.id IN (${placeholders})
      GROUP BY qd.id, qd.domain_name, qd.domain_code, qd.description
      ORDER BY qd.id
    `, docIds);
    
    // Get detailed mappings
    const mappings = await query(`
      SELECT 
        m.id,
        d.original_name as document_name,
        qd.domain_name,
        qd.domain_code,
        m.maturity_level,
        m.alignment_status,
        m.notes,
        ds.section_text,
        u.username as mapped_by_name,
        m.created_at
      FROM mappings m
      LEFT JOIN documents d ON m.document_id = d.id
      LEFT JOIN qc2m2_domains qd ON m.domain_id = qd.id
      LEFT JOIN document_sections ds ON m.section_id = ds.id
      LEFT JOIN users u ON m.mapped_by = u.id
      WHERE d.id IN (${placeholders})
      ORDER BY d.original_name, qd.domain_name, m.created_at
    `, docIds);
    
    // Get areas of concern
    const areasOfConcern = await query(`
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
      WHERE d.id IN (${placeholders})
      GROUP BY qd.id, qd.domain_name, qd.domain_code, qd.description
      HAVING alignment_percentage < 50 OR COUNT(m.id) = 0
      ORDER BY alignment_percentage ASC, qd.domain_name
    `, docIds);
    
    // Calculate summary statistics
    const totalMappings = mappings.length;
    const fullyAligned = mappings.filter(m => m.alignment_status === 'fully_aligned').length;
    const partiallyAligned = mappings.filter(m => m.alignment_status === 'partially_aligned').length;
    const notAligned = mappings.filter(m => m.alignment_status === 'not_aligned').length;
    const overallAlignmentScore = totalMappings > 0 ? 
      ((fullyAligned + (partiallyAligned * 0.5)) / totalMappings * 100).toFixed(2) : 0;
    
    const report = {
      metadata: {
        generated_at: new Date().toISOString(),
        documents_analyzed: documents.length,
        total_mappings: totalMappings,
        overall_alignment_score: parseFloat(overallAlignmentScore)
      },
      documents: documents,
      domain_coverage: domainCoverage,
      detailed_mappings: mappings,
      areas_of_concern: areasOfConcern,
      summary: {
        total_mappings,
        fully_aligned: fullyAligned,
        partially_aligned: partiallyAligned,
        not_aligned: notAligned,
        overall_alignment_score: parseFloat(overallAlignmentScore),
        domains_with_concerns: areasOfConcern.length
      }
    };
    
    if (format === 'json') {
      res.json(report);
    } else {
      // For other formats, return JSON for now (can be extended to PDF/Excel)
      res.json(report);
    }
    
  } catch (error) {
    console.error('Comprehensive report error:', error);
    res.status(500).json({ error: 'Failed to generate comprehensive report' });
  }
});

// Generate gap analysis report
router.get('/gap-analysis', async (req, res) => {
  try {
    const { document_ids } = req.query;
    
    if (!document_ids) {
      return res.status(400).json({ error: 'document_ids parameter is required' });
    }
    
    const docIds = document_ids.split(',').map(id => parseInt(id.trim()));
    const placeholders = docIds.map(() => '?').join(',');
    
    const gapAnalysis = await query(`
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
        ) as alignment_percentage,
        CASE 
          WHEN COUNT(m.id) = 0 THEN 'No Coverage'
          WHEN (SUM(CASE WHEN m.alignment_status = 'fully_aligned' THEN 1 ELSE 0 END) * 1.0 + 
                SUM(CASE WHEN m.alignment_status = 'partially_aligned' THEN 1 ELSE 0 END) * 0.5) / 
               NULLIF(COUNT(m.id), 0) * 100 < 25 THEN 'Critical Gap'
          WHEN (SUM(CASE WHEN m.alignment_status = 'fully_aligned' THEN 1 ELSE 0 END) * 1.0 + 
                SUM(CASE WHEN m.alignment_status = 'partially_aligned' THEN 1 ELSE 0 END) * 0.5) / 
               NULLIF(COUNT(m.id), 0) * 100 < 50 THEN 'Significant Gap'
          WHEN (SUM(CASE WHEN m.alignment_status = 'fully_aligned' THEN 1 ELSE 0 END) * 1.0 + 
                SUM(CASE WHEN m.alignment_status = 'partially_aligned' THEN 1 ELSE 0 END) * 0.5) / 
               NULLIF(COUNT(m.id), 0) * 100 < 75 THEN 'Minor Gap'
          ELSE 'Adequate Coverage'
        END as gap_status
      FROM qc2m2_domains qd
      LEFT JOIN mappings m ON qd.id = m.domain_id
      LEFT JOIN documents d ON m.document_id = d.id
      WHERE d.id IN (${placeholders})
      GROUP BY qd.id, qd.domain_name, qd.domain_code, qd.description
      ORDER BY 
        CASE gap_status
          WHEN 'No Coverage' THEN 1
          WHEN 'Critical Gap' THEN 2
          WHEN 'Significant Gap' THEN 3
          WHEN 'Minor Gap' THEN 4
          ELSE 5
        END,
        alignment_percentage ASC
    `, docIds);
    
    res.json({
      gap_analysis: gapAnalysis,
      summary: {
        total_domains: gapAnalysis.length,
        no_coverage: gapAnalysis.filter(g => g.gap_status === 'No Coverage').length,
        critical_gaps: gapAnalysis.filter(g => g.gap_status === 'Critical Gap').length,
        significant_gaps: gapAnalysis.filter(g => g.gap_status === 'Significant Gap').length,
        minor_gaps: gapAnalysis.filter(g => g.gap_status === 'Minor Gap').length,
        adequate_coverage: gapAnalysis.filter(g => g.gap_status === 'Adequate Coverage').length
      }
    });
    
  } catch (error) {
    console.error('Gap analysis report error:', error);
    res.status(500).json({ error: 'Failed to generate gap analysis report' });
  }
});

// Generate recommendations report
router.get('/recommendations', async (req, res) => {
  try {
    const { document_ids } = req.query;
    
    if (!document_ids) {
      return res.status(400).json({ error: 'document_ids parameter is required' });
    }
    
    const docIds = document_ids.split(',').map(id => parseInt(id.trim()));
    const placeholders = docIds.map(() => '?').join(',');
    
    // Get domains with low alignment
    const lowAlignmentDomains = await query(`
      SELECT 
        qd.domain_name,
        qd.domain_code,
        qd.description,
        COUNT(m.id) as total_mappings,
        ROUND(
          (SUM(CASE WHEN m.alignment_status = 'fully_aligned' THEN 1 ELSE 0 END) * 1.0 + 
           SUM(CASE WHEN m.alignment_status = 'partially_aligned' THEN 1 ELSE 0 END) * 0.5) / 
          NULLIF(COUNT(m.id), 0) * 100, 2
        ) as alignment_percentage
      FROM qc2m2_domains qd
      LEFT JOIN mappings m ON qd.id = m.domain_id
      LEFT JOIN documents d ON m.document_id = d.id
      WHERE d.id IN (${placeholders})
      GROUP BY qd.id, qd.domain_name, qd.domain_code, qd.description
      HAVING alignment_percentage < 50 OR COUNT(m.id) = 0
      ORDER BY alignment_percentage ASC
    `, docIds);
    
    const recommendations = lowAlignmentDomains.map(domain => {
      let recommendation = '';
      let priority = '';
      
      if (domain.total_mappings === 0) {
        recommendation = `Develop comprehensive policies and procedures for ${domain.domain_name.toLowerCase()} domain. Consider establishing dedicated cybersecurity frameworks and governance structures.`;
        priority = 'High';
      } else if (domain.alignment_percentage < 25) {
        recommendation = `Strengthen existing ${domain.domain_name.toLowerCase()} policies. Review current implementations and enhance coverage for critical areas.`;
        priority = 'High';
      } else if (domain.alignment_percentage < 50) {
        recommendation = `Improve alignment in ${domain.domain_name.toLowerCase()} domain. Identify specific gaps and develop targeted improvements.`;
        priority = 'Medium';
      }
      
      return {
        domain_name: domain.domain_name,
        domain_code: domain.domain_code,
        description: domain.description,
        alignment_percentage: domain.alignment_percentage,
        total_mappings: domain.total_mappings,
        recommendation,
        priority
      };
    });
    
    res.json({
      recommendations,
      summary: {
        total_recommendations: recommendations.length,
        high_priority: recommendations.filter(r => r.priority === 'High').length,
        medium_priority: recommendations.filter(r => r.priority === 'Medium').length
      }
    });
    
  } catch (error) {
    console.error('Recommendations report error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations report' });
  }
});

module.exports = router; 