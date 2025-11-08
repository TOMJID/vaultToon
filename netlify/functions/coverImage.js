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
    // Extract path from the request
    // The path will be like: /api/covers/{mangaId}/{filename}.{size}.jpg
    // or /.netlify/functions/coverImage (after redirect)
    let requestPath = event.path || event.rawPath || "";
    
    // Get the original path from headers if available (Netlify preserves this)
    const originalPath = event.headers?.["x-path"] || 
                        event.headers?.["x-original-path"] ||
                        event.headers?.["X-Path"] ||
                        event.headers?.["X-Original-Path"] ||
                        requestPath;

    // Try to extract mangaId and filename from the path
    // Pattern: /api/covers/{mangaId}/{filename}.{size}.jpg
    let pathMatch = originalPath.match(/\/covers\/([^\/]+)\/(.+)$/);
    
    // If no match, try without /api prefix
    if (!pathMatch) {
      pathMatch = originalPath.match(/covers\/([^\/]+)\/(.+)$/);
    }

    if (!pathMatch) {
      console.error("Could not extract path parameters. Original path:", originalPath, "Event path:", requestPath);
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          error: "Invalid cover image path",
          debug: { originalPath, requestPath, headers: event.headers }
        }),
      };
    }

    const [, mangaId, filename] = pathMatch;
    const imageUrl = `https://uploads.mangadex.org/covers/${mangaId}/${filename}`;

    // Fetch the image from MangaDex
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VaultToon/1.0)",
      },
      timeout: 30000,
    });

    // Determine content type from filename
    const contentType = filename.endsWith(".jpg") || filename.endsWith(".jpeg")
      ? "image/jpeg"
      : filename.endsWith(".png")
      ? "image/png"
      : filename.endsWith(".webp")
      ? "image/webp"
      : "image/jpeg"; // default

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
      },
      body: response.data.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("Error fetching cover image:", error.message);

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

