import axios from "axios";

export const handler = async (event) => {
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
    // Build query string for MangaDex API from parsed query parameters
    const queryParams = new URLSearchParams();

    // Copy all parameters from event.queryStringParameters
    if (event.queryStringParameters) {
      for (const [key, value] of Object.entries(event.queryStringParameters)) {
        // Handle array parameters like includes[]
        if (Array.isArray(value)) {
          value.forEach((v) => queryParams.append(key, v));
        } else {
          queryParams.append(key, value);
        }
      }
    }

    const queryString = queryParams.toString();
    const url = `https://api.mangadex.org/manga${queryString ? "?" + queryString : ""}`;

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
    console.error("Error fetching from MangaDex:", error.message);

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
