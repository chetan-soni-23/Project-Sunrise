import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Plane, Building2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/my-bookings');
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel booking');
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    ticketed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  const statusIcons = {
    pending: <Clock className="h-4 w-4" />,
    approved: <CheckCircle className="h-4 w-4" />,
    rejected: <XCircle className="h-4 w-4" />,
    ticketed: <CheckCircle className="h-4 w-4" />,
    cancelled: <AlertCircle className="h-4 w-4" />
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-primary-800">My Bookings</h1>
        </div>
        <div className="flex space-x-2">
          {['all', 'pending', 'approved', 'rejected', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${
                    booking.booking_type === 'flight' 
                      ? 'bg-primary-100' 
                      : 'bg-green-100'
                  }`}>
                    {booking.booking_type === 'flight' ? (
                      <Plane className="h-6 w-6 text-primary-600" />
                    ) : (
                      <Building2 className="h-6 w-6 text-green-600" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-primary-800">
                      {booking.booking_type === 'flight' 
                        ? `${booking.from_city} → ${booking.to_city}`
                        : booking.hotel_name
                      }
                    </h3>
                    <p className="text-sm text-secondary-500 mt-1">
                      {booking.booking_type === 'flight'
                        ? `Flight Class: ${booking.flight_class || 'Economy'}`
                        : `${booking.hotel_city} • ${booking.hotel_stars || 3} Stars`
                      }
                    </p>
                    <p className="text-sm text-secondary-500">
                      {new Date(booking.travel_date || booking.created_at).toLocaleDateString()}
                      {booking.return_date && ` - ${new Date(booking.return_date).toLocaleDateString()}`}
                    </p>
                    {booking.notes && (
                      <p className="text-xs text-secondary-400 mt-1">{booking.notes}</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[booking.status]}`}>
                      {statusIcons[booking.status]}
                      <span className="ml-1">{booking.status}</span>
                    </span>
                  </div>
                  <p className="text-xl font-bold text-primary-800 mt-2">
                    ₹{(booking.total_cost || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-secondary-400">
                    {new Date(booking.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Policy Compliance */}
              {booking.policy_compliant === false && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">Policy Violations:</p>
                  <ul className="list-disc list-inside text-sm text-red-600 mt-1">
                    {booking.policy_violations?.map((violation, index) => (
                      <li key={index}>{violation}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Approval Info */}
              {booking.approval_status && (
                <div className="mt-4 p-3 bg-secondary-50 rounded-lg">
                  <p className="text-sm text-secondary-600">
                    <strong>Approval Status:</strong> {booking.approval_status}
                    {booking.approval_comments && ` - "${booking.approval_comments}"`}
                  </p>
                </div>
              )}

              {/* Actions */}
              {(booking.status === 'pending' || booking.status === 'approved') && (
                <div className="mt-4 pt-4 border-t border-secondary-200">
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="btn-danger text-sm"
                  >
                    Cancel Booking
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Calendar className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-600">No bookings found</h3>
          <p className="text-secondary-500 mt-1">
            {filter === 'all' 
              ? "You haven't made any bookings yet."
              : `No ${filter} bookings found.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
