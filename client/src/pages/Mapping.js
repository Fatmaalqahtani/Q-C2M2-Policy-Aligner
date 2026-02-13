import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Map, Plus, Edit, Trash2, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const Mapping = () => {
  const [documents, setDocuments] = useState([]);
  const [domains, setDomains] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [mappingForm, setMappingForm] = useState({
    domain_id: '',
    maturity_level: 1,
    alignment_status: 'fully_aligned',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [documentsRes, domainsRes, mappingsRes] = await Promise.all([
        axios.get('/api/documents'),
        axios.get('/api/mappings/domains'),
        axios.get('/api/mappings')
      ]);
      
      setDocuments(documentsRes.data);
      setDomains(domainsRes.data);
      setMappings(mappingsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMapping = async () => {
    if (!selectedDocument || !mappingForm.domain_id) {
      toast.error('Please select a document and domain');
      return;
    }

    try {
      const mappingData = {
        document_id: selectedDocument.id,
        domain_id: mappingForm.domain_id,
        maturity_level: mappingForm.maturity_level,
        alignment_status: mappingForm.alignment_status,
        notes: mappingForm.notes
      };

      await axios.post('/api/mappings', mappingData);
      toast.success('Mapping created successfully!');
      setShowMappingModal(false);
      setMappingForm({
        domain_id: '',
        maturity_level: 1,
        alignment_status: 'fully_aligned',
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating mapping:', error);
      toast.error(error.response?.data?.error || 'Failed to create mapping');
    }
  };

  const handleDeleteMapping = async (mappingId) => {
    if (!window.confirm('Are you sure you want to delete this mapping?')) {
      return;
    }

    try {
      await axios.delete(`/api/mappings/${mappingId}`);
      toast.success('Mapping deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast.error('Failed to delete mapping');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'fully_aligned':
        return <CheckCircle className="w-4 h-4 text-success-600" />;
      case 'partially_aligned':
        return <Clock className="w-4 h-4 text-warning-600" />;
      case 'not_aligned':
        return <AlertTriangle className="w-4 h-4 text-danger-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'fully_aligned':
        return `${baseClasses} bg-success-100 text-success-800`;
      case 'partially_aligned':
        return `${baseClasses} bg-warning-100 text-warning-800`;
      case 'not_aligned':
        return `${baseClasses} bg-danger-100 text-danger-800`;
      default:
        return baseClasses;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Q-C2M2 Mapping</h1>
          <p className="text-gray-600 mt-2">Map document content to Q-C2M2 domains</p>
        </div>
        <button
          onClick={() => setShowMappingModal(true)}
          className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Mapping</span>
        </button>
      </div>

      {/* Document Selection */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Document</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDocument(doc)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors duration-200 ${
                selectedDocument?.id === doc.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <h3 className="font-medium text-gray-900">{doc.original_name}</h3>
              <p className="text-sm text-gray-500">{doc.relevant_agency || 'No agency'}</p>
              <p className="text-sm text-gray-500">{doc.mappings_count || 0} mappings</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mappings List */}
      {selectedDocument && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Mappings for {selectedDocument.original_name}
          </h2>
          
          {mappings.filter(m => m.document_id === selectedDocument.id).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Map className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No mappings for this document yet</p>
              <button
                onClick={() => setShowMappingModal(true)}
                className="btn-primary mt-2"
              >
                Create First Mapping
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Maturity Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alignment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mappings
                    .filter(m => m.document_id === selectedDocument.id)
                    .map((mapping) => (
                      <tr key={mapping.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {mapping.domain_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {mapping.domain_code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Level {mapping.maturity_level}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(mapping.alignment_status)}>
                            {getStatusIcon(mapping.alignment_status)}
                            <span className="ml-1">
                              {mapping.alignment_status.replace('_', ' ')}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {mapping.notes || 'No notes'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteMapping(mapping.id)}
                            className="text-danger-600 hover:text-danger-900"
                            title="Delete mapping"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Mapping Modal */}
      {showMappingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Mapping</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document
                  </label>
                  <select
                    value={selectedDocument?.id || ''}
                    onChange={(e) => {
                      const doc = documents.find(d => d.id === parseInt(e.target.value));
                      setSelectedDocument(doc);
                    }}
                    className="input-field"
                  >
                    <option value="">Select a document</option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.original_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Q-C2M2 Domain
                  </label>
                  <select
                    value={mappingForm.domain_id}
                    onChange={(e) => setMappingForm({...mappingForm, domain_id: e.target.value})}
                    className="input-field"
                  >
                    <option value="">Select a domain</option>
                    {domains.map((domain) => (
                      <option key={domain.id} value={domain.id}>
                        {domain.domain_name} - {domain.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maturity Level
                  </label>
                  <select
                    value={mappingForm.maturity_level}
                    onChange={(e) => setMappingForm({...mappingForm, maturity_level: parseInt(e.target.value)})}
                    className="input-field"
                  >
                    <option value={1}>Level 1 - Initial</option>
                    <option value={2}>Level 2 - Managed</option>
                    <option value={3}>Level 3 - Defined</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alignment Status
                  </label>
                  <select
                    value={mappingForm.alignment_status}
                    onChange={(e) => setMappingForm({...mappingForm, alignment_status: e.target.value})}
                    className="input-field"
                  >
                    <option value="fully_aligned">✅ Fully Aligned</option>
                    <option value="partially_aligned">⚠️ Partially Aligned</option>
                    <option value="not_aligned">❌ Not Aligned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={mappingForm.notes}
                    onChange={(e) => setMappingForm({...mappingForm, notes: e.target.value})}
                    placeholder="Add notes about this mapping..."
                    className="input-field"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowMappingModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMapping}
                  className="btn-primary"
                >
                  Create Mapping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mapping; 