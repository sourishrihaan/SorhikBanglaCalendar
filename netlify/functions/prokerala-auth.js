// Netlify Function: Handle Prokerala OAuth
// This keeps Client Secret safe on backend

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const CLIENT_ID = process.env.PROKERALA_CLIENT_ID;
    const CLIENT_SECRET = process.env.PROKERALA_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing credentials' })
      };
    }

    // Get access token
    const authResponse = await fetch('https://api.prokerala.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'astrology'
      })
    });

    const authData = await authResponse.json();

    if (!authData.access_token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Failed to get access token' })
      };
    }

    // If request is for panchang data
    const { action, date, latitude, longitude } = JSON.parse(event.body);

    if (action === 'panchang') {
      const panchangResponse = await fetch('https://api.prokerala.com/v2/astrology/panchang/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: date,
          latitude: latitude,
          longitude: longitude,
          timezone: 'Asia/Kolkata'
        })
      });

      const panchangData = await panchangResponse.json();

      return {
        statusCode: 200,
        body: JSON.stringify(panchangData)
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ access_token: authData.access_token })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
