import { useState, useEffect,  useRef, } from "react";
import { Home, Check, X, AlertCircle,Camera, } from "lucide-react";
import { roomAPI, type Room } from "../../../api/room";

import { useAuthStore } from "../../../(auth)/store/Auth";

interface CreateRoomFormData {
  resort_id: string;
  room_type: string;
  capacity: number;
  price_per_night: number;
  status: string;
  description:string;
  image:string;
}

export interface RoomData {
  resort_id: string;
  room_type: string;
  capacity: number;
  price_per_night: number;
  status: string;
  description?:string;
  image?: string;
}

const ROOM_TYPES = [
  "Standard Room",
  "Deluxe Room",
  "Suite",
  "Family Room",
  "Presidential Suite",
  "Villa",
  "Cabin",
  "Bungalow",
];

const ROOM_STATUSES = [
  { value: "available", label: "Available" },
  { value: "maintenance", label: "Under Maintenance" }
];

const INITIAL_FORM_STATE = {
  room_type: "",
  capacity: 2,
  price_per_night: 1000,
  status: "available",
  description:"",
  image:""
};

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRoom: Room) => void;
  resortId: string;
}

export default function CreateRoomModal({
  isOpen,
  onClose,
  onSuccess,
  resortId,
}: CreateRoomModalProps) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateRoomFormData>({
    ...INITIAL_FORM_STATE,
    resort_id: resortId,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...INITIAL_FORM_STATE,
        resort_id: resortId,
      });
      setError(null);
      setLoading(false);
    }
  }, [isOpen, resortId]);

  useEffect(() => {
    return () => {
      if (imagePreview && selectedFile) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview, selectedFile]);

  const handleInputChange = (
    field: keyof CreateRoomFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    setError(null);
    if (!formData.resort_id) {
      setError("Please select a resort");
      return false;
    }
    if (!formData.room_type) {
      setError("Please select a room type");
      return false;
    }
    if (formData.capacity < 1) {
      setError("Capacity must be at least 1");
      return false;
    }
    if (formData.price_per_night < 1) {
      setError("Price must be at least ₱1");
      return false;
    }
    return true;
  };

  const handleCreateRoom = async () => {
    if (!validateForm()) return;

      if (!token) {
    setError("Authentication failed. Please log in again.");
    return;
  }

    try {
      setLoading(true);
      setError(null);
      
      console.log("formData:", formData);


       const roomData: RoomData = {
        resort_id: formData.resort_id,
        description: formData.description,
        room_type:formData.room_type,
        capacity: formData.capacity,
        price_per_night:formData.price_per_night,
        status: formData.status,
      };

      const newRoom = await roomAPI.createRoomV2(roomData,selectedFile,token);
      onSuccess(newRoom);
      onClose();
    } catch (error) {
      console.error("Error creating room:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create room."
      );
    } finally {
      setLoading(false);
    }

    setIsSubmitting(false);
    setError(null);
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

  return (
    <dialog className={`modal ${isOpen ? "modal-open" : ""}`}>
      <div className="modal-box w-11/12 max-w-2xl flex flex-col gap-4">
        <div className="flex flex-row gap-3 items-center">
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
          <h3 className="font-bold text-2xl">Create New Room</h3>
        </div>

        <p className="text-base-content/70">Add a new room to your resort.</p>

        <fieldset className="fieldset">
                <legend className="fieldset-legend">Room Image</legend>
                {imagePreview ? (
                  <div className="relative w-full h-50">
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
                      Upload Room Image
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



        <fieldset className="fieldset">
          <legend className="fieldset-legend">Description</legend>
          <textarea
            className="textarea textarea-bordered h-15 w-full resize-none"
            placeholder="Tell guests about the Room..."
            value={formData.description}
            onChange={(e) =>
              handleInputChange("description", e.target.value)
            }
            disabled={isSubmitting}
          ></textarea>
        </fieldset>

        {error && (
          <div className="alert alert-error shadow-lg mt-4">
            <div>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <label className="label">
              <span className="label-text font-bold">Room Type</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROOM_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleInputChange("room_type", type)}
                  className={`btn ${
                    formData.room_type === type
                      ? "btn-neutral"
                      : "btn-ghost border-base-300"
                  } justify-between`}
                >
                  <div className="flex items-center gap-2">
                    <Home size={16} />
                    {type}
                  </div>
                  {formData.room_type === type && <Check size={18} />}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="label">
                <span className="label-text font-bold">Guest Capacity</span>
              </label>
              <div className="join w-full">
                <button
                  className="btn join-item"
                  onClick={() =>
                    handleInputChange(
                      "capacity",
                      Math.max(1, formData.capacity - 1)
                    )
                  }
                >
                  −
                </button>
                <span className="btn join-item pointer-events-none flex-1">
                  {formData.capacity} Guests
                </span>
                <button
                  className="btn join-item"
                  onClick={() =>
                    handleInputChange(
                      "capacity",
                      Math.min(20, formData.capacity + 1)
                    )
                  }
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="label">
                <span className="label-text font-bold">
                  Price per Night (PHP)
                </span>
              </label>
              <div className="join w-full">
                <span className="btn join-item pointer-events-none">₱</span>
                <input
                  type="number"
                  className="input input-bordered join-item w-full text-center"
                  value={formData.price_per_night}
                  onChange={(e) =>
                    handleInputChange(
                      "price_per_night",
                      Math.max(1, parseInt(e.target.value) || 0)
                    )
                  }
                  step={100}
                  min={1}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="label">
              <span className="label-text font-bold">Initial Room Status</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROOM_STATUSES.map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleInputChange("status", status.value)}
                  className={`btn ${
                    formData.status === status.value
                      ? "btn-neutral"
                      : "btn-ghost border-base-300"
                  }`}
                >
                  {status.label}
                  {formData.status === status.value && <Check size={18} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-action mt-6">
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-neutral"
            onClick={handleCreateRoom}
            disabled={loading || !formData.resort_id || !formData.room_type}
          >
            {loading && <span className="loading loading-spinner"></span>}
            Create Room
          </button>
        </div>
      </div>
    </dialog>
  );
}
