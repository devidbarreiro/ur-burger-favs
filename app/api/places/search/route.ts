import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query")

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 })
  }

  try {
    // Use Google Places API Text Search
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        query + " hamburguesería",
      )}&key=${apiKey}&language=es`,
    )

    const data = await response.json()

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("[v0] Google Places API error:", data.status)
      return NextResponse.json({ error: "Error searching places" }, { status: 500 })
    }

    return NextResponse.json({ results: data.results || [] })
  } catch (error) {
    console.error("[v0] Error fetching places:", error)
    return NextResponse.json({ error: "Error fetching places" }, { status: 500 })
  }
}
