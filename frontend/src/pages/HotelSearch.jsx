import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Building2, Search, Star, Calendar, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import HotelDetailModal from '../components/HotelDetailModal';

const HotelSearch = () => {
  const { user } = useAuth();
  const [cities, setCities] = useState([]);
  const [searchParams, setSearchParams] = useState({
    city: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    stars: ''
  });
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await api.get('/hotels/cities');
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
      if (searchParams.city) params.append('city', searchParams.city);
      if (searchParams.checkIn) params.append('checkIn', searchParams.checkIn);
      if (searchParams.checkOut) params.append('checkOut', searchParams.checkOut);
      params.append('guests', searchParams.guests);
      if (searchParams.stars) params.append('stars', searchParams.stars);

      const response = await api.get(`/hotels/search?${params.toString()}`);
      setHotels(response.data.hotels);
    } catch (error) {
      console.error('Hotel search failed:', error);
      toast.error('Failed to search hotels');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (hotel) => {
    try {
      const bookingData = {
        bookingType: 'hotel',
        travelDate: searchParams.checkIn || new Date().toISOString().split('T')[0],
        returnDate: searchParams.checkOut,
        hotelName: hotel.name,
        hotelCity: hotel.city,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        hotelStars: hotel.stars,
        totalCost: hotel.total_price || hotel.price_per_night,
        notes: `Hotel: ${hotel.name}`
      };

      await api.post('/bookings', bookingData);
      toast.success('Booking request submitted!');
    } catch (error) {
      console.error('Booking failed:', error);
      toast.error(error.response?.data?.error || 'Failed to create booking');
    }
  };

  const renderStars = (count) => {
    return Array(count)
      .fill(0)
      .map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      ));
  };

  const handleCardClick = (hotel) => {
    setSelectedHotel(hotel);
  };

  const closeModal = () => {
    setSelectedHotel(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Building2 className="h-8 w-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-primary-800">Hotel Search</h1>
      </div>

      {/* Search Form */}
      <div className="card">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="label">City</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <select
                value={searchParams.city}
                onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
                className="input-field pl-10"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Check-in</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                type="date"
                value={searchParams.checkIn}
                onChange={(e) => setSearchParams({ ...searchParams, checkIn: e.target.value })}
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="label">Check-out</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                type="date"
                value={searchParams.checkOut}
                onChange={(e) => setSearchParams({ ...searchParams, checkOut: e.target.value })}
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="label">Guests</label>
            <input
              type="number"
              min="1"
              max="10"
              value={searchParams.guests}
              onChange={(e) => setSearchParams({ ...searchParams, guests: parseInt(e.target.value) })}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Stars</label>
            <select
              value={searchParams.stars}
              onChange={(e) => setSearchParams({ ...searchParams, stars: e.target.value })}
              className="input-field"
            >
              <option value="">Any</option>
              <option value="2">2 Stars</option>
              <option value="3">3 Stars</option>
              <option value="4">4 Stars</option>
              <option value="5">5 Stars</option>
            </select>
          </div>

          <div className="md:col-span-5">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <Search className="h-5 w-5" />
              <span>{loading ? 'Searching...' : 'Search Hotels'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Policy Info */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <p className="text-sm text-primary-800">
          <strong>Your Policy:</strong> As a {user.designation}, you are entitled to stay at{' '}
          <span className="font-semibold">{
            user.designation === 'VP' || user.designation === 'SVP' || user.designation === 'Director'
              ? '5-Star Hotels'
              : user.designation === 'Senior Manager' || user.designation === 'Manager'
              ? '4-Star Hotels'
              : user.designation === 'Senior Executive'
              ? '3-Star Hotels'
              : '2-Star Hotels'
          }</span>.
        </p>
      </div>

      {/* Search Results */}
      {searched && (
        <div className="card">
          <h2 className="text-xl font-semibold text-primary-800 mb-4">
            Search Results ({hotels.length} hotels found)
          </h2>

          {hotels.length > 0 ? (
            <div className="space-y-4">
              {hotels.map((hotel) => (
                <div
                  key={hotel.id}
                  onClick={() => handleCardClick(hotel)}
                  className="border border-secondary-200 rounded-lg overflow-hidden hover:border-primary-300 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row cursor-pointer bg-card"
                >
                  {/* Image on the left */}
                  <div className="w-full md:w-48 lg:w-56 flex-shrink-0 bg-secondary-100">
                    <img
                      src={hotel.thumbnail || 'https://via.placeholder.com/300x200?text=No+Image'}
                      alt={hotel.name}
                      className="w-full h-48 md:h-full object-cover"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
                    />
                  </div>

                  {/* Details on the right */}
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-primary-800 text-lg">{hotel.name}</h3>
                        <div className="flex items-center space-x-1 mt-1">
                          <MapPin className="h-4 w-4 text-secondary-400" />
                          <span className="text-sm text-secondary-500">{hotel.address || hotel.city}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-2">
                          {renderStars(hotel.stars)}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-600">
                          ₹{(hotel.total_price || hotel.price_per_night).toLocaleString()}
                        </p>
                        <p className="text-xs text-secondary-500">per night</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      {hotel.amenities && hotel.amenities.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {hotel.amenities.slice(0, 4).map((amenity, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium"
                            >
                              {amenity}
                            </span>
                          ))}
                          {hotel.amenities.length > 4 && (
                            <span className="px-2 py-1 bg-secondary-100 text-secondary-600 rounded text-xs">
                              +{hotel.amenities.length - 4} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-secondary-400 italic mt-2">No amenities listed</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 mt-3">
                      <span className="text-sm font-medium text-green-600">
                        ★ {hotel.rating}
                      </span>
                      <span className="text-xs text-secondary-400">
                        ({hotel.reviews_count.toLocaleString()} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-secondary-500">
              No hotels found matching your criteria. Try different search parameters.
            </div>
          )}
        </div>
      )}
      {/* Hotel Detail Modal */}
      {selectedHotel && (
        <HotelDetailModal
          hotel={selectedHotel}
          checkIn={searchParams.checkIn}
          checkOut={searchParams.checkOut}
          guests={searchParams.guests}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default HotelSearch;
