# Google Maps Setup

## API Keys

Two keys are required:

| Key | Used by | Env var |
|-----|---------|---------|
| Browser (Restricted) | Frontend JavaScript | `VITE_GOOGLE_MAPS_API_KEY` |
| Server (Restricted) | Backend Geocoding API calls | `GOOGLE_MAPS_API_KEY` |

## Map ID

A **Map ID** is required to render `AdvancedMarker` elements (coloured pins and clustering).

1. Go to [Google Maps Platform → Map Management](https://console.cloud.google.com/google/maps-apis/maps).
2. Create a new Map ID → choose **JavaScript** → **Vector** rendering.
3. Copy the Map ID into the frontend env: `VITE_GOOGLE_MAPS_MAP_ID=<id>`.

## APIs to Enable

Enable all of these in the [Google Cloud Console](https://console.cloud.google.com/apis/library):

- **Maps JavaScript API** — map tiles and AdvancedMarker
- **Geocoding API** — reverse geocode for ReportWaste address display
- **Places API** (optional) — future address autocomplete
- **Visualization library** — loaded via `libraries={['visualization']}` on `APIProvider`, powers the admin heatmap (`HeatmapLayer`)

## HTTP Referrer Restrictions (browser key)

Lock the browser key to your domains:

```
https://ptrack.rw/*
https://*.ptrack.rw/*
http://localhost:5173/*
```

## IP Restrictions (server key)

Lock the server key to your Render instance IP. Alternatively use a service account with least-privilege.

## Environment Variables

### Frontend (`frontend/.env.local` / Render frontend service)

```
VITE_GOOGLE_MAPS_API_KEY=AIza...
VITE_GOOGLE_MAPS_MAP_ID=<your-map-id>
VITE_API_BASE_URL=https://ptrack-api.onrender.com
```

### Backend (Render environment)

```
GOOGLE_MAPS_API_KEY=AIza...   # server-side key, separate from frontend key
```

## Billing Alerts

Set budget alerts in [Billing → Budgets & alerts](https://console.cloud.google.com/billing):

- **$10** — informational
- **$25** — review usage
- **$40** — pause non-critical API calls

The Maps JavaScript API has a $200/month free credit. At Kigali city scale (minZoom=11, bbox ≤ 100 km²) tile costs are negligible; the main cost driver is Geocoding API calls. The 800 ms debounce + 50-result cache in `ReportWaste` keeps these well under 1 000/day.

## Daily Quota Cap

Set a daily quota limit of **$50** in the API quota dashboard to prevent runaway billing:

1. APIs & Services → Maps JavaScript API → Quotas.
2. Set **Requests per day** to `50000` (maps/loads).
3. Repeat for Geocoding API → `2000 requests/day`.