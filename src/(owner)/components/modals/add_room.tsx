import { useState, useEffect } from "react";
import { Home, Check, X, AlertCircle } from "lucide-react";
import { roomAPI, type Room } from "../../../api/room";

interface CreateRoomFormData {
  resort_id: string;
  room_type: string;
  capacity: number;
  price_per_night: number;
  status: string;
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
  { value: "maintenance", label: "Under Maintenance" },
  { value: "occupied", label: "Occupied" },
];

const INITIAL_FORM_STATE = {
  room_type: "",
  capacity: 2,
  price_per_night: 1000,
  status: "available",
};

// --- Modal Component ---

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

    try {
      setLoading(true);
      setError(null);

      const newRoom = await roomAPI.createRoom(formData);

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
            <div className="grid grid-cols-3 gap-2">
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
