const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const { query, queryOne, run } = require('../database/database');

const router = express.Router();

// Optional: Enable CORS globally in your app.js/server.js file
// const cors = require('cors');
// app.use(cors({ origin: '*', exposedHeaders: ['Content-Disposition'] }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, DOC, and TXT files are allowed.'));
    }
  }
});

// Upload document
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { source, publication_date, relevant_agency } = req.body;
    const adminUser = await queryOne('SELECT id FROM users WHERE username = ?', ['admin']);
    const uploadedBy = req.user?.id || adminUser?.id || 1;

    let extractedText = '';
    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).toLowerCase();

    try {
      if (fileType === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        extractedText = data.text;
      } else if (fileType === '.docx' || fileType === '.doc') {
        const result = await mammoth.extractRawText({ path: filePath });
        extractedText = result.value;
      } else if (fileType === '.txt') {
        extractedText = fs.readFileSync(filePath, 'utf8');
      }
    } catch (extractError) {
      console.error('Text extraction error:', extractError);
    }

    const documentResult = await run(
      `INSERT INTO documents (filename, original_name, file_path, file_type, file_size, source, publication_date, relevant_agency, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.file.filename,
        req.file.originalname,
        req.file.path,
        fileType,
        req.file.size,
        source || null,
        publication_date || null,
        relevant_agency || null,
        uploadedBy
      ]
    );

    let sectionsCount = 0;
    if (extractedText) {
      const sections = splitTextIntoSections(extractedText);
      sectionsCount = sections.length;
      for (const section of sections) {
        await run(
          `INSERT INTO document_sections (document_id, section_text, section_start, section_end)
           VALUES (?, ?, ?, ?)`,
          [documentResult.id, section.text, section.start, section.end]
        );
      }
    }

    res.json({
      success: true,
      document: {
        id: documentResult.id,
        filename: req.file.filename,
        original_name: req.file.originalname,
        file_type: fileType,
        file_size: req.file.size,
        source,
        publication_date,
        relevant_agency,
        sections_count: sectionsCount
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Get all documents
router.get('/', async (req, res) => {
  try {
    const documents = await query(`
      SELECT d.*, u.username as uploaded_by_name,
             COUNT(ds.id) as sections_count,
             COUNT(m.id) as mappings_count
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN document_sections ds ON d.id = ds.document_id
      LEFT JOIN mappings m ON d.id = m.document_id
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `);

    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Serve document file (MUST come before /:id route)
router.get('/file/:id', async (req, res) => {
  try {
    const document = await queryOne('SELECT filename, file_path, file_type, original_name FROM documents WHERE id = ?', [req.params.id]);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(__dirname, '../uploads', document.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const ext = path.extname(document.filename).toLowerCase();
    const stat = fs.statSync(filePath);

    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${document.original_name}"`);
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    } else if (ext === '.docx' || ext === '.doc') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${document.original_name}"`);
    } else if (ext === '.txt') {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `inline; filename="${document.original_name}"`);
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('❌ Serve file error:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Get document by ID with sections
router.get('/:id', async (req, res) => {
  try {
    const document = await queryOne(`
      SELECT d.*, u.username as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.id = ?
    `, [req.params.id]);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const sections = await query(`
      SELECT ds.*, GROUP_CONCAT(t.name) as tags
      FROM document_sections ds
      LEFT JOIN section_tags st ON ds.id = st.section_id
      LEFT JOIN tags t ON st.tag_id = t.id
      WHERE ds.document_id = ?
      GROUP BY ds.id
      ORDER BY ds.section_start
    `, [req.params.id]);

    res.json({
      ...document,
      sections
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const document = await queryOne('SELECT file_path FROM documents WHERE id = ?', [req.params.id]);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await run('DELETE FROM stakeholder_insights WHERE related_mapping_id IN (SELECT id FROM mappings WHERE document_id = ?)', [req.params.id]);
    await run('DELETE FROM section_tags WHERE section_id IN (SELECT id FROM document_sections WHERE document_id = ?)', [req.params.id]);
    await run('DELETE FROM mappings WHERE document_id = ?', [req.params.id]);
    await run('DELETE FROM document_sections WHERE document_id = ?', [req.params.id]);
    await run('DELETE FROM documents WHERE id = ?', [req.params.id]);

    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Update document metadata
router.put('/:id', async (req, res) => {
  try {
    const { source, publication_date, relevant_agency } = req.body;

    await run(
      `UPDATE documents 
       SET source = ?, publication_date = ?, relevant_agency = ?
       WHERE id = ?`,
      [source, publication_date, relevant_agency, req.params.id]
    );

    res.json({ success: true, message: 'Document updated successfully' });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Helper function to split text into sections
function splitTextIntoSections(text, maxSectionLength = 1000) {
  const sections = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  let currentSection = '';
  let startIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();

    if (currentSection.length + sentence.length > maxSectionLength && currentSection.length > 0) {
      sections.push({
        text: currentSection.trim(),
        start: startIndex,
        end: startIndex + currentSection.length
      });

      currentSection = sentence;
      startIndex = text.indexOf(sentence, startIndex + currentSection.length);
    } else {
      if (currentSection.length === 0) {
        startIndex = text.indexOf(sentence);
      }
      currentSection += (currentSection.length > 0 ? '. ' : '') + sentence;
    }
  }

  if (currentSection.length > 0) {
    sections.push({
      text: currentSection.trim(),
      start: startIndex,
      end: startIndex + currentSection.length
    });
  }

  return sections;
}

module.exports = router;
