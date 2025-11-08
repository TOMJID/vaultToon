const axios = require("axios");

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
      body: "",
    };
  }

  try {
    // Extract ID from path (e.g., /api/manga/123 or /.netlify/functions/mangaDetail?id=123)
    let id = event.queryStringParameters?.id;

    // If not in query params, try to extract from path
    if (!id && event.path) {
      const pathMatch = event.path.match(/\/manga\/([^\/\?]+)/);
      if (pathMatch) {
        id = pathMatch[1];
      }
    }

    if (!id) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "Manga ID is required" }),
      };
    }

    // Build query string for MangaDex API from parsed query parameters
    const queryParams = new URLSearchParams();

    // Copy all parameters from event.queryStringParameters (excluding id)
    if (event.queryStringParameters) {
      for (const [key, value] of Object.entries(event.queryStringParameters)) {
        if (key === "id") continue; // Skip id as it's in the path
        // Handle array parameters like includes[]
        if (Array.isArray(value)) {
          value.forEach((v) => queryParams.append(key, v));
        } else {
          queryParams.append(key, value);
        }
      }
    }

    const queryString = queryParams.toString();
    const url = `https://api.mangadex.org/manga/${id}${queryString ? "?" + queryString : ""}`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VaultToon/1.0)",
      },
      timeout: 30000, // 30 second timeout
    });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error("Error fetching manga details from MangaDex:", error.message);

    return {
      statusCode: error.response?.status || 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data || "Unknown error",
      }),
    };
  }
};
