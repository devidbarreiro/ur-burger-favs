import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")
  const radius = searchParams.get("radius") || "5000" // 5km default

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat or lng" }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&keyword=hamburguesa|burger&key=${apiKey}`,
    )

    const data = await response.json()

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("[v0] Google Places API error:", data)
      return NextResponse.json({ error: data.status }, { status: 500 })
    }

    // Get place details for each result to get more info
    const placesWithDetails = await Promise.all(
      (data.results || []).slice(0, 20).map(async (place: any) => {
        try {
          const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,price_level,rating,user_ratings_total,geometry,photos&key=${apiKey}`,
          )
          const detailsData = await detailsResponse.json()

          if (detailsData.status === "OK") {
            return {
              place_id: place.place_id,
              name: detailsData.result.name,
              address: detailsData.result.formatted_address,
              phone: detailsData.result.formatted_phone_number,
              website: detailsData.result.website,
              opening_hours: detailsData.result.opening_hours,
              price_level: detailsData.result.price_level,
              rating: detailsData.result.rating,
              user_ratings_total: detailsData.result.user_ratings_total,
              latitude: detailsData.result.geometry.location.lat,
              longitude: detailsData.result.geometry.location.lng,
              photo_reference: detailsData.result.photos?.[0]?.photo_reference,
            }
          }
          return null
        } catch (error) {
          console.error("[v0] Error fetching place details:", error)
          return null
        }
      }),
    )

    const validPlaces = placesWithDetails.filter((p) => p !== null)

    return NextResponse.json({ places: validPlaces })
  } catch (error) {
    console.error("[v0] Error fetching nearby places:", error)
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 })
  }
}
