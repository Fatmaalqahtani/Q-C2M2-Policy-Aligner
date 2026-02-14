# Q-C2M2 Policy Aligner

A comprehensive web-based application for mapping and analyzing Qatar's cybersecurity laws and policies against the Qatar Cybersecurity Capability Maturity Model (Q-C2M2).

## 🎯 Overview

The Q-C2M2 Policy Aligner is designed to support qualitative analysis and mapping of cybersecurity policies and legal documents against the Q-C2M2 framework. It provides tools for document management, policy mapping, gap analysis, and report generation to support research and policy development.

## ✨ Features

### 📄 Document Management
- Upload and manage policy/legal documents (PDF, DOCX, DOC, TXT)
- Automatic text extraction and sectioning
- Document metadata tagging (source, publication date, relevant agency)
- Document versioning and organization

### 🗺️ Q-C2M2 Framework Integration
- Complete implementation of Q-C2M2 domains:
  - **Understand**: Understanding cybersecurity risks and threats
  - **Secure**: Implementing security controls and measures
  - **Expose**: Detecting and identifying security incidents
  - **Recover**: Responding to and recovering from incidents
  - **Sustain**: Maintaining and improving cybersecurity capabilities
- Maturity level assessment (Level 1-3)
- Interactive domain mapping interface

### 🔗 Mapping and Alignment Module
- Manual mapping of legal clauses to Q-C2M2 domains
- Drag-and-drop and dropdown mapping interfaces
- Alignment status classification:
  - ✅ Fully Aligned
  - ⚠️ Partially Aligned
  - ❌ Not Aligned
- Maturity level assignment
- Notes and commentary support

### 📄 Users Management
- Create or delete users
- add new user
- handle users roles
 
### 🏷️ Thematic Tagging & Coding
- Custom tag system for text sections
- Multiple tag support per section
- Color-coded tagging system
- Qualitative analysis support

### 📊 Gap Analysis & Reporting
- Visual gap matrix generation
- Domain coverage analysis
- Areas of concern identification
- Export capabilities (JSON format)
- Comprehensive reporting system

### 🔒 Security & Access Control
- Role-based access control
- User authentication system
- Secure file storage
- GDPR-compliant data handling

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd q-c2m2-policy-aligner
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Initialize the database**
   ```bash
   cd server
   npm run dev
   ```
   The database will be automatically initialized on first run.

4. **Start the development servers**
   ```bash
   # From the root directory
   npm run dev
   ```

5. **Access the application**
   - WenSite: http://localhost:5000

### Default Login
- Username: `admin`
- Password: `password`

## 📁 Project Structure

```
q-c2m2-policy-aligner/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── ...
│   └── package.json
├── server/                 # Node.js backend
│   ├── database/           # Database setup and models
│   ├── routes/             # API route handlers
│   ├── uploads/            # File upload directory
│   └── ...
├── package.json            # Root package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the server directory:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key-here
```

### Database
The application uses SQLite for data storage. The database file will be automatically created at `server/database/q-c2m2.db`.

## 📖 Usage Guide

### 1. Document Upload
1. Navigate to the Documents page
2. Click "Upload Document"
3. Fill in metadata (source, publication date, relevant agency)
4. Drag and drop or select your document
5. The system will automatically extract text and create sections

### 2. Policy Mapping
1. Go to the Mapping page
2. Select a document from the list
3. Click "Create Mapping"
4. Choose the appropriate Q-C2M2 domain
5. Set maturity level and alignment status
6. Add notes and save

### 3. Analysis
1. Visit the Analysis page
2. Select documents for analysis
3. View gap matrix and coverage charts
4. Identify areas of concern

### 4. Reports
1. Navigate to the Reports page
2. Select documents and report type
3. Generate comprehensive, gap analysis, or recommendations reports
4. Download reports in JSON format

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Documents
- `GET /api/documents` - List all documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:id` - Get document details
- `DELETE /api/documents/:id` - Delete document

### Mappings
- `GET /api/mappings` - List mappings
- `POST /api/mappings` - Create mapping
- `PUT /api/mappings/:id` - Update mapping
- `DELETE /api/mappings/:id` - Delete mapping
- `GET /api/mappings/statistics` - Get mapping statistics

### Analysis
- `GET /api/analysis/gap-matrix` - Generate gap matrix
- `GET /api/analysis/domain-coverage` - Get domain coverage
- `GET /api/analysis/areas-of-concern` - Identify areas of concern

### Reports
- `GET /api/reports/comprehensive` - Comprehensive analysis report
- `GET /api/reports/gap-analysis` - Gap analysis report
- `GET /api/reports/recommendations` - Recommendations report

## 🎨 Technology Stack

### Frontend
- **React 18** - UI framework
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **React Dropzone** - File upload
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database
- **Multer** - File upload handling
- **Mammoth** - DOCX parsing
- **PDF-Parse** - PDF text extraction
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- File upload security
- CORS protection
- Rate limiting

## 📊 Data Export

The application supports exporting analysis data in JSON format for:
- Comprehensive analysis reports
- Gap analysis matrices
- Recommendations and action items
- Mapping data and statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions, please contact the development team or create an issue in the repository.

## 🔄 Updates and Maintenance

- Regular security updates
- Database maintenance
- Performance optimizations
- Feature enhancements

---


**Q-C2M2 Policy Aligner** - Empowering cybersecurity policy analysis through intelligent mapping and comprehensive reporting. 

