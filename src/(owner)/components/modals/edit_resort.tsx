/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { AlertCircle, MapPin, X, Camera, LocateFixed } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { resortAPI, type Resort, type ResortFormData } from "../../../api/resort";
import { useResortStore } from "../../store/resort";
import L, { LatLng } from "leaflet";
import {
  useMapEvents,
  useMap,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";
import { useAuthStore } from "../../../(auth)/store/Auth";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/**
 * A component to handle map click events
 */
function MapClickEvents({ onSelect }: { onSelect: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
}

/**
 * A component to make the selected marker draggable
 */
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

/**
 * A component to center the map
 */
function MapCentering({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    // Check if map is initialized
    if (map) {
      map.flyTo(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// --- Form Data Interface ---
interface EditFormData {
  resort_name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
}

// --- Component Props ---
interface EditResortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resort: Resort | null;
}

export default function EditResortModal({
  isOpen,
  onClose,
  onSuccess,
  resort,
}: EditResortModalProps) {
  const [formData, setFormData] = useState<EditFormData>({
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

  // --- Effects ---

  useEffect(() => {
    if (isOpen && resort) {
      const resortLocation = new LatLng(
        resort.location.latitude,
        resort.location.longitude
      );
      setFormData({
        resort_name: resort.resort_name,
        description: resort.description || "",
        address: resort.location.address,
        latitude: resort.location.latitude,
        longitude: resort.location.longitude,
      });
      setMapCenter(resortLocation);
      setMapZoom(15);

      setImagePreview(resort.image || null);
      setSelectedFile(null);
      setError(null);
      setIsSubmitting(false);
    } else if (isOpen) {
      setMapCenter(new LatLng(8.4803, 124.6498));
      setMapZoom(13);
    }
  }, [isOpen, resort]);

  useEffect(() => {
    return () => {
      if (imagePreview && selectedFile) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview, selectedFile]);

  // --- Handlers ---

  const handleInputChange = (
    field: keyof EditFormData,
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

  const findMyLocation = () => {
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const latLng = new LatLng(latitude, longitude);

        setFormData((prev) => ({ ...prev, latitude, longitude }));
        setCurrentLocation(latLng);
        setMapCenter(latLng);
        setMapZoom(15);
        setLoadingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setError("Could not get your current location.");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const selectedLatLng = useMemo(() => {
    return new LatLng(formData.latitude, formData.longitude);
  }, [formData.latitude, formData.longitude]);

  const saveResortChanges = async () => {
    if (!resort) return;

    // 1. Validation
    if (!formData.resort_name.trim() || !formData.address.trim()) {
      setError("Resort Name and Address are required fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const updateData: Partial<ResortFormData> = {
        resort_name: formData.resort_name.trim(),
        description: formData.description.trim(),
        location: {
          address: formData.address.trim(),
          latitude: formData.latitude,
          longitude: formData.longitude,
        },
      };

      await resortAPI.updateResort(
        resort._id,
        updateData,
        selectedFile,
        token!
      );

      await refreshResorts();
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error updating resort:", err);
      setError(err instanceof Error ? err.message : "Failed to update resort.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog className={`modal ${isOpen ? "modal-open" : ""}`}>
      <div className="modal-box w-11/12 max-w-4xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-base-200">
          <div className="flex flex-row gap-3 items-center">
            <button
              className="btn btn-sm btn-circle btn-ghost"
              onClick={onClose}
            >
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl">Edit Resort</h3>
          </div>
          <button
            className="btn btn-neutral"
            onClick={saveResortChanges}
            disabled={isSubmitting}
          >
            {isSubmitting && <span className="loading loading-spinner"></span>}
            Save
          </button>
        </div>

        {error && (
          <div className="alert alert-error shadow-lg flex flex-row items-center gap-2 p-4">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col gap-2">
            <label className="label">
              <span className="label-text font-medium">Resort Name *</span>
            </label>
            <input
              type="text"
              placeholder="Enter resort name"
              className="input input-bordered w-full"
              value={formData.resort_name}
              onChange={(e) => handleInputChange("resort_name", e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="label">
              <span className="label-text font-medium">Address *</span>
            </label>
            <textarea
              className="textarea h-24 w-full resize-none"
              placeholder="Full address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              disabled={isSubmitting}
            ></textarea>
          </div>

          <div className="flex flex-col gap-2">
            <label className="label">
              <span className="label-text font-medium">Location</span>
            </label>
            <p className="text-xs -mt-2 text-base-content/60">
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
                className={`btn btn-primary btn-circle absolute bottom-4 right-4 z-1000 ${
                  loadingLocation ? "loading" : ""
                }`}
                onClick={findMyLocation}
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
          </div>

          <div className="flex flex-col gap-2">
            <label className="label">
              <span className="label-text font-medium">Description</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-24 w-full resize-none"
              placeholder="Describe your resort..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              disabled={isSubmitting}
            ></textarea>
          </div>

          {/* <div className="flex flex-col gap-2">
            <label className="label">
              <span className="label-text font-medium">Resort Image</span>
            </label>

            {imagePreview ? (
              <div className="relative w-full h-96">
                <img
                  src={imagePreview}
                  alt="Resort preview"
                  className="w-full h-full object-cover rounded-lg bg-base-200"
                />
                <button
                  onClick={handleRemoveImage}
                  className="btn btn-sm btn-circle absolute top-2 right-2"
                  disabled={isSubmitting}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-base-300 rounded-lg bg-base-200 cursor-pointer"
                onClick={handleImagePick}
              >
                <Camera size={32} className="text-base-content/50" />
                <span className="mt-2 text-sm text-base-content/70">
                  Choose New Image
                </span>
                <span className="text-xs text-base-content/50">
                  Tap to select from files
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
          </div> */}
        </div>
      </div>
    </dialog>
  );
}
