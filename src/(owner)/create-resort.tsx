/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { AlertCircle, X, Camera, LocateFixed } from "lucide-react";
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  type FormEvent,
} from "react";
import { resortAPI, type ResortData } from "../api/resort";
import { useResortStore } from "./store/resort";
import L, { LatLng } from "leaflet";
import {
  useMapEvents,
  useMap,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";
import Sidebar from "./components/sidebar";
import { useNavigate } from "react-router";
import { useAuthStore } from "../(auth)/store/Auth";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapClickEvents({ onSelect }: { onSelect: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
}

function DraggableMarker({
  position,
  setPosition,
}: {
  position: LatLng;
  setPosition: (latlng: LatLng) => void;
}) {
  const markerRef = useRef<L.Marker>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          setPosition(marker.getLatLng());
        }
      },
    }),
    [setPosition]
  );
  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    >
      <Popup>Drag to adjust location</Popup>
    </Marker>
  );
}

function MapCentering({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.flyTo(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

interface CreateFormData {
  resort_name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
}

export default function CreateResortScreen() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateFormData>({
    resort_name: "",
    description: "",
    address: "",
    latitude: 8.4803,
    longitude: 124.6498,
  });

  const { token } = useAuthStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mapCenter, setMapCenter] = useState(new LatLng(8.4803, 124.6498));
  const [mapZoom, setMapZoom] = useState(13);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const refreshResorts = useResortStore((state) => state.refreshResorts);

  useEffect(() => {
    document.title = "OneStay / Create Resort";
    findMyLocation(true);
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview && selectedFile) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview, selectedFile]);

  const handleInputChange = (
    field: keyof CreateFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImagePick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleMapClick = (latlng: LatLng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: latlng.lat,
      longitude: latlng.lng,
    }));
  };

  const handleMarkerDrag = (latlng: LatLng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: latlng.lat,
      longitude: latlng.lng,
    }));
  };

  const findMyLocation = (silent = false) => {
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const latLng = new LatLng(latitude, longitude);

        if (!silent) {
          setFormData((prev) => ({ ...prev, latitude, longitude }));
          setMapCenter(latLng);
          setMapZoom(15);
        }
        setCurrentLocation(latLng);
        setLoadingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        if (!silent) {
          setError("Could not get your current location.");
        }
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const selectedLatLng = useMemo(() => {
    return new LatLng(formData.latitude, formData.longitude);
  }, [formData.latitude, formData.longitude]);

  const handleCreateResort = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Authentication failed. Please log in again.");
      return;
    }

    if (!formData.resort_name.trim() || !formData.address.trim()) {
      setError("Resort Name and Address are required fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const resortData: ResortData = {
        resort_name: formData.resort_name.trim(),
        description: formData.description.trim(),
        location: {
          address: formData.address.trim(),
          latitude: formData.latitude,
          longitude: formData.longitude,
        },
      };

      await resortAPI.createResort(resortData, selectedFile, token);

      await refreshResorts();
      navigate("/dashboard");
    } catch (err) {
      console.error("Error creating resort:", err);
      setError(err instanceof Error ? err.message : "Failed to create resort.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid grid-cols-[0.2fr_1fr] h-dvh bg-base-100">
      <Sidebar />
      <div className="flex flex-col gap-6 p-12 overflow-y-auto">
        <form onSubmit={handleCreateResort} className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="lg:text-4xl font-bold">Create New Resort</h1>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <span className="loading loading-spinner"></span>
              )}
              Create Resort
            </button>
          </div>

          {error && (
            <div className="alert alert-error shadow-lg">
                <AlertCircle size={20} />
                <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Resort Name *</legend>
                <input
                  type="text"
                  placeholder="e.g., The Grand Coral Beach Resort"
                  className="input input-bordered w-full"
                  value={formData.resort_name}
                  onChange={(e) =>
                    handleInputChange("resort_name", e.target.value)
                  }
                  disabled={isSubmitting}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Address *</legend>
                <textarea
                  className="textarea textarea-bordered h-24 w-full resize-none"
                  placeholder="Full address of the resort"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  disabled={isSubmitting}
                ></textarea>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Description</legend>
                <textarea
                  className="textarea textarea-bordered h-24 w-full resize-none"
                  placeholder="Tell guests about your resort..."
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  disabled={isSubmitting}
                ></textarea>
              </fieldset>
            </div>

            <div className="flex flex-col gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Location</legend>
                <p className="text-xs -mt-2 text-base-content/60 mb-2">
                  Click/drag the pin on the map to set the exact coordinates.
                </p>
                <div className="w-full h-64 rounded-lg overflow-hidden relative border border-base-300">
                  <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapCentering center={mapCenter} zoom={mapZoom} />
                    <MapClickEvents onSelect={handleMapClick} />
                    {currentLocation && (
                      <Marker position={currentLocation} opacity={0.7}>
                        <Popup>Your Location</Popup>
                      </Marker>
                    )}
                    <DraggableMarker
                      position={selectedLatLng}
                      setPosition={handleMarkerDrag}
                    />
                  </MapContainer>
                  <button
                    type="button"
                    className={`btn btn-primary btn-circle absolute bottom-4 right-4 z-[1000] ${
                      loadingLocation ? "loading" : ""
                    }`}
                    onClick={() => findMyLocation(false)}
                    disabled={loadingLocation || isSubmitting}
                    title="Find My Location"
                  >
                    {!loadingLocation && <LocateFixed size={20} />}
                  </button>
                </div>
                {(formData.latitude !== 0 || formData.longitude !== 0) && (
                  <div className="mt-1">
                    <span className="text-sm text-base-content/70">
                      Lat: {formData.latitude.toFixed(6)}, Lng:{" "}
                      {formData.longitude.toFixed(6)}
                    </span>
                  </div>
                )}
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Resort Image</legend>
                {imagePreview ? (
                  <div className="relative w-full h-48">
                    <img
                      src={imagePreview}
                      alt="Resort preview"
                      className="w-full h-full object-cover rounded-lg bg-base-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="btn btn-sm btn-circle btn-error absolute top-2 right-2"
                      disabled={isSubmitting}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-base-300 rounded-lg bg-base-200 cursor-pointer hover:bg-base-300"
                    onClick={handleImagePick}
                  >
                    <Camera size={32} className="text-base-content/50" />
                    <span className="mt-2 text-sm text-base-content/70">
                      Upload Resort Image
                    </span>
                    <span className="text-xs text-base-content/50">
                      (Optional)
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/png, image/jpeg"
                  disabled={isSubmitting}
                />
              </fieldset>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
