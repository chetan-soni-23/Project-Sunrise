import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { CheckSquare, Check, X, Clock, Plane, Building2, AlertCircle, Ban, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const Approvals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const response = await api.get('/bookings/approvals/all');
      setApprovals(response.data.approvals);
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approvalId, status) => {
    const comments = prompt(`Enter comments for ${status}:`) || '';
    
    setProcessing(approvalId);
    try {
      await api.put(`/bookings/approvals/${approvalId}`, {
        status,
        comments
      });
      toast.success(`Booking ${status} successfully`);
      fetchApprovals();
    } catch (error) {
      console.error('Failed to update approval:', error);
      toast.error(error.response?.data?.error || 'Failed to update approval');
    } finally {
      setProcessing(null);
    }
  };

  const filteredApprovals = filter === 'all'
    ? approvals
    : approvals.filter(a => a.approval_status === filter);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  const statusIcons = {
    pending: <Clock className="h-4 w-4" />,
    approved: <Check className="h-4 w-4" />,
    rejected: <X className="h-4 w-4" />,
    cancelled: <Ban className="h-4 w-4" />
  };

  // Count per status
  const counts = {
    all: approvals.length,
    pending: approvals.filter(a => a.approval_status === 'pending').length,
    approved: approvals.filter(a => a.approval_status === 'approved').length,
    rejected: approvals.filter(a => a.approval_status === 'rejected').length,
    cancelled: approvals.filter(a => a.approval_status === 'cancelled').length
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
      <div className="flex items-center space-x-3">
        <CheckSquare className="h-8 w-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-primary-800">Approvals</h1>
        <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
          {counts.pending} pending
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'approved', 'rejected', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
            }`}
          >
            {status === 'pending' && <Clock className="h-4 w-4" />}
            {status === 'approved' && <Check className="h-4 w-4" />}
            {status === 'rejected' && <X className="h-4 w-4" />}
            {status === 'cancelled' && <Ban className="h-4 w-4" />}
            {status === 'all' && <CheckSquare className="h-4 w-4" />}
            <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
            {counts[status] > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                filter === status ? 'bg-white/20 text-white' : 'bg-secondary-200 text-secondary-600'
              }`}>
                {counts[status]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Approval Cards */}
      {filteredApprovals.length > 0 ? (
        <div className="space-y-4">
          {filteredApprovals.map((approval) => (
            <div
              key={approval.approval_id}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${
                    approval.booking_type === 'flight' 
                      ? 'bg-primary-100' 
                      : 'bg-green-100'
                  }`}>
                    {approval.booking_type === 'flight' ? (
                      <Plane className="h-6 w-6 text-primary-600" />
                    ) : (
                      <Building2 className="h-6 w-6 text-green-600" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-primary-800">
                        {approval.booking_type === 'flight' 
                          ? `${approval.from_city} → ${approval.to_city}`
                          : approval.hotel_name
                        }
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[approval.approval_status]}`}>
                        {statusIcons[approval.approval_status]}
                        <span className="ml-1">{approval.approval_status}</span>
                      </span>
                    </div>
                    <p className="text-sm text-secondary-500 mt-1">
                      Requested by: <span className="font-medium">{approval.employee_name}</span>
                      ({approval.employee_designation})
                    </p>
                    {approval.delegated_from_name && (
                      <p className="text-sm text-blue-600 mt-1 flex items-center space-x-1">
                        <ArrowRightLeft className="h-3 w-3" />
                        <span>Delegated by <span className="font-medium">{approval.delegated_from_name}</span></span>
                      </p>
                    )}
                    <p className="text-sm text-secondary-500">
                      {approval.booking_type === 'flight'
                        ? `Flight Class: ${approval.flight_class || 'Economy'}`
                        : `${approval.hotel_city} • ${approval.hotel_stars || 3} Stars`
                      }
                    </p>
                    <p className="text-sm text-secondary-500">
                      Travel Date: {new Date(approval.travel_date || approval.created_at).toLocaleDateString()}
                    </p>
                    {approval.notes && (
                      <p className="text-xs text-secondary-400 mt-1">Notes: {approval.notes}</p>
                    )}
                    {approval.approval_comments && (
                      <p className="text-xs text-secondary-400 mt-1 italic">
                        "{approval.approval_comments}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold text-primary-800">
                    ₹{(approval.total_cost || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-secondary-400">
                    {new Date(approval.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Policy Compliance Warning */}
              {approval.policy_compliant === false && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">⚠️ Policy Violations:</p>
                  <ul className="list-disc list-inside text-sm text-red-600 mt-1">
                    {approval.policy_violations?.map((violation, index) => (
                      <li key={index}>{violation}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions — only show for pending approvals */}
              {approval.approval_status === 'pending' && (
                <div className="mt-4 pt-4 border-t border-secondary-200 flex items-center space-x-4">
                  <button
                    onClick={() => handleApproval(approval.approval_id, 'approved')}
                    disabled={processing === approval.approval_id}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Check className="h-5 w-5" />
                    <span>{processing === approval.approval_id ? 'Processing...' : 'Approve'}</span>
                  </button>
                  <button
                    onClick={() => handleApproval(approval.approval_id, 'rejected')}
                    disabled={processing === approval.approval_id}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                    <span>{processing === approval.approval_id ? 'Processing...' : 'Reject'}</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <CheckSquare className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-600">No {filter} approvals</h3>
          <p className="text-secondary-500 mt-1">
            {filter === 'all'
              ? "No approvals found."
              : filter === 'pending'
                ? "All booking requests have been reviewed."
                : `No ${filter} approvals found.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Approvals;
