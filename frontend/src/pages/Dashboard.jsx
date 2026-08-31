import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Plane, Building2, Calendar, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/my-stats');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-800">
            Welcome, {user.name}!
          </h1>
          <p className="text-secondary-500 mt-1">
            {user.role === 'admin' ? 'Travel Administrator' : 
             user.role === 'approver' ? 'Travel Approver' : 'Employee'} • {user.designation}
          </p>
        </div>
        <div className="flex space-x-4">
          <Link to="/flights" className="btn-primary flex items-center space-x-2">
            <Plane className="h-5 w-5" />
            <span>Search Flights</span>
          </Link>
          <Link to="/hotels" className="btn-primary flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Search Hotels</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Total Bookings</p>
              <p className="text-2xl font-bold text-primary-800">
                {stats?.bookings_by_status?.reduce((sum, s) => sum + parseInt(s.count), 0) || 0}
              </p>
            </div>
            <Calendar className="h-10 w-10 text-primary-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Total Spend</p>
              <p className="text-2xl font-bold text-primary-800">
                ₹{(stats?.total_spend || 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Pending</p>
              <p className="text-2xl font-bold text-primary-800">
                {stats?.bookings_by_status?.find(s => s.status === 'pending')?.count || 0}
              </p>
            </div>
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Approved</p>
              <p className="text-2xl font-bold text-primary-800">
                {stats?.bookings_by_status?.find(s => s.status === 'approved')?.count || 0}
              </p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-600" />
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
                      <div className="flex items-center">
                        {booking.booking_type === 'flight' ? (
                          <Plane className="h-5 w-5 text-primary-600 mr-2" />
                        ) : (
                          <Building2 className="h-5 w-5 text-primary-600 mr-2" />
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
            No bookings yet. Start by searching for flights or hotels!
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
