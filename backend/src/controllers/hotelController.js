const { getJson } = require('serpapi');
const pool = require('../config/database');

// Search hotels using SerpAPI
const searchHotels = async (req, res) => {
  try {
    const { city, checkIn, checkOut, guests, stars } = req.query;

    // Build SerpAPI parameters
    const serpParams = {
      engine: 'google_hotels',
      currency: 'INR',
      gl: 'in', // India
      hl: 'en',
      api_key: process.env.SERPAPI_KEY,
      adults: parseInt(guests) || 2,
    };

    // Set search query - use city name or default to India
    if (city) {
      serpParams.q = `hotels in ${city}, India`;
    } else {
      serpParams.q = 'hotels in India';
    }

    // Set dates (required)
    if (checkIn) {
      serpParams.check_in_date = checkIn;
    } else {
      // Default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      serpParams.check_in_date = tomorrow.toISOString().split('T')[0];
    }

    if (checkOut) {
      serpParams.check_out_date = checkOut;
    } else {
      // Default to day after tomorrow
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      serpParams.check_out_date = dayAfterTomorrow.toISOString().split('T')[0];
    }

    // Set hotel class filter (star rating)
    if (stars) {
      serpParams.hotel_class = parseInt(stars);
    }

    // Set sorting by price
    serpParams.sort_by = 3; // Lowest price

    console.log('SerpAPI hotel search params:', serpParams);

    // Call SerpAPI
    const response = await getJson(serpParams);

    // Transform results to match our API format
    const hotels = [];

    if (response.properties) {
      response.properties.forEach((property, index) => {
        // Calculate nights for total price
        let nights = 1;
        if (checkIn && checkOut) {
          const checkInDate = new Date(checkIn);
          const checkOutDate = new Date(checkOut);
          nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
          if (nights <= 0) nights = 1;
        }

        // SerpAPI returns rate_per_night.extracted_lowest and total_rate.extracted_lowest
        const pricePerNight = property.rate_per_night?.extracted_lowest || 0;
        const totalPrice = property.total_rate?.extracted_lowest || (pricePerNight * nights);

        // Extract thumbnail from images array
        const thumbnail = property.images?.[0]?.thumbnail || property.thumbnail || null;

        // Parse star rating — SerpAPI returns "3-star hotel" string or number
        let starRating = 0;
        if (typeof property.hotel_class === 'string') {
          const match = property.hotel_class.match(/(\d)/);
          starRating = match ? parseInt(match[1]) : 0;
        } else if (typeof property.hotel_class === 'number') {
          starRating = property.hotel_class;
        } else if (typeof property.stars === 'number') {
          starRating = property.stars;
        }

        // Extract all image thumbnails and originals
        const images = (property.images || []).map(img => {
          // Normalize original image URL: cap size to s800 to avoid broken large-image URLs
          let original = img.original_image || img.original || null;
          if (original && original.includes('=s10000')) {
            original = original.replace('=s10000', '=s800');
          }
          return {
            thumbnail: img.thumbnail || null,
            original: original,
            title: img.title || null,
          };
        });

        hotels.push({
          id: index + 1,
          name: property.name || 'Unknown Hotel',
          city: city || 'India',
          stars: starRating || 3,
          price_per_night: pricePerNight,
          total_price: totalPrice,
          currency: 'INR',
          address: property.address || (() => {
            // Pick the nearest walking-distance place as address, skip airports/restaurants
            const places = (property.nearby_places || []).filter(p =>
              !p.name.toLowerCase().includes('airport') &&
              !p.name.toLowerCase().includes('restaurant') &&
              !p.name.toLowerCase().includes('bar') &&
              !p.name.toLowerCase().includes('station')
            );
            const place = places[0] || property.nearby_places?.[0];
            return place ? place.name : (city || 'Address not available');
          })(),
          amenities: property.amenities || [],
          rating: property.overall_rating || property.rating || 0,
          reviews_count: property.reviews || 0,
          check_in_time: '14:00',
          check_out_time: '12:00',
          nights: nights,
          thumbnail: thumbnail,
          images: images,
          link: property.link || null,
          property_token: property.property_token,
        });
      });
    }

    // Log search to database (if user is authenticated)
    if (req.user) {
      await pool.query(
        `INSERT INTO search_history (user_id, search_type, search_params, results_count)
         VALUES ($1, 'hotel', $2, $3)`,
        [req.user.id, JSON.stringify({ city, checkIn, checkOut, guests, stars }), hotels.length]
      );
    }

    res.json({
      success: true,
      count: hotels.length,
      hotels: hotels,
      search_params: { city, checkIn, checkOut, guests, stars }
    });
  } catch (error) {
    console.error('Hotel search error:', error);
    res.status(500).json({ error: 'Failed to search hotels. Please try again.' });
  }
};

// Get available cities
const getCities = async (req, res) => {
  // Major Indian cities for hotel search
  const cities = [
    'Mumbai',
    'Delhi',
    'Bangalore',
    'Chennai',
    'Kolkata',
    'Hyderabad',
    'Pune',
    'Ahmedabad',
    'Goa',
    'Jaipur',
    'Lucknow',
    'Kochi',
    'Thiruvananthapuram',
    'Coimbatore',
    'Nagpur',
    'Indore',
    'Bhopal',
    'Patna',
    'Visakhapatnam',
    'Guwahati',
    'Chandigarh',
    'Amritsar',
    'Varanasi',
    'Udaipur',
    'Jodhpur',
    'Trivandrum',
    'Calicut',
    'Mangalore',
    'Mysore',
    'Vijayawada',
    'Tiruchirappalli',
    'Madurai',
    'Tirupati',
    'Dehradun',
    'Shimla',
    'Manali',
    'Leh',
    'Srinagar',
    'Jammu',
    'Bagdogra',
    'Ranchi',
    'Bhubaneswar',
  ];
  
  res.json({
    success: true,
    cities: cities
  });
};

// Get hotel by ID (mock implementation for compatibility)
const getHotelById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Since we're using real-time data, we can't fetch by ID
    // Return a helpful message
    res.status(404).json({ 
      error: 'Hotel details are only available during search. Please search for hotels again.' 
    });
  } catch (error) {
    console.error('Get hotel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { searchHotels, getCities, getHotelById };
