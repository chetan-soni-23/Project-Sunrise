import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Plus, Trash2, Calendar, Clock, AlertCircle, Users, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const Delegations = () => {
  const { user } = useAuth();
  const [delegations, setDelegations] = useState([]);
  const [delegatedToMe, setDelegatedToMe] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('mine');
  const [formData, setFormData] = useState({
    delegatedToId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [delegationsRes, delegatedToMeRes, approversRes] = await Promise.all([
        api.get('/delegations'),
        api.get('/delegations/received'),
        api.get('/delegations/approvers')
      ]);
      setDelegations(delegationsRes.data.delegations);
      setDelegatedToMe(delegatedToMeRes.data.delegations);
      setApprovers(approversRes.data.approvers.filter(a => a.id !== user.id));
    } catch (error) {
      console.error('Failed to fetch delegations:', error);
      toast.error('Failed to load delegations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.delegatedToId) {
      toast.error('Please select a delegate');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/delegations', formData);
      toast.success('Delegation created successfully');
      setShowForm(false);
      setFormData({ delegatedToId: '', startDate: '', endDate: '', reason: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to create delegation:', error);
      toast.error(error.response?.data?.error || 'Failed to create delegation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (delegationId) => {
    if (!confirm('Are you sure you want to revoke this delegation?')) {
      return;
    }

    try {
      await api.delete(`/delegations/${delegationId}`);
      toast.success('Delegation revoked successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to revoke delegation:', error);
      toast.error('Failed to revoke delegation');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No end date';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isActive = (delegation) => {
    if (!delegation.is_active) return false;
    const now = new Date();
    if (delegation.start_date && new Date(delegation.start_date) > now) return false;
    if (delegation.end_date && new Date(delegation.end_date) < now) return false;
    return true;
  };

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
          <UserCheck className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-primary-800">Approval Delegation</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>New Delegation</span>
        </button>
      </div>

      {/* Info Card */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800">How Delegation Works</h3>
            <p className="text-sm text-blue-600 mt-1">
              Delegate your approval authority to another approver when you're unavailable. 
              Bookings that would normally require your approval will be routed to your delegate instead.
              You can set optional date ranges for temporary delegations.
            </p>
          </div>
        </div>
      </div>

      {/* Create Delegation Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-primary-800 mb-4">Create New Delegation</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Delegate To *
                </label>
                <select
                  value={formData.delegatedToId}
                  onChange={(e) => setFormData({ ...formData, delegatedToId: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select an approver</option>
                  {approvers.map((approver) => (
                    <option key={approver.id} value={approver.id}>
                      {approver.name} ({approver.email}) - {approver.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g., On leave, Business trip"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Delegation'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-secondary-200 text-secondary-700 px-4 py-2 rounded-lg hover:bg-secondary-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-secondary-200">
        <button
          onClick={() => setActiveTab('mine')}
          className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'mine'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-secondary-500 hover:text-secondary-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <ArrowRightLeft className="h-4 w-4" />
            <span>My Delegations</span>
            {delegations.length > 0 && (
              <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-xs">
                {delegations.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'received'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-secondary-500 hover:text-secondary-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Delegated to Me</span>
            {delegatedToMe.length > 0 && (
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                {delegatedToMe.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* My Delegations Tab */}
      {activeTab === 'mine' && (
        <div className="space-y-4">
          {delegations.length > 0 ? (
            delegations.map((delegation) => (
              <div
                key={delegation.id}
                className={`card ${isActive(delegation) ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-secondary-300'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${isActive(delegation) ? 'bg-green-100' : 'bg-secondary-100'}`}>
                      <UserCheck className={`h-6 w-6 ${isActive(delegation) ? 'text-green-600' : 'text-secondary-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-primary-800">
                          Delegated to {delegation.delegated_to_name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isActive(delegation) 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-secondary-100 text-secondary-600'
                        }`}>
                          {isActive(delegation) ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-secondary-500 mt-1">
                        {delegation.delegated_to_email}
                      </p>
                      {delegation.reason && (
                        <p className="text-sm text-secondary-500 mt-1">
                          Reason: <span className="font-medium">{delegation.reason}</span>
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-secondary-400">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Created: {formatDate(delegation.created_at)}</span>
                        </span>
                        {delegation.start_date && (
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Start: {formatDate(delegation.start_date)}</span>
                          </span>
                        )}
                        {delegation.end_date && (
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>End: {formatDate(delegation.end_date)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isActive(delegation) && (
                    <button
                      onClick={() => handleRevoke(delegation.id)}
                      className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Revoke</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="card text-center py-12">
              <ArrowRightLeft className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-600">No delegations created</h3>
              <p className="text-secondary-500 mt-1">
                You haven't delegated your approval authority to anyone yet.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create Your First Delegation
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delegated to Me Tab */}
      {activeTab === 'received' && (
        <div className="space-y-4">
          {delegatedToMe.length > 0 ? (
            delegatedToMe.map((delegation) => (
              <div
                key={delegation.id}
                className="card border-l-4 border-l-blue-500"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <UserCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-primary-800">
                        Delegated by {delegation.original_approver_name}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-secondary-500 mt-1">
                      {delegation.original_approver_email}
                    </p>
                    {delegation.reason && (
                      <p className="text-sm text-secondary-500 mt-1">
                        Reason: <span className="font-medium">{delegation.reason}</span>
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-secondary-400">
                      {delegation.start_date && (
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Start: {formatDate(delegation.start_date)}</span>
                        </span>
                      )}
                      {delegation.end_date && (
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>End: {formatDate(delegation.end_date)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="card text-center py-12">
              <Users className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-600">No delegations received</h3>
              <p className="text-secondary-500 mt-1">
                No one has delegated their approval authority to you yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Delegations;
