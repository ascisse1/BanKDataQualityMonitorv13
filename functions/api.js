const { createDemoDataProvider } = require('../server/database.js');
const { AGENCIES, getAllAgencies } = require('../server/agencyData.js');

// Create demo data provider
const dataProvider = createDemoDataProvider();

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const path = event.path.replace('/api/', '');
    
    // Handle different API endpoints
    if (path === 'health') {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ok',
          message: 'Server is running in demo mode',
          timestamp: new Date().toISOString(),
          totalRecords: dataProvider.getClientStats().total
        })
      };
    }
    
    if (path === 'stats/clients') {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(dataProvider.getClientStats())
      };
    }
    
    if (path === 'validation-metrics') {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(dataProvider.getValidationMetrics())
      };
    }
    
    if (path === 'anomalies/individual') {
      const page = parseInt(event.queryStringParameters?.page) || 1;
      const limit = parseInt(event.queryStringParameters?.limit) || 10;
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(dataProvider.getIndividualAnomalies(page, limit))
      };
    }
    
    if (path === 'anomalies/corporate') {
      const page = parseInt(event.queryStringParameters?.page) || 1;
      const limit = parseInt(event.queryStringParameters?.limit) || 10;
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(dataProvider.getCorporateAnomalies(page, limit))
      };
    }
    
    if (path === 'anomalies/institutional') {
      const page = parseInt(event.queryStringParameters?.page) || 1;
      const limit = parseInt(event.queryStringParameters?.limit) || 10;
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(dataProvider.getInstitutionalAnomalies(page, limit))
      };
    }
    
    if (path === 'anomalies/by-branch') {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(dataProvider.getAnomaliesByBranch())
      };
    }
    
    if (path === 'agencies') {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(getAllAgencies())
      };
    }
    
    if (path === 'fatca/stats') {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(dataProvider.getFatcaStats())
      };
    }
    
    if (path === 'fatca/clients') {
      const page = parseInt(event.queryStringParameters?.page) || 1;
      const limit = parseInt(event.queryStringParameters?.limit) || 10;
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(dataProvider.getFatcaClients(page, limit))
      };
    }
    
    if (path === 'fatca/indicators') {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(dataProvider.getFatcaIndicators())
      };
    }
    
    if (path === 'agency-correction-stats') {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(dataProvider.getAgencyCorrectionStats())
      };
    }
    
    if (path === 'correction-stats/weekly') {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(dataProvider.getWeeklyCorrectionStats())
      };
    }
    
    if (path === 'data-load-history') {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(dataProvider.getDataLoadHistory())
      };
    }
    
    if (path === 'tracking/global') {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(dataProvider.getGlobalTrackingData())
      };
    }
    
    // Default response for unknown endpoints
    return {
      statusCode: 404,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Endpoint not found' })
    };
  } catch (error) {
    console.error('API error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};