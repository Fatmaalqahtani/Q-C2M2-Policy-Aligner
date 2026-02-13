const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'q-c2m2.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'analyst',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Documents table
      db.run(`CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER,
        source TEXT,
        publication_date TEXT,
        relevant_agency TEXT,
        uploaded_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users (id)
      )`);

      // Q-C2M2 Domains table
      db.run(`CREATE TABLE IF NOT EXISTS qc2m2_domains (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain_name TEXT NOT NULL,
        domain_code TEXT UNIQUE NOT NULL,
        description TEXT,
        maturity_levels TEXT DEFAULT '1,2,3'
      )`);

      // Document sections table
      db.run(`CREATE TABLE IF NOT EXISTS document_sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER NOT NULL,
        section_text TEXT NOT NULL,
        section_start INTEGER,
        section_end INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents (id)
      )`);

      // Mappings table
      db.run(`CREATE TABLE IF NOT EXISTS mappings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER NOT NULL,
        section_id INTEGER,
        domain_id INTEGER NOT NULL,
        maturity_level INTEGER NOT NULL,
        alignment_status TEXT NOT NULL CHECK(alignment_status IN ('fully_aligned', 'partially_aligned', 'not_aligned')),
        notes TEXT,
        mapped_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents (id),
        FOREIGN KEY (section_id) REFERENCES document_sections (id),
        FOREIGN KEY (domain_id) REFERENCES qc2m2_domains (id),
        FOREIGN KEY (mapped_by) REFERENCES users (id)
      )`);

      // Tags table
      db.run(`CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#3B82F6',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Section tags table
      db.run(`CREATE TABLE IF NOT EXISTS section_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES document_sections (id),
        FOREIGN KEY (tag_id) REFERENCES tags (id)
      )`);

      // Stakeholder insights table
      db.run(`CREATE TABLE IF NOT EXISTS stakeholder_insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        stakeholder_name TEXT,
        insight_type TEXT DEFAULT 'interview',
        related_mapping_id INTEGER,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (related_mapping_id) REFERENCES mappings (id),
        FOREIGN KEY (created_by) REFERENCES users (id)
      )`);

      // Insert default Q-C2M2 domains
      db.run(`INSERT OR IGNORE INTO qc2m2_domains (domain_name, domain_code, description) VALUES 
        ('Understand', 'UNDERSTAND', 'Understanding cybersecurity risks and threats'),
        ('Secure', 'SECURE', 'Implementing security controls and measures'),
        ('Expose', 'EXPOSE', 'Detecting and identifying security incidents'),
        ('Recover', 'RECOVER', 'Responding to and recovering from incidents'),
        ('Sustain', 'SUSTAIN', 'Maintaining and improving cybersecurity capabilities')
      `);

      // Insert default tags
      db.run(`INSERT OR IGNORE INTO tags (name, color) VALUES 
        ('Incident Response', '#EF4444'),
        ('Data Governance', '#10B981'),
        ('Risk Management', '#F59E0B'),
        ('Compliance', '#8B5CF6'),
        ('Access Control', '#06B6D4'),
        ('Network Security', '#84CC16'),
        ('Business Continuity', '#F97316')
      `);

      db.run("PRAGMA foreign_keys = ON", (err) => {
        if (err) {
          console.error('Database initialization error:', err);
          reject(err);
        } else {
          console.log('✅ Database initialized successfully');
          resolve();
        }
      });
    });
  });
};

// Helper function for database queries
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Helper function for single row queries
const queryOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Helper function for insert/update/delete operations
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

module.exports = {
  db,
  initDatabase,
  query,
  queryOne,
  run
}; 