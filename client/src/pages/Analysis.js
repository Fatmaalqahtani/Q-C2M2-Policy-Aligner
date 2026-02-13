import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, AlertTriangle, TrendingUp, FileText } from 'lucide-react';

const Analysis = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [gapMatrix, setGapMatrix] = useState([]);
  const [domainCoverage, setDomainCoverage] = useState([]);
  const [areasOfConcern, setAreasOfConcern] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (selectedDocuments.length > 0) {
      fetchAnalysisData();
    }
  }, [selectedDocuments]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('/api/documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      const documentIds = selectedDocuments.map(d => d.id).join(',');
      
      const [gapMatrixRes, coverageRes, concernsRes] = await Promise.all([
        axios.get(`/api/analysis/gap-matrix?document_ids=${documentIds}`),
        axios.get(`/api/analysis/domain-coverage?document_ids=${documentIds}`),
        axios.get(`/api/analysis/areas-of-concern?document_ids=${documentIds}`)
      ]);
      
      setGapMatrix(gapMatrixRes.data);
      setDomainCoverage(coverageRes.data);
      setAreasOfConcern(concernsRes.data);
    } catch (error) {
      console.error('Error fetching analysis data:', error);
    } finally {
      setLoading(false);
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

  const getCoverageColor = (status) => {
    switch (status) {
      case 'strong_coverage':
        return '#22c55e';
      case 'partial_coverage':
        return '#f59e0b';
      case 'weak_coverage':
        return '#ef4444';
      case 'no_coverage':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getAlignmentColor = (percentage) => {
    if (percentage >= 75) return '#22c55e';
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analysis</h1>
        <p className="text-gray-600 mt-2">Analyze gaps and coverage across Q-C2M2 domains</p>
      </div>

      {/* Document Selection */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Documents for Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const isSelected = selectedDocuments.find(d => d.id === doc.id);
            return (
              <div
                key={doc.id}
                onClick={() => handleDocumentToggle(doc)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors duration-200 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{doc.original_name}</h3>
                    <p className="text-sm text-gray-500">{doc.relevant_agency || 'No agency'}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDocuments.length === 0 ? (
        <div className="card text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents selected</h3>
          <p className="text-gray-500">Select documents above to view analysis</p>
        </div>
      ) : (
        <>
          {/* Domain Coverage Chart */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Domain Coverage</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={domainCoverage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="domain_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="alignment_percentage" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gap Matrix */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Gap Analysis Matrix</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Domain
                    </th>
                    {selectedDocuments.map((doc) => (
                      <th key={doc.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {doc.original_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {['Understand', 'Secure', 'Expose', 'Recover', 'Sustain'].map((domain) => (
                    <tr key={domain}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {domain}
                      </td>
                      {selectedDocuments.map((doc) => {
                        const mapping = gapMatrix.find(
                          m => m.domain_name === domain && m.document_id === doc.id
                        );
                        const coverageStatus = mapping?.coverage_status || 'no_coverage';
                        const color = getCoverageColor(coverageStatus);
                        
                        return (
                          <td key={doc.id} className="px-6 py-4 whitespace-nowrap">
                            <div
                              className="w-8 h-8 rounded-full mx-auto"
                              style={{ backgroundColor: color }}
                              title={`${mapping?.total_mappings || 0} mappings`}
                            ></div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Areas of Concern */}
          {areasOfConcern.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Areas of Concern</h2>
              <div className="space-y-4">
                {areasOfConcern.map((concern) => (
                  <div key={concern.domain_code} className="border border-warning-200 rounded-lg p-4 bg-warning-50">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-warning-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{concern.domain_name}</h3>
                        <p className="text-sm text-gray-600">{concern.description}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Alignment:</span>
                        <span className="ml-2 font-medium">{concern.alignment_percentage}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Mappings:</span>
                        <span className="ml-2 font-medium">{concern.total_mappings}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Fully Aligned:</span>
                        <span className="ml-2 font-medium">{concern.fully_aligned}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Partially Aligned:</span>
                        <span className="ml-2 font-medium">{concern.partially_aligned}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-primary-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Alignment</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {domainCoverage.length > 0 
                      ? (domainCoverage.reduce((sum, d) => sum + (d.alignment_percentage || 0), 0) / domainCoverage.length).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-success-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Mappings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {domainCoverage.reduce((sum, d) => sum + (d.total_mappings || 0), 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-warning-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Areas of Concern</p>
                  <p className="text-2xl font-bold text-gray-900">{areasOfConcern.length}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analysis; 