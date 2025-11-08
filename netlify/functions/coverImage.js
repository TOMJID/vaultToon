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
    // Extract path from the request
    // Try multiple sources for the original path
    let rawPath = event.rawPath || event.path || "";
    
    // Check if we can get the original URL from headers
    const referer = event.headers?.["referer"] || event.headers?.["Referer"] || "";
    const host = event.headers?.["host"] || event.headers?.["Host"] || "";
    const xForwardedPath = event.headers?.["x-forwarded-path"] || event.headers?.["X-Forwarded-Path"] || "";
    
    // If we have a referer, try to extract the path from it
    if (!rawPath || rawPath === "/.netlify/functions/coverImage") {
      if (xForwardedPath) {
        rawPath = xForwardedPath;
      } else if (referer) {
        try {
          const url = new URL(referer);
          rawPath = url.pathname;
        } catch (e) {
          // Ignore URL parsing errors
        }
      }
    }
    
    // The rawPath should contain the original request path like: /api/covers/{mangaId}/{filename}.{size}.jpg
    // Try to extract mangaId and filename from the path
    let pathMatch = rawPath.match(/\/api\/covers\/([^\/]+)\/(.+)$/);
    
    // If no match, try without /api prefix (in case rawPath doesn't include it)
    if (!pathMatch) {
      pathMatch = rawPath.match(/\/covers\/([^\/]+)\/(.+)$/);
    }
    
    // If still no match, try to get from query string (fallback)
    if (!pathMatch && event.queryStringParameters) {
      const mangaId = event.queryStringParameters.mangaId;
      const filename = event.queryStringParameters.filename;
      if (mangaId && filename) {
        pathMatch = [null, mangaId, filename];
      }
    }
    
    // Last resort: check if path info is in the request context
    if (!pathMatch && event.requestContext) {
      const path = event.requestContext.path || event.requestContext.http?.path;
      if (path) {
        pathMatch = path.match(/\/api\/covers\/([^\/]+)\/(.+)$/) || 
                   path.match(/\/covers\/([^\/]+)\/(.+)$/);
      }
    }

    if (!pathMatch) {
      // Log for debugging
      console.error("Could not extract path parameters.", {
        rawPath: event.rawPath,
        path: event.path,
        queryStringParameters: event.queryStringParameters,
        headers: event.headers ? Object.keys(event.headers) : null
      });
      
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          error: "Invalid cover image path",
          debug: { 
            rawPath: event.rawPath, 
            path: event.path,
            queryStringParameters: event.queryStringParameters
          }
        }),
      };
    }

    const [, mangaId, filename] = pathMatch;
    const imageUrl = `https://uploads.mangadex.org/covers/${mangaId}/${filename}`;
    
    console.log("Fetching image:", imageUrl, "from path:", rawPath);

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

