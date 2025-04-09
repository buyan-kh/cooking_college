import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: { imageId: string } }
) {
  const imageId = params.imageId;

  if (!imageId) {
    return new NextResponse("Image ID is required", { status: 400 });
  }

  try {
    // Proxy the request to the backend
    const response = await fetch(`${API_URL}/images/${imageId}`);

    if (!response.ok) {
      return new NextResponse(`Failed to fetch image: ${response.statusText}`, {
        status: response.status,
      });
    }

    // Get the image data as a blob
    const imageBlob = await response.blob();

    // Get content type from the backend response
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Return the image with proper content type
    return new NextResponse(imageBlob, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600", // Cache for an hour
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching image:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new NextResponse(`Error fetching image: ${errorMessage}`, {
      status: 500,
    });
  }
}
