const { getJson } = require('serpapi');
const pool = require('../config/database');

// City name to IATA code mapping for Indian cities
const CITY_IATA_MAP = {
  'mumbai': 'BOM',
  'delhi': 'DEL',
  'bangalore': 'BLR',
  'bengaluru': 'BLR',
  'chennai': 'MAA',
  'kolkata': 'CCU',
  'hyderabad': 'HYD',
  'pune': 'PNQ',
  'ahmedabad': 'AMD',
  'goa': 'GOI',
  'jaipur': 'JAI',
  'lucknow': 'LKO',
  'kochi': 'COK',
  'thiruvananthapuram': 'TRV',
  'coimbatore': 'CJB',
  'nagpur': 'NAG',
  'indore': 'IDR',
  'bhopal': 'BHO',
  'patna': 'PAT',
  'raipur': 'RPR',
  'visakhapatnam': 'VTZ',
  'guwahati': 'GAU',
  'chandigarh': 'IXC',
  'amritsar': 'ATQ',
  'lucknow': 'LKO',
  'varanasi': 'VNS',
  'udaipur': 'UDR',
  'jodhpur': 'JDH',
  'trivandrum': 'TRV',
  'calicut': 'CCJ',
  'mangalore': 'IXE',
  'mysore': 'MYQ',
  'hubli': 'HBX',
  'belgaum': 'IXG',
  'vijayawada': 'VGA',
  'tiruchirappalli': 'TRZ',
  'madurai': 'IXM',
  'tirupati': 'TIR',
  'dehradun': 'DED',
  'shimla': 'SLV',
  'manali': 'KUU',
  'leh': 'IXL',
  'srinagar': 'SXR',
  'jammu': 'IXJ',
  'bagdogra': 'IXB',
  'ranchi': 'IXR',
  'jamshedpur': 'IXW',
  'bhubaneswar': 'BBI',
  'rourkela': 'RRK',
};

// Travel class mapping
const CLASS_MAP = {
  'economy': 1,
  'premium_economy': 2,
  'business': 3,
  'first': 4,
};

// Search flights using SerpAPI
const searchFlights = async (req, res) => {
  try {
    const { from, to, date, passengers, travelClass } = req.query;

    // Build SerpAPI parameters
    const serpParams = {
      engine: 'google_flights',
      type: 2, // One way
      currency: 'INR',
      gl: 'in', // India
      hl: 'en',
      api_key: process.env.SERPAPI_KEY,
      adults: parseInt(passengers) || 1,
    };

    // Map city names to IATA codes
    if (from) {
      const fromCode = CITY_IATA_MAP[from.toLowerCase()];
      if (fromCode) {
        serpParams.departure_id = fromCode;
      }
    }

    if (to) {
      const toCode = CITY_IATA_MAP[to.toLowerCase()];
      if (toCode) {
        serpParams.arrival_id = toCode;
      }
    }

    // Set travel class
    if (travelClass && CLASS_MAP[travelClass.toLowerCase()]) {
      serpParams.travel_class = CLASS_MAP[travelClass.toLowerCase()];
    }

    // Set date (required for one-way)
    if (date) {
      serpParams.outbound_date = date;
    } else {
      // Default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      serpParams.outbound_date = tomorrow.toISOString().split('T')[0];
    }

    console.log('SerpAPI flight search params:', serpParams);

    // Call SerpAPI
    const response = await getJson(serpParams);

    // Transform results to match our API format
    const flights = [];

    // Process best flights
    if (response.best_flights) {
      response.best_flights.forEach((flight, index) => {
        const leg = flight.flights?.[0];
        if (leg) {
          flights.push({
            id: index + 1,
            airline: leg.airline || 'Unknown Airline',
            flight_number: leg.flight_number || 'N/A',
            from_city: from || 'Unknown',
            to_city: to || 'Unknown',
            departure_time: leg.departure_airport?.time ? 
              new Date(leg.departure_airport.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A',
            arrival_time: leg.arrival_airport?.time ? 
              new Date(leg.arrival_airport.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A',
            duration: flight.total_duration ? `${Math.floor(flight.total_duration / 60)}h ${flight.total_duration % 60}m` : 'N/A',
            stops: flight.stops || 0,
            price: flight.price || 0,
            currency: 'INR',
            class: travelClass || 'economy',
            aircraft: leg.aircraft || 'N/A',
            baggage: 'Check airline policy',
            total_price: flight.price || 0,
            passengers: parseInt(passengers) || 1,
            booking_token: flight.booking_token,
          });
        }
      });
    }

    // Process other flights if available
    if (response.other_flights) {
      response.other_flights.forEach((flight, index) => {
        const leg = flight.flights?.[0];
        if (leg) {
          flights.push({
            id: flights.length + 1,
            airline: leg.airline || 'Unknown Airline',
            flight_number: leg.flight_number || 'N/A',
            from_city: from || 'Unknown',
            to_city: to || 'Unknown',
            departure_time: leg.departure_airport?.time ? 
              new Date(leg.departure_airport.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A',
            arrival_time: leg.arrival_airport?.time ? 
              new Date(leg.arrival_airport.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A',
            duration: flight.total_duration ? `${Math.floor(flight.total_duration / 60)}h ${flight.total_duration % 60}m` : 'N/A',
            stops: flight.stops || 0,
            price: flight.price || 0,
            currency: 'INR',
            class: travelClass || 'economy',
            aircraft: leg.aircraft || 'N/A',
            baggage: 'Check airline policy',
            total_price: flight.price || 0,
            passengers: parseInt(passengers) || 1,
            booking_token: flight.booking_token,
          });
        }
      });
    }

    // Log search to database (if user is authenticated)
    if (req.user) {
      await pool.query(
        `INSERT INTO search_history (user_id, search_type, search_params, results_count)
         VALUES ($1, 'flight', $2, $3)`,
        [req.user.id, JSON.stringify({ from, to, date, passengers, travelClass }), flights.length]
      );
    }

    res.json({
      success: true,
      count: flights.length,
      flights: flights,
      search_params: { from, to, date, passengers, travelClass }
    });
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({ error: 'Failed to search flights. Please try again.' });
  }
};

// Get available cities
const getCities = async (req, res) => {
  const cities = Object.keys(CITY_IATA_MAP)
    .filter((city, index, self) => self.indexOf(city) === index) // Remove duplicates
    .map(city => city.charAt(0).toUpperCase() + city.slice(1)); // Capitalize
  
  // Remove duplicates that were created by capitalization
  const uniqueCities = [...new Set(cities)];
  
  res.json({
    success: true,
    cities: uniqueCities
  });
};

// Get flight by ID (mock implementation for compatibility)
const getFlightById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Since we're using real-time data, we can't fetch by ID
    // Return a helpful message
    res.status(404).json({ 
      error: 'Flight details are only available during search. Please search for flights again.' 
    });
  } catch (error) {
    console.error('Get flight error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { searchFlights, getCities, getFlightById };
