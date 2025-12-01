/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, type FormEvent } from "react";
import { X, AlertCircle, Home, Check, Camera } from "lucide-react";

import { type Room, type RoomFormData, type UpdateRoomData, roomAPI } from "../../../api/room";

import { useAuthStore } from "../../../(auth)/store/Auth";

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
  { value: "maintenance", label: "Under Maintenance" },
  { value: "occupied", label: "Occupied" },
];

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedRoom: Room) => void;
  roomToEdit: Room | null;
}

export default function EditRoomModal({
  isOpen,
  onClose,
  onSuccess,
  roomToEdit,
}: EditRoomModalProps) {

  const { token } = useAuthStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<UpdateRoomData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && roomToEdit) {
      setFormData({
        room_type: roomToEdit.room_type,
        capacity: roomToEdit.capacity,
        price_per_night: roomToEdit.price_per_night,
        status: roomToEdit.status,
      });
      setError(null);
      setIsSubmitting(false);

      setImagePreview(roomToEdit.image || null);
      setSelectedFile(null);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, roomToEdit]);

  useEffect(() => {
    return () => {
      if (imagePreview && selectedFile) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview, selectedFile]);

  const handleInputChange = (
    field: keyof UpdateRoomData,
    value: string | number
  ) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
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

  const validateForm = (): boolean => {
    setError(null);
    if (!formData.room_type) {
      setError("Please select a room type");
      return false;
    }
    if (!formData.capacity || formData.capacity < 1) {
      setError("Capacity must be at least 1");
      return false;
    }
    if (!formData.price_per_night || formData.price_per_night < 1) {
      setError("Price must be at least ₱1");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!roomToEdit || !validateForm()) return;

    setIsSubmitting(true);
    setError(null);
    try {

      const updateData: Partial<RoomFormData> = {
        resort_id: roomToEdit.resort_id,
        description: formData.description,
        room_type:formData.room_type,
        capacity: formData.capacity,
        price_per_night:formData.price_per_night,
        status: formData.status,
      };

      const result = await roomAPI.updateRoomV2(
        roomToEdit._id,
        updateData,
        selectedFile,
        token!
      );
      
      // const result = await roomAPI.updateRoom(roomToEdit._id, formData);
      onSuccess(result);
      onClose();

    } catch (err) {
      console.error("Error updating room:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!roomToEdit) return null;

  return (
    <dialog className={`modal ${isOpen ? "modal-open" : ""}`}>
      <form onSubmit={handleSubmit} className="modal-box w-11/12 max-w-2xl">
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h3 className="font-bold text-2xl">Edit Room</h3>
        <p className="py-2 text-base-content/70">
          Update details for "{roomToEdit.room_type}"
        </p>

        {error && (
          <div className="alert alert-error shadow-lg mt-4">
            <div>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </div>
        )}

          

        <div className="form-control mt-4 space-y-5">

          <div className="flex flex-col gap-2">
            <label className="label">
              <span className="label-text font-medium">Resort Image</span>
            </label>

            {imagePreview ? (
              <div className="relative w-full h-50">
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

          <div>
            <label className="label">
              <span className="label-text font-bold">Room Type</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROOM_TYPES.map((type) => (
                <button
                  type="button"
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
            <div>
              <label className="label">
                <span className="label-text font-bold">Guest Capacity</span>
              </label>
              <div className="join w-full">
                <button
                  type="button"
                  className="btn join-item"
                  onClick={() =>
                    handleInputChange(
                      "capacity",
                      Math.max(1, (formData.capacity || 0) - 1)
                    )
                  }
                >
                  −
                </button>
                <span className="btn join-item pointer-events-none flex-1">
                  {formData.capacity} Guests
                </span>
                <button
                  type="button"
                  className="btn join-item"
                  onClick={() =>
                    handleInputChange(
                      "capacity",
                      Math.min(20, (formData.capacity || 0) + 1)
                    )
                  }
                >
                  +
                </button>
              </div>
            </div>

            <div>
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

          <div>
            <label className="label">
              <span className="label-text font-bold">Room Status</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ROOM_STATUSES.map((status) => (
                <button
                  type="button"
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
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-neutral"
            disabled={isSubmitting}
          >
            {isSubmitting && <span className="loading loading-spinner"></span>}
            Save Changes
          </button>
        </div>
      </form>
    </dialog>
  );
}
