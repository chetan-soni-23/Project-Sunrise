import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Plane, Search, Clock, ArrowRight, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const FlightSearch = () => {
  const { user } = useAuth();
  const [cities, setCities] = useState([]);
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: '',
    passengers: 1,
    travelClass: 'economy'
  });
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await api.get('/flights/cities');
      setCities(response.data.cities);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      if (searchParams.from) params.append('from', searchParams.from);
      if (searchParams.to) params.append('to', searchParams.to);
      if (searchParams.date) params.append('date', searchParams.date);
      params.append('passengers', searchParams.passengers);
      if (searchParams.travelClass) params.append('travelClass', searchParams.travelClass);

      const response = await api.get(`/flights/search?${params.toString()}`);
      setFlights(response.data.flights);
    } catch (error) {
      console.error('Flight search failed:', error);
      toast.error('Failed to search flights');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (flight) => {
    try {
      const bookingData = {
        bookingType: 'flight',
        travelDate: searchParams.date || new Date().toISOString().split('T')[0],
        fromCity: flight.from_city,
        toCity: flight.to_city,
        flightClass: flight.class,
        totalCost: flight.total_price,
        notes: `Flight: ${flight.airline} ${flight.flight_number}`
      };

      await api.post('/bookings', bookingData);
      toast.success('Booking request submitted!');
    } catch (error) {
      console.error('Booking failed:', error);
      toast.error(error.response?.data?.error || 'Failed to create booking');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Plane className="h-8 w-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-primary-800">Flight Search</h1>
      </div>

      {/* Search Form */}
      <div className="card">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="label">From</label>
            <select
              value={searchParams.from}
              onChange={(e) => setSearchParams({ ...searchParams, from: e.target.value })}
              className="input-field"
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">To</label>
            <select
              value={searchParams.to}
              onChange={(e) => setSearchParams({ ...searchParams, to: e.target.value })}
              className="input-field"
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                type="date"
                value={searchParams.date}
                onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="label">Passengers</label>
            <input
              type="number"
              min="1"
              max="9"
              value={searchParams.passengers}
              onChange={(e) => setSearchParams({ ...searchParams, passengers: parseInt(e.target.value) })}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Class</label>
            <select
              value={searchParams.travelClass}
              onChange={(e) => setSearchParams({ ...searchParams, travelClass: e.target.value })}
              className="input-field"
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </div>

          <div className="md:col-span-5">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <Search className="h-5 w-5" />
              <span>{loading ? 'Searching...' : 'Search Flights'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Policy Info */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <p className="text-sm text-primary-800">
          <strong>Your Policy:</strong> As a {user.designation}, you are entitled to{' '}
          <span className="font-semibold">{
            user.designation === 'VP' || user.designation === 'SVP' ? 'Business Class' :
            user.designation === 'Director' || user.designation === 'Senior Manager' ? 'Business Class' :
            user.designation === 'Manager' || user.designation === 'Senior Executive' ? 'Premium Economy' :
            'Economy Class'
          }</span> flights.
        </p>
      </div>

      {/* Search Results */}
      {searched && (
        <div className="card">
          <h2 className="text-xl font-semibold text-primary-800 mb-4">
            Search Results ({loading ? '...' : `${flights.length} flights found`})
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-secondary-200 rounded-lg p-4 bg-card animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center space-y-1">
                        <div className="h-5 w-16 bg-secondary-200 rounded"></div>
                        <div className="h-3 w-12 bg-secondary-100 rounded"></div>
                      </div>
                      <div className="flex items-center text-secondary-300">
                        <div className="w-16 h-px bg-secondary-200"></div>
                        <div className="h-4 w-4 mx-2 bg-secondary-200 rounded-full"></div>
                        <div className="w-16 h-px bg-secondary-200"></div>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="h-5 w-16 bg-secondary-200 rounded"></div>
                        <div className="h-3 w-12 bg-secondary-100 rounded"></div>
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="h-4 w-14 bg-secondary-200 rounded"></div>
                      <div className="h-3 w-10 bg-secondary-100 rounded"></div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="h-4 w-16 bg-secondary-200 rounded"></div>
                      <div className="h-3 w-12 bg-secondary-100 rounded"></div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="h-4 w-14 bg-secondary-200 rounded"></div>
                      <div className="h-3 w-12 bg-secondary-100 rounded"></div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="h-7 w-20 bg-secondary-200 rounded ml-auto"></div>
                      <div className="h-3 w-14 bg-secondary-100 rounded ml-auto"></div>
                    </div>
                    <div className="h-9 w-20 bg-primary-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : flights.length > 0 ? (
            <div className="space-y-4">
              {flights.map((flight) => (
                <div
                  key={flight.id}
                  className="border border-secondary-200 rounded-lg p-4 hover:border-primary-300 transition-colors bg-card"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="font-semibold text-primary-800">{flight.departure_time}</p>
                        <p className="text-sm text-secondary-500">{flight.from_city}</p>
                      </div>

                      <div className="flex items-center text-secondary-400">
                        <div className="w-16 h-px bg-secondary-300"></div>
                        <Plane className="h-4 w-4 mx-2 transform rotate-90" />
                        <div className="w-16 h-px bg-secondary-300"></div>
                      </div>

                      <div className="text-center">
                        <p className="font-semibold text-primary-800">{flight.arrival_time}</p>
                        <p className="text-sm text-secondary-500">{flight.to_city}</p>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-secondary-500">{flight.duration}</p>
                      <p className="text-xs text-secondary-400">
                        {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop(s)`}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-secondary-500">{flight.airline}</p>
                      <p className="text-xs text-secondary-400">{flight.flight_number}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-secondary-500 capitalize">{flight.class}</p>
                      <p className="text-xs text-secondary-400">{flight.baggage}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">
                        ₹{flight.total_price.toLocaleString()}
                      </p>
                      <p className="text-xs text-secondary-500">per person</p>
                    </div>

                    <button
                      onClick={() => handleBook(flight)}
                      className="btn-primary"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-secondary-500">
              No flights found matching your criteria. Try different search parameters.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FlightSearch;
