import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, Star, Calendar, Users, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PLACEHOLDER = 'https://via.placeholder.com/600x400?text=No+Image';
const THUMB_PLACEHOLDER = 'https://via.placeholder.com/60x40?text=N/A';

const HotelDetailModal = ({ hotel, checkIn, checkOut, guests, onClose }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [booking, setBooking] = useState(false);

  if (!hotel) return null;

  // Build image list with primary + fallback
  const images =
    hotel.images && hotel.images.length > 0
      ? hotel.images.map((img) => ({
          primary: img.original || img.thumbnail,
          fallback: img.thumbnail || null,
        }))
      : hotel.thumbnail
      ? [{ primary: hotel.thumbnail, fallback: null }]
      : [];

  const displayImages = images.length > 0 ? images : [{ primary: PLACEHOLDER, fallback: null }];
  const total = displayImages.length;
  const hasMultiple = total > 1;

  const renderStars = (count) =>
    Array(count)
      .fill(0)
      .map((_, i) => (
        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
      ));

  const handleBook = async () => {
    setBooking(true);
    try {
      await api.post('/bookings', {
        bookingType: 'hotel',
        travelDate: checkIn || new Date().toISOString().split('T')[0],
        returnDate: checkOut,
        hotelName: hotel.name,
        hotelCity: hotel.city,
        checkIn,
        checkOut,
        hotelStars: hotel.stars,
        totalCost: hotel.total_price || hotel.price_per_night,
        notes: `Hotel: ${hotel.name}`,
      });
      toast.success('Booking request submitted!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create booking');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh', backgroundColor: 'rgb(var(--bg-card))', color: 'rgb(var(--text-primary))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Carousel (fixed height, does NOT scroll) ── */}
        <div className="relative flex-shrink-0 bg-secondary-100" style={{ height: 320 }}>
          {/* Main image */}
          <img
            key={currentImage}
            src={displayImages[currentImage].primary}
            alt={`${hotel.name} ${currentImage + 1}`}
            className="absolute inset-0 w-full h-full object-contain"
            onError={(e) => {
              const fb = displayImages[currentImage].fallback;
              if (fb && !e.target.src.includes(fb)) {
                e.target.src = fb;
              } else {
                e.target.src = PLACEHOLDER;
              }
            }}
          />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          {hasMultiple && (
            <div className="absolute top-3 left-3 z-20 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
              {currentImage + 1} / {total}
            </div>
          )}

          {/* Prev */}
          {hasMultiple && (
            <button
              onClick={() => setCurrentImage((p) => (p === 0 ? total - 1 : p - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Next */}
          {hasMultiple && (
            <button
              onClick={() => setCurrentImage((p) => (p === total - 1 ? 0 : p + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Thumbnail strip */}
          {hasMultiple && (
            <div className="absolute bottom-0 inset-x-0 z-20 flex justify-center gap-1.5 px-4 pb-3 pt-6 bg-gradient-to-t from-black/50 to-transparent">
              {displayImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(idx)}
                  className={`flex-shrink-0 w-12 h-9 rounded border-2 bg-white ${
                    idx === currentImage
                      ? 'border-primary-500 opacity-100'
                      : 'border-white/50 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.primary}
                    alt={`thumb ${idx + 1}`}
                    className="w-full h-full object-contain rounded"
                    onError={(e) => {
                      if (img.fallback && !e.target.src.includes(img.fallback)) {
                        e.target.src = img.fallback;
                      } else {
                        e.target.src = THUMB_PLACEHOLDER;
                      }
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Title & price */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="text-2xl font-bold text-primary-800">{hotel.name}</h2>
              <div className="flex items-center space-x-1 mt-1">
                <MapPin className="h-4 w-4 text-secondary-400" />
                <span className="text-sm text-secondary-500">{hotel.address || hotel.city}</span>
              </div>
              <div className="flex items-center space-x-1 mt-2">{renderStars(hotel.stars)}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-3xl font-bold text-primary-600">
                ₹{(hotel.total_price || hotel.price_per_night).toLocaleString()}
              </p>
              <p className="text-xs text-secondary-500">
                {hotel.nights > 1 ? `for ${hotel.nights} nights` : 'per night'}
              </p>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-2 mt-4">
            <span className="bg-green-100 text-green-800 text-sm font-semibold px-2.5 py-0.5 rounded">
              ★ {hotel.rating}
            </span>
            <span className="text-sm text-secondary-500">
              {hotel.reviews_count.toLocaleString()} reviews
            </span>
          </div>

          {/* Booking details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 p-4 bg-secondary-50 rounded-xl">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary-500" />
              <div>
                <p className="text-xs text-secondary-500">Check-in</p>
                <p className="text-sm font-medium text-primary-800">{checkIn || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary-500" />
              <div>
                <p className="text-xs text-secondary-500">Check-out</p>
                <p className="text-sm font-medium text-primary-800">{checkOut || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary-500" />
              <div>
                <p className="text-xs text-secondary-500">Guests</p>
                <p className="text-sm font-medium text-primary-800">{guests || 1}</p>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-secondary-700 mb-2">Amenities</h3>
            {hotel.amenities && hotel.amenities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {hotel.amenities.map((amenity, index) => (
                  <span key={index} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                    {amenity}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-secondary-400 italic">No amenities listed</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-secondary-200">
            {hotel.link ? (
              <a href={hotel.link} target="_blank" rel="noopener noreferrer"
                className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700">
                <BookOpen className="h-4 w-4" />
                <span>View on website</span>
              </a>
            ) : <div />}
            <button onClick={handleBook} disabled={booking} className="btn-primary text-base px-6 py-3">
              {booking ? 'Booking...' : 'Book Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailModal;
