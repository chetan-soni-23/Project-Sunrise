import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Shield, Plus, Edit2, Trash2, Plane, Building2, CheckCircle,
  XCircle, X, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

const PolicyManagement = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    designation: '',
    maxFlightClass: 'economy',
    maxHotelStars: 3,
    requiresApproval: true
  });

  const designations = [
    'Junior Executive', 'Executive', 'Senior Executive',
    'Manager', 'Senior Manager', 'Director', 'VP', 'SVP', 'CEO/Founder'
  ];

  const flightClasses = ['economy', 'premium_economy', 'business', 'first'];

  useEffect(() => { fetchPolicies(); }, []);

  const fetchPolicies = async () => {
    try {
      const response = await api.get('/policies');
      setPolicies(response.data.policies);
    } catch (error) {
      console.error('Failed to fetch policies:', error);
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPolicy(null);
    setFormData({
      designation: '',
      maxFlightClass: 'economy',
      maxHotelStars: 3,
      requiresApproval: true
    });
    setShowModal(true);
  };

  const openEditModal = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      designation: policy.designation,
      maxFlightClass: policy.max_flight_class,
      maxHotelStars: policy.max_hotel_stars,
      requiresApproval: policy.requires_approval
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.designation) {
      toast.error('Designation is required');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/policies', formData);
      toast.success(editingPolicy ? 'Policy updated' : 'Policy created');
      setShowModal(false);
      fetchPolicies();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (designation) => {
    if (!confirm(`Delete policy for '${designation}'? Users with this designation will have no travel policy.`)) {
      return;
    }

    try {
      await api.delete(`/policies/${encodeURIComponent(designation)}`);
      toast.success(`Policy for '${designation}' deleted`);
      fetchPolicies();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete policy');
    }
  };

  const flightClassLabel = (val) => {
    const labels = { economy: 'Economy', premium_economy: 'Premium Economy', business: 'Business', first: 'First' };
    return labels[val] || val;
  };

  const flightClassColor = (val) => {
    const colors = { economy: 'bg-secondary-100 text-secondary-700', premium_economy: 'bg-blue-100 text-blue-700', business: 'bg-purple-100 text-purple-700', first: 'bg-amber-100 text-amber-700' };
    return colors[val] || 'bg-secondary-100 text-secondary-700';
  };

  // Designations without a policy
  const uncoveredDesignations = designations.filter(
    d => !policies.find(p => p.designation === d)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-primary-800">Travel Policies</h1>
          <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
            {policies.length} policies
          </span>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Policy</span>
        </button>
      </div>

      {/* Warning for uncovered designations */}
      {uncoveredDesignations.length > 0 && (
        <div className="card bg-yellow-50 border border-yellow-200">
          <div className="flex items-start space-x-3">
            <XCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Designations without policies</h3>
              <p className="text-sm text-yellow-600 mt-1">
                These designations have no travel policy:{' '}
                <span className="font-medium">{uncoveredDesignations.join(', ')}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Policies Table */}
      {policies.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Designation</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Max Flight Class</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Max Hotel Stars</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Requires Approval</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {policies.map((policy) => (
                  <tr key={policy.designation} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-primary-800">{policy.designation}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${flightClassColor(policy.max_flight_class)}`}>
                        <Plane className="h-3 w-3 mr-1" />
                        {flightClassLabel(policy.max_flight_class)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Building2
                            key={i}
                            className={`h-4 w-4 ${i < policy.max_hotel_stars ? 'text-amber-400' : 'text-secondary-200'}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {policy.requires_approval ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEditModal(policy)}
                          className="p-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit policy"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(policy.designation)}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete policy"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <Shield className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-600">No policies configured</h3>
          <p className="text-secondary-500 mt-1">Create travel policies for each designation.</p>
          <button onClick={openCreateModal}
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
            Create First Policy
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200">
              <h2 className="text-lg font-semibold text-primary-800">
                {editingPolicy ? 'Edit Policy' : 'Create Policy'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-secondary-400 hover:text-secondary-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Designation *</label>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleFormChange}
                  disabled={!!editingPolicy}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-secondary-100"
                  required
                >
                  <option value="">Select designation</option>
                  {designations.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {editingPolicy && (
                  <p className="text-xs text-secondary-500 mt-1">Designation cannot be changed</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Max Flight Class *</label>
                <select
                  name="maxFlightClass"
                  value={formData.maxFlightClass}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {flightClasses.map(fc => (
                    <option key={fc} value={fc}>{flightClassLabel(fc)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Max Hotel Stars *</label>
                <select
                  name="maxHotelStars"
                  value={formData.maxHotelStars}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {[1, 2, 3, 4, 5].map(s => (
                    <option key={s} value={s}>{s} Star{s > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="requiresApproval"
                  name="requiresApproval"
                  checked={formData.requiresApproval}
                  onChange={handleFormChange}
                  className="h-4 w-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="requiresApproval" className="text-sm font-medium text-secondary-700">
                  Requires approval before booking
                </label>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button type="submit" disabled={submitting}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>{submitting ? 'Saving...' : editingPolicy ? 'Update Policy' : 'Create Policy'}</span>
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="bg-secondary-200 text-secondary-700 px-4 py-2 rounded-lg hover:bg-secondary-300 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyManagement;
