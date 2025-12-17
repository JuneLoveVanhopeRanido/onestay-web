/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import { type Room, roomAPI } from "../api/room";
import Sidebar from "./components/sidebar";
import { useResortStore } from "./store/resort";
import { Users, AlertCircle, Inbox, CircleChevronLeft } from "lucide-react";
import CreateRoomModal from "./components/modals/add_room";
import { Link,useParams } from "react-router";

const LoadingComponent = () => (
  <div className="flex justify-center items-center col-span-full h-64">
    <div className="loading loading-spinner loading-lg text-primary"></div>
  </div>
);

const ErrorComponent = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="alert alert-error shadow-lg col-span-full">
    <div className="flex-1">
      <AlertCircle size={48} />
      <div>
        <h3 className="font-bold text-xl">Failed to load rooms</h3>
        <p className="text-sm py-2">{message}</p>
      </div>
    </div>
    <button className="btn btn-sm btn-error-content" onClick={onRetry}>
      Try Again
    </button>
  </div>
);

const EmptyComponent = () => (
  <div className="flex flex-col justify-center items-center text-center col-span-full h-64">
    <Inbox size={48} className="mb-4 opacity-50" />
    <h3 className="font-bold text-xl">No Rooms Found</h3>
    <p className="text-sm py-2 opacity-70">
      Click "Add Room" to create your first one.
    </p>
  </div>
);

export default function RoomsScreen() {
  
  const { room_type } = useParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { resorts, hasResorts, loading: resortsLoading } = useResortStore();
  const currentResortId = hasResorts ? resorts[0]._id : null;

  useEffect(() => {
    document.title = "OneStay / Rooms";
  }, []);

  const fetchRooms = useCallback(async () => {
    if (!currentResortId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await roomAPI.getRoomsByResort(currentResortId);
      const filteredRoom = response.rooms.filter(room => room.room_type == room_type);
      setRooms(filteredRoom);
      console.log('death',response);
    } catch (error: any) {
      console.error("Error fetching rooms:", error);
      setError(error.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, [currentResortId,room_type]);

  useEffect(() => {

    fetchRooms();

  }, [fetchRooms]);

  const handleCreateSuccess = (newRoom: Room) => {
    setRooms((prevRooms) => [...prevRooms, newRoom]);
    setIsModalOpen(false);
  };

  const renderContent = () => {
    if (loading || resortsLoading) {
      return <LoadingComponent />;
    }
    if (error) {
      return <ErrorComponent message={error} onRetry={fetchRooms} />;
    }
    if (rooms.length === 0) {
      return <EmptyComponent />;
    }

    return rooms.map((room) => (
      <Link
        to={`/view/rooms/${room._id}`}
        key={room._id}
        className="card bg-base-200 shadow-sm"
      >
        <div className="card-body">
          <h2 className="card-title">{room.room_type} {room.room_number}</h2>
          <div className="flex flex-row gap-4 items-center">
            <Users size={16} className="opacity-70" />
            <p>{room.capacity} guests</p>
          </div>
          <div className="divider my-1" />
          <div className="flex flex-row items-center justify-between">
            <h3 className="font-bold text-lg">
              ₱{room.price_per_night.toLocaleString()}/night
            </h3>
            <div
  className={`badge text-white capitalize ${
    room.status === "maintenance"
      ? "bg-red-500"
      : room.status === "available"
      ? "bg-green-500"
      : "bg-blue-500"
  }`}
>
  {room.status}
</div>

          </div>
        </div>
      </Link>
    ));
  };

  return (
    <>
      <main className="relative grid grid-cols-[0.3fr_1fr] 2xl:grid-cols-[0.2fr_1fr] h-dvh bg-base-100">
        <Sidebar />
        <div className="flex flex-col gap-8 p-12 overflow-y-auto">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-2 justify-between">
              <Link
                to={`/rooms`}
              >
                <CircleChevronLeft size={30} className="opacity-70 text-primary" />
              </Link>
              <h1 className="lg:text-4xl font-bold">{room_type}s</h1></div>
            
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderContent()}
          </div>
        </div>
      </main>

      {currentResortId && (
        <CreateRoomModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleCreateSuccess}
          resortId={currentResortId}
        />
      )}
    </>
  );
}
