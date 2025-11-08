import React from "react";
import { MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

interface Location {
  address: string;
  latitude: number;
  longitude: number;
}

interface ResortScreenMapsProps {
  location: Location;
  resortName: string;
}

const ResortScreenMaps: React.FC<ResortScreenMapsProps> = ({
  location,
  resortName,
}) => {
  const mapHeight = "360px";
  const position: [number, number] = [location.latitude, location.longitude];

  return (
    <div className="flex flex-col gap-4">
      <div className="map-container" style={{ height: mapHeight }}>
        <MapContainer
          center={position}
          zoom={25}
          zoomControl={true}
          dragging={true}
          touchZoom={false}
          doubleClickZoom={false}
          scrollWheelZoom={false}
          boxZoom={false}
          keyboard={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>
              <b>{resortName}</b>
              <br />
              {location.address}
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="flex flex-row gap-4 items-center">
        <MapPin size={16} className="resort-address-icon" />
        <span>{location.address}</span>
      </div>
    </div>
  );
};

export default ResortScreenMaps;
