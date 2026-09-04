import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Plane, Building2, Calendar, LogOut, LayoutDashboard, CheckSquare, Shield, Sun, Moon, UserCheck, Users, BookOpen } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { dark, toggle } = useTheme();

  if (!isAuthenticated) {
    return (
      <nav className="bg-navbar shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-primary-800">Project Sunrise</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-secondary-600 hover:text-primary-600 font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium"
              >
                Register
              </Link>
              <button onClick={toggle} className="p-2 rounded-lg bg-secondary-100 hover:bg-secondary-200 transition-colors">
                {dark ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-secondary-600" />}
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-navbar shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Plane className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-primary-800">Project Sunrise</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/dashboard"
              className="flex items-center space-x-1 text-secondary-600 hover:text-primary-600"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/flights"
              className="flex items-center space-x-1 text-secondary-600 hover:text-primary-600"
            >
              <Plane className="h-5 w-5" />
              <span>Flights</span>
            </Link>
            <Link
              to="/hotels"
              className="flex items-center space-x-1 text-secondary-600 hover:text-primary-600"
            >
              <Building2 className="h-5 w-5" />
              <span>Hotels</span>
            </Link>
            <Link
              to="/my-bookings"
              className="flex items-center space-x-1 text-secondary-600 hover:text-primary-600"
            >
              <Calendar className="h-5 w-5" />
              <span>My Bookings</span>
            </Link>

            {(user.role === 'approver' || user.role === 'admin') && (
              <>
                <Link
                  to="/approvals"
                  className="flex items-center space-x-1 text-secondary-600 hover:text-primary-600"
                >
                  <CheckSquare className="h-5 w-5" />
                  <span>Approvals</span>
                </Link>
                <Link
                  to="/delegations"
                  className="flex items-center space-x-1 text-secondary-600 hover:text-primary-600"
                >
                  <UserCheck className="h-5 w-5" />
                  <span>Delegate</span>
                </Link>
              </>
            )}

            {user.role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  className="flex items-center space-x-1 text-secondary-600 hover:text-primary-600"
                >
                  <Shield className="h-5 w-5" />
                  <span>Admin</span>
                </Link>
                <Link
                  to="/admin/users"
                  className="flex items-center space-x-1 text-secondary-600 hover:text-primary-600"
                >
                  <Users className="h-5 w-5" />
                  <span>Users</span>
                </Link>
                <Link
                  to="/admin/policies"
                  className="flex items-center space-x-1 text-secondary-600 hover:text-primary-600"
                >
                  <BookOpen className="h-5 w-5" />
                  <span>Policies</span>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={toggle} className="p-2 rounded-lg bg-secondary-100 hover:bg-secondary-200 transition-colors">
              {dark ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-secondary-600" />}
            </button>
            <Link to="/profile" className="text-right hover:opacity-80 transition-opacity">
              <p className="text-sm font-medium text-primary-800">{user.name}</p>
              <p className="text-xs text-secondary-500 capitalize">{user.role}</p>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-secondary-600 hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
