import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Shield, Calendar, TrendingUp, Clock, CheckCircle, XCircle, 
  Plane, Building2, AlertCircle, BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    ticketed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="h-8 w-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-primary-800">Admin Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Today's Bookings</p>
              <p className="text-3xl font-bold text-primary-800">{stats?.today_bookings || 0}</p>
            </div>
            <Calendar className="h-12 w-12 text-primary-600" />
          </div>
          <p className="text-sm text-secondary-500 mt-2">
            ₹{(stats?.today_spend || 0).toLocaleString()} spent today
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Total Spend</p>
              <p className="text-3xl font-bold text-primary-800">
                ₹{(stats?.total_spend || 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Pending Approvals</p>
              <p className="text-3xl font-bold text-primary-800">{stats?.pending_approvals || 0}</p>
            </div>
            <Clock className="h-12 w-12 text-yellow-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Cancelled</p>
              <p className="text-3xl font-bold text-primary-800">{stats?.cancelled_bookings || 0}</p>
            </div>
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings by Status */}
        <div className="card">
          <h2 className="text-xl font-semibold text-primary-800 mb-4">Bookings by Status</h2>
          <div className="space-y-3">
            {stats?.bookings_by_status?.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[item.status]}`}>
                    {item.status}
                  </span>
                </div>
                <span className="text-lg font-semibold text-primary-800">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Travelled Cities */}
        <div className="card">
          <h2 className="text-xl font-semibold text-primary-800 mb-4">Most Travelled Cities</h2>
          <div className="space-y-3">
            {stats?.top_cities?.map((item, index) => (
              <div key={item.to_city} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-primary-600">#{index + 1}</span>
                  <div className="flex items-center space-x-2">
                    <Plane className="h-4 w-4 text-secondary-400" />
                    <span className="text-secondary-700">{item.to_city}</span>
                  </div>
                </div>
                <span className="text-lg font-semibold text-primary-800">{item.count} trips</span>
              </div>
            ))}
            {(!stats?.top_cities || stats.top_cities.length === 0) && (
              <p className="text-secondary-500 text-center py-4">No travel data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <h2 className="text-xl font-semibold text-primary-800 mb-4">Recent Bookings</h2>
        {stats?.recent_bookings?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Date</th>
                  <th>Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <div>
                        <p className="font-medium text-primary-800">{booking.employee_name}</p>
                        <p className="text-xs text-secondary-500">{booking.employee_designation}</p>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center">
                        {booking.booking_type === 'flight' ? (
                          <Plane className="h-5 w-5 text-primary-600 mr-2" />
                        ) : (
                          <Building2 className="h-5 w-5 text-green-600 mr-2" />
                        )}
                        <span className="capitalize">{booking.booking_type}</span>
                      </div>
                    </td>
                    <td className="text-secondary-600">
                      {booking.booking_type === 'flight' 
                        ? `${booking.from_city} → ${booking.to_city}`
                        : booking.hotel_name
                      }
                    </td>
                    <td className="text-secondary-600">
                      {new Date(booking.travel_date || booking.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-secondary-600">
                      ₹{(booking.total_cost || 0).toLocaleString()}
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-secondary-500">
            No bookings yet
          </div>
        )}
      </div>

      {/* Monthly Trend */}
      {stats?.monthly_trend?.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-primary-800 mb-4">Monthly Trend</h2>
          <div className="space-y-3">
            {stats.monthly_trend.map((item) => (
              <div key={item.month} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-5 w-5 text-primary-600" />
                  <span className="font-medium text-secondary-700">{item.month}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary-800">{item.bookings} bookings</p>
                  <p className="text-sm text-secondary-500">₹{parseFloat(item.spend).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
