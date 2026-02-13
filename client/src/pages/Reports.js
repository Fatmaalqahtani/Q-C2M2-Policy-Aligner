import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FileBarChart, Download, Eye, Calendar, AlertTriangle } from 'lucide-react';

const Reports = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('comprehensive');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('/api/documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleDocumentToggle = (document) => {
    setSelectedDocuments(prev => {
      const isSelected = prev.find(d => d.id === document.id);
      if (isSelected) {
        return prev.filter(d => d.id !== document.id);
      } else {
        return [...prev, document];
      }
    });
  };

  const generateReport = async () => {
    if (selectedDocuments.length === 0) {
      toast.error('Please select at least one document');
      return;
    }

    try {
      setLoading(true);
      const documentIds = selectedDocuments.map(d => d.id).join(',');
      
      let reportData;
      switch (reportType) {
        case 'comprehensive':
          reportData = await axios.get(`/api/reports/comprehensive?document_ids=${documentIds}`);
          break;
        case 'gap-analysis':
          reportData = await axios.get(`/api/reports/gap-analysis?document_ids=${documentIds}`);
          break;
        case 'recommendations':
          reportData = await axios.get(`/api/reports/recommendations?document_ids=${documentIds}`);
          break;
        default:
          reportData = await axios.get(`/api/reports/comprehensive?document_ids=${documentIds}`);
      }

      const newReport = {
        id: Date.now(),
        type: reportType,
        documents: selectedDocuments.map(d => d.original_name),
        data: reportData.data,
        generatedAt: new Date().toISOString()
      };

      setReports(prev => [newReport, ...prev]);
      toast.success('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (report) => {
    const dataStr = JSON.stringify(report.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `q-c2m2-report-${report.type}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getReportTypeLabel = (type) => {
    switch (type) {
      case 'comprehensive':
        return 'Comprehensive Analysis';
      case 'gap-analysis':
        return 'Gap Analysis';
      case 'recommendations':
        return 'Recommendations';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-2">Generate and download analysis reports</p>
      </div>

      {/* Report Generation */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Report</h2>
        
        <div className="space-y-4">
          {/* Document Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Documents
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => {
                const isSelected = selectedDocuments.find(d => d.id === doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleDocumentToggle(doc)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors duration-200 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">{doc.original_name}</h3>
                        <p className="text-xs text-gray-500">{doc.relevant_agency || 'No agency'}</p>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input-field"
            >
              <option value="comprehensive">Comprehensive Analysis</option>
              <option value="gap-analysis">Gap Analysis</option>
              <option value="recommendations">Recommendations</option>
            </select>
          </div>

          {/* Generate Button */}
          <div>
            <button
              onClick={generateReport}
              disabled={loading || selectedDocuments.length === 0}
              className="btn-primary flex items-center space-x-2"
            >
              <FileBarChart className="w-4 h-4" />
              <span>{loading ? 'Generating...' : 'Generate Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated Reports */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Reports</h2>
        
        {reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileBarChart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports generated yet</h3>
            <p className="text-gray-500">Generate your first report above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileBarChart className="w-5 h-5 text-primary-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {getReportTypeLabel(report.type)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {report.documents.length} document(s) • {formatDate(report.generatedAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => downloadReport(report)}
                      className="text-primary-600 hover:text-primary-700"
                      title="Download report"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Report Summary */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {report.type === 'comprehensive' && report.data.summary && (
                    <>
                      <div>
                        <span className="text-gray-500">Total Mappings:</span>
                        <span className="ml-2 font-medium">{report.data.summary.total_mappings}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Alignment Score:</span>
                        <span className="ml-2 font-medium">{report.data.summary.overall_alignment_score}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Areas of Concern:</span>
                        <span className="ml-2 font-medium">{report.data.summary.domains_with_concerns}</span>
                      </div>
                    </>
                  )}

                  {report.type === 'gap-analysis' && report.data.summary && (
                    <>
                      <div>
                        <span className="text-gray-500">Total Domains:</span>
                        <span className="ml-2 font-medium">{report.data.summary.total_domains}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Critical Gaps:</span>
                        <span className="ml-2 font-medium">{report.data.summary.critical_gaps}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Significant Gaps:</span>
                        <span className="ml-2 font-medium">{report.data.summary.significant_gaps}</span>
                      </div>
                    </>
                  )}

                  {report.type === 'recommendations' && report.data.summary && (
                    <>
                      <div>
                        <span className="text-gray-500">Total Recommendations:</span>
                        <span className="ml-2 font-medium">{report.data.summary.total_recommendations}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">High Priority:</span>
                        <span className="ml-2 font-medium">{report.data.summary.high_priority}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Medium Priority:</span>
                        <span className="ml-2 font-medium">{report.data.summary.medium_priority}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports; 