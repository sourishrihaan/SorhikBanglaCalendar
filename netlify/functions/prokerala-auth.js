// Netlify Function: Prokerala OAuth Handler (FIXED)

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const CLIENT_ID = process.env.PROKERALA_CLIENT_ID;
    const CLIENT_SECRET = process.env.PROKERALA_CLIENT_SECRET;

    console.log('Getting token with:', { CLIENT_ID: CLIENT_ID ? 'Set' : 'Missing', CLIENT_SECRET: CLIENT_SECRET ? 'Set' : 'Missing' });

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing credentials in environment' })
      };
    }

    // Step 1: Get Access Token
    const tokenResponse = await fetch('https://api.prokerala.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'astrology'
      }).toString()
    });

    console.log('Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token error:', errorText);
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Failed to authenticate', details: errorText })
      };
    }

    const tokenData = await tokenResponse.json();
    console.log('Got token:', tokenData.access_token ? 'Yes' : 'No');

    if (!tokenData.access_token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'No access token in response' })
      };
    }

    // Step 2: Get Panchang Data
    const requestBody = JSON.parse(event.body);
    const { date, latitude, longitude } = requestBody;

    console.log('Calling panchang with:', { date, latitude, longitude });

    const panchangResponse = await fetch('https://api.prokerala.com/v2/astrology/panchang/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: date,
        latitude: latitude,
        longitude: longitude,
        timezone: 'Asia/Kolkata'
      })
    });

    console.log('Panchang response status:', panchangResponse.status);

    if (!panchangResponse.ok) {
      const errorText = await panchangResponse.text();
      console.error('Panchang error:', errorText);
      return {
        statusCode: panchangResponse.status,
        body: JSON.stringify({ error: 'Failed to get panchang', details: errorText })
      };
    }

    const panchangData = await panchangResponse.json();
    console.log('Got panchang data');

    return {
      statusCode: 200,
      body: JSON.stringify(panchangData)
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
