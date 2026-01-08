// app/api/stores/route.ts
export async function GET() {
  try {
    const res = await fetch(
      "https://693691f2f8dc350aff31551d.mockapi.io/api/v1/stores",
      { cache: "no-store" }
    );

    if (!res.ok) {
      return Response.json({ error: "Failed fetching store list" }, { status: 500 });
    }

    const stores = await res.json();
    return Response.json(stores);

  } catch (err) {
    return Response.json({ error: "API error", detail: err }, { status: 500 });
  }
}
