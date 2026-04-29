// Netlify Function: VedicAstroAPI Panchang Integration
// Simple REST API (No OAuth complications!)

exports.handler = async (event, context) => {
  console.log('=== VedicAstroAPI Panchang Function ===');
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const API_KEY = process.env.VEDICASTRO_API_KEY;

    console.log('Step 1: Checking API key...');
    
    if (!API_KEY) {
      console.error('Missing VEDICASTRO_API_KEY');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing API key' })
      };
    }

    console.log('✅ API key found');

    // Parse request
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

    const { date, latitude, longitude, timezone = 'Asia/Kolkata' } = requestData;

    console.log('Step 2: Calling VedicAstroAPI panchang...');
    console.log('Details:', { date, latitude, longitude, timezone });

    // Call VedicAstroAPI
    const response = await fetch('https://api.vedicastroapi.com/v1/panchang/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        date: date,
        latitude: latitude,
        longitude: longitude,
        timezone: timezone,
        lang: 'bn' // Bengali language
      })
    });

    console.log('Response status:', response.status);

    const responseText = await response.text();
    console.log('Response preview:', responseText.substring(0, 200));

    let panchangData;
    try {
      panchangData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', e);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Invalid API response',
          response: responseText.substring(0, 200)
        })
      };
    }

    if (!response.ok) {
      console.error('API error:', panchangData);
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'API error',
          details: panchangData
        })
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
    console.error('Stack:', error.stack);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server error: ' + error.message })
    };
  }
};
