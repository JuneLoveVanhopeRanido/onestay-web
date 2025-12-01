/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import Sidebar from "./components/sidebar";
import { roomAPI, type Room } from "../api/room";
import { feedbackAPI } from "../api/feedback";
import { Users, Star, AlertCircle, Inbox, Edit, Trash2, CircleChevronLeft } from "lucide-react";
import dayjs from "dayjs";
import type { PaginationInfo } from "../api/reservation";
import { useNavigate, useParams } from "react-router";
import DeleteConfirmationModal from "./components/modals/delete_amenity";
import EditRoomModal from "./components/modals/edit_room";
import { Link } from "react-router";

interface FeedbackUser {
  _id: string;
  username: string;
}

interface Feedback {
  _id: string;
  from_user_id: FeedbackUser;
  rating: number;
  comment: string;
  createdAt: string;
}

interface RatingStats {
  averageRating: number;
  totalReviews: number;
}

const LoadingComponent = () => (
  <div className="flex justify-center items-center h-full">
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
  <div className="flex flex-col gap-6 p-12 overflow-y-auto items-center justify-center h-full">
    <div className="alert alert-error shadow-lg max-w-lg">
      <div className="flex flex-col items-center justify-center text-center">
        <AlertCircle size={48} className="mb-4" />
        <h3 className="font-bold text-xl">Failed to load room data</h3>
        <p className="text-sm py-2">{message}</p>
        <button className="btn btn-sm btn-error-content mt-4" onClick={onRetry}>
          Try Again
        </button>
      </div>
    </div>
  </div>
);

const EmptyFeedbacks = () => (
  <div className="flex flex-col justify-center items-center h-48 text-center bg-base-200 rounded-xl">
    <Inbox size={48} className="mb-4 opacity-50" />
    <h3 className="font-bold text-xl">No Reviews Yet</h3>
    <p className="text-sm py-2 opacity-70">
      This room doesn't have any guest feedback.
    </p>
  </div>
);

export default function ViewRoomScreen() {
  const params = useParams();
  const navigate = useNavigate();

  // Data State
  const [room, setRoom] = useState<Room | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchRoomData = useCallback(
    async (page = 1, limit = 10, loadMore = false) => {
      if (!params.id) return;

      try {
        if (!loadMore) {
          setIsLoading(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        const [roomData, feedbackData] = await Promise.all([
          page === 1 ? roomAPI.getRoomById(params.id) : Promise.resolve(room),
          feedbackAPI.getRoomFeedbacks(params.id, page, limit),
        ]);

        if (page === 1) {
          setRoom(roomData);
          setFeedbacks(feedbackData.feedbacks || []);
        } else {
          setFeedbacks((prev) => [...prev, ...feedbackData.feedbacks]);
        }

        setRatingStats(feedbackData.ratingStats);
        setPagination(feedbackData.pagination);
        setCurrentPage(page);

        console.log("test", roomData);
        console.log(feedbackData);
      } catch (error: any) {
        console.error("Error fetching room data:", error);
        if (!loadMore) {
          setError(error.message || "Failed to fetch room details.");
        }
      } finally {
        setIsLoading(false);
        setLoadingMore(false);
      }
    },
    [params.id]
  );

  useEffect(() => {
    document.title = "OneStay / View Room";
    fetchRoomData(1);
  }, [fetchRoomData]);

  const handleLoadMore = () => {
    if (pagination?.hasNextPage && !loadingMore) {
      fetchRoomData(currentPage + 1, 10, true);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < rating ? "text-yellow-400" : "text-base-300"}
            fill={i < rating ? "currentColor" : "none"}
          />
        ))}
      </div>
    );
  };

  const handleEditSuccess = (updatedRoom: Room) => {
    setRoom(updatedRoom);
  };

  const handleDeleteConfirm = async () => {
    if (!room) return;

    try {
      await roomAPI.deleteRoom(room._id);
      setIsDeleteModalOpen(false);
      navigate("/rooms");
    } catch (err) {
      throw err;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-6 p-12 overflow-y-auto">
          <LoadingComponent />
        </div>
      );
    }

    if (error) {
      return (
        <ErrorComponent message={error} onRetry={() => fetchRoomData(1)} />
      );
    }

    if (!room) {
      return null;
    }

    return (
      <div className="flex flex-col gap-8 p-12 overflow-y-auto">
        <div className="flex items-center">
          <Link to={`/view/rooms-type/${params.id}/${room.room_type}`} className="flex items-center gap-1 text-primary">
            <CircleChevronLeft size={24} className="opacity-70" />
            <span className="lg:text-2xl font-bold">Back</span>
          </Link>
        </div>
        <div className="flex flex-row items-center justify-between">

          <div className="flex flex-col gap-2">

            <div className="flex flex-row gap-6 ">

              <div className="flex flex-col">
                  <img
                  className="w-64 aspect-video rounded-xl object-cover shadow-md"
                  src={room.image}
                  alt={room.room_type}
                />
              </div>
              <div className="flex flex-col gap-2">
                  <h2 className="text-4xl font-bold">{room.room_type}</h2>
                  <div className="flex flex-row gap-2 items-center">
                    <div className="flex flex-row gap-2 items-center badge badge-neutral badge-lg">
                      <Users size={16} className="opacity-70" />
                      <p>{room.capacity} guests</p>
                    </div>
                    <h3 className="badge badge-neutral badge-lg">
                      ₱{room.price_per_night.toLocaleString()}/night
                    </h3>
                    <h3
                      className={`badge badge-lg ${
                        room.status === "available" ? "badge-success" : "badge-error"
                      }`}
                    >
                      {room.status}
                      
                    </h3>
                  </div>
                  
                  <p  className="text-base-content/70">{room.description}</p>
                </div>
              </div>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-outline btn-primary"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit size={16} />
              Edit
            </button>
            <button
              className="btn btn-outline btn-error"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat bg-base-200 rounded-xl shadow">
            <div className="stat-figure text-secondary">
              <Star size={32} />
            </div>
            <div className="stat-title">Average Rating</div>
            <div className="stat-value text-secondary">
              {ratingStats?.averageRating.toFixed(1) || "N/A"}
            </div>
            <div className="stat-desc">Based on all reviews</div>
          </div>
          <div className="stat bg-base-200 rounded-xl shadow">
            <div className="stat-figure text-primary">
              <Users size={32} />
            </div>
            <div className="stat-title">Total Reviews</div>
            <div className="stat-value text-primary">
              {ratingStats?.totalReviews.toLocaleString() || 0}
            </div>
            <div className="stat-desc">All-time feedback</div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Guest Feedback</h2>
          {feedbacks.length === 0 ? (
            <EmptyFeedbacks />
          ) : (
            <div className="flex flex-col gap-4">
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="card bg-base-200 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="flex bg-neutral text-neutral-content rounded-full w-10 items-center justify-center">
                            <span className="self-center text-lg">
                              {feedback.from_user_id.username
                                .substring(0, 1)
                                .toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold">
                          {feedback.from_user_id.username}
                        </span>
                      </div>
                      <span className="text-sm text-base-content/70">
                        {dayjs(feedback.createdAt).format("MMM DD, YYYY")}
                      </span>
                    </div>
                    {renderStars(feedback.rating)}
                    <p className="mt-2 text-base-content/90">
                      {feedback.comment}
                    </p>
                  </div>
                </div>
              ))}

              {pagination && pagination.hasNextPage && (
                <div className="text-center mt-4">
                  <button
                    className="btn btn-primary"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore && (
                      <span className="loading loading-spinner"></span>
                    )}
                    {loadingMore ? "Loading..." : "Load More Reviews"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="grid grid-cols-[0.2fr_1fr] h-dvh bg-base-100">
      <Sidebar />
      {renderContent()}
      <EditRoomModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        roomToEdit={room}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Room"
        message={`Are you sure you want to delete the "${room?.room_type}"? This will permanently remove all associated data, including reservations and feedback. This action cannot be undone.`}
      />
    </main>
  );
}
