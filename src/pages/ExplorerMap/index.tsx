import  { useState, useCallback, useEffect, Fragment } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";

export type LatLng = { lat: number; lng: number };
type ChangePayload = { origin: LatLng | null; destination: LatLng | null };

const DefaultIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function ClickHandler({ onMapClick }: { onMapClick: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function RouteTracker({
  initialCenter = { lat: 14.5547, lng: 121.0244 },
  initialZoom = 17,
  tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  onChange,
  initialOrigin,
  initialDestination,
}: {
  initialCenter?: LatLng;
  initialZoom?: number;
  tileUrl?: string;
  onChange?: (p: ChangePayload) => void;
  initialOrigin?: LatLng | null;
  initialDestination?: LatLng | null;
}) {
  const [origin, setOrigin] = useState<LatLng | null>(initialOrigin ?? null);
  const [destination, setDestination] = useState<LatLng | null>(initialDestination ?? null);
  const [placingMode, setPlacingMode] = useState<"origin" | "destination">("origin");

  useEffect(() => {
    onChange?.({ origin, destination });
  }, [origin, destination, onChange]);

  const onMapClick = useCallback(
    (latlng: LatLng) => {
      if (placingMode === "origin") setOrigin(latlng);
      else setDestination(latlng);
    },
    [placingMode]
  );

  const clear = () => {
    setOrigin(null);
    setDestination(null);
  };

  const swap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  return (
    <Fragment>
      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <div>
          <label style={{ marginRight: 8 }}>
            <input
              type="radio"
              name="placing"
              checked={placingMode === "origin"}
              onChange={() => setPlacingMode("origin")}
            />{" "}
            Place Origin
          </label>

          <label>
            <input
              type="radio"
              name="placing"
              checked={placingMode === "destination"}
              onChange={() => setPlacingMode("destination")}
            />{" "}
            Place Destination
          </label>
        </div>

        <button onClick={clear}>Clear</button>
        <button onClick={swap} disabled={!origin && !destination}>
          Swap
        </button>

        <div style={{ marginLeft: "auto", fontSize: 12 }}>
          <div>Origin: {origin ? `${origin.lat.toFixed(6)}, ${origin.lng.toFixed(6)}` : "—"}</div>
          <div>Dest: {destination ? `${destination.lat.toFixed(6)}, ${destination.lng.toFixed(6)}` : "—"}</div>
        </div>
      </div>

      <div style={{ width: "100%", height: 420, borderRadius: 8, overflow: "hidden" }}>
        <MapContainer center={[initialCenter.lat, initialCenter.lng]} zoom={initialZoom} style={{ height: "100%", width: "100%" }}>
          <TileLayer url={tileUrl} attribution="© OpenStreetMap contributors" />
          <ClickHandler onMapClick={onMapClick} />

          {origin && <Marker position={[origin.lat, origin.lng]} />}
          {destination && <Marker position={[destination.lat, destination.lng]} />}
          {origin && destination && <Polyline positions={[[origin.lat, origin.lng], [destination.lat, destination.lng]]} />}
        </MapContainer>
      </div>
    </Fragment>
  );
}
