// Netlify Function: Prokerala OAuth - CORRECT VERSION
// Based on official documentation: https://api.prokerala.com/getting-started

exports.handler = async (event, context) => {
  console.log('=== Prokerala API Function ===');
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const CLIENT_ID = process.env.PROKERALA_CLIENT_ID;
    const CLIENT_SECRET = process.env.PROKERALA_CLIENT_SECRET;

    console.log('Step 1: Checking credentials...');
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('Missing credentials in environment');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing CLIENT_ID or CLIENT_SECRET' })
      };
    }

    console.log('✅ Credentials found');

    // CORRECT TOKEN ENDPOINT (NOT /oauth/token)
    const TOKEN_URL = 'https://api.prokerala.com/token';
    
    console.log('Step 2: Getting access token from', TOKEN_URL);

    // Proper OAuth body format
    const tokenBody = new URLSearchParams();
    tokenBody.append('grant_type', 'client_credentials');
    tokenBody.append('client_id', CLIENT_ID);
    tokenBody.append('client_secret', CLIENT_SECRET);
    tokenBody.append('scope', 'astrology');

    const tokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenBody.toString()
    });

    console.log('Token response status:', tokenResponse.status);

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token error:', tokenData);
      return {
        statusCode: tokenResponse.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Auth failed', details: tokenData })
      };
    }

    if (!tokenData.access_token) {
      console.error('No access_token in response:', tokenData);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No access token', response: tokenData })
      };
    }

    console.log('✅ Access token obtained');

    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid request body' })
      };
    }

    const { date, latitude, longitude } = requestData;

    console.log('Step 3: Calling panchang API with:', { date, latitude, longitude });

    // Call Panchang API
    const panchangResponse = await fetch('https://api.prokerala.com/v2/astrology/panchang/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        date: date,
        latitude: latitude,
        longitude: longitude,
        timezone: 'Asia/Kolkata'
      })
    });

    console.log('Panchang response status:', panchangResponse.status);

    const panchangData = await panchangResponse.json();

    if (!panchangResponse.ok) {
      console.error('Panchang error:', panchangData);
      return {
        statusCode: panchangResponse.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Panchang API error', details: panchangData })
      };
    }

    console.log('✅ Panchang data obtained successfully');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(panchangData)
    };

  } catch (error) {
    console.error('Function error:', error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server error: ' + error.message })
    };
  }
};
