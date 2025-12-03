/* eslint-disable @typescript-eslint/no-explicit-any */
import Sidebar from "./components/sidebar";
import dayjs from "dayjs";
import { useEffect, useMemo, useState, useCallback } from "react";
import { allMonths } from "./helpers/general";
import {
  reservationAPI,
  type PaginationInfo,
  type Reservation,
} from "../api/reservation";
import { getStatusColor } from "./helpers/ui";
import { amenityAPI, type Amenity } from "../api/amenity";
import { statsAPI, type ResortStats } from "../api/stats";
import { useResortStore } from "./store/resort";
import {
  MapPin,
  Star,
  AlertCircle,
  Inbox,
  ListFilter,
  Calendar as CalendarIcon,
  Search,
  Edit,
  MessageSquare,
} from "lucide-react";
import ResortScreenMaps from "./components/maps";
import { Link } from "react-router";
import EditResortModal from "./components/modals/edit_resort";
import type { Resort } from "../api/resort";
import { feedbackAPI, type Feedback } from "../api/feedback";
import { roomAPI } from "../api/room";

const LoadingSpinner = ({
  size = "lg",
}: {
  size?: "xs" | "sm" | "md" | "lg";
}) => (
  <div className={`loading loading-spinner text-primary loading-${size}`}></div>
);

const FullPageLoader = ({
  text = "Loading Dashboard...",
}: {
  text?: string;
}) => (
  <main className="grid grid-cols-[0.2fr_1fr] h-dvh">
    <Sidebar />
    <div className="flex flex-col gap-6 p-12 items-center justify-center">
      <LoadingSpinner />
      <p className="text-lg opacity-70 mt-4">{text}</p>
    </div>
  </main>
);

const NoResortEmptyState = () => (
  <main className="hidden lg:grid grid-cols-[0.2fr_1fr] h-dvh">
    <Sidebar />
    <div className="flex flex-col gap-6 p-12 items-center justify-center text-center">
      <Inbox size={64} className="opacity-30 mb-4" />
      <h1 className="text-3xl font-bold">Welcome!</h1>
      <p className="text-lg opacity-70">You don't have a resort set up yet.</p>
      <Link to="/create/resort" className="btn btn-primary mt-4">
        Create Your First Resort
      </Link>
    </div>
  </main>
);

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

const displayStatus = (status: string) => {
  if (status === "rejected") return "Cancelled";
  return status.toUpperCase();
};

const ReservationsTable = ({
  reservations,
  loading,
  error,
  onRetry,
  onLoadMore,
  loadingMore,
  pagination,
}: {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onLoadMore: () => void;
  loadingMore: boolean;
  pagination: PaginationInfo | null;
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error shadow-lg h-64">
        <div className="flex flex-col items-center justify-center text-center">
          <AlertCircle size={48} className="mb-4" />
          <h3 className="font-bold text-xl">Failed to load reservations</h3>
          <p className="text-sm py-2">{error}</p>
          <button
            className="btn btn-sm btn-error-content mt-4"
            onClick={onRetry}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-center">
        <Inbox size={48} className="mb-4 opacity-50" />
        <h3 className="font-bold text-xl">No Reservations Found</h3>
        <p className="text-sm py-2 opacity-70">
          Try adjusting your search or filter settings.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Time In</th>
              <th>Time Out</th>
              <th>Room Type</th>
              <th>Total Price</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation, index) => (
              <tr key={reservation._id} className="hover">
                <th>{index + 1}</th>
                <td>
                  {dayjs(reservation.start_date).format(
                    "hh:mm A, MMMM DD, YYYY"
                  )}
                </td>
                <td>
                  {dayjs(reservation.end_date).format("hh:mm A, MMMM DD, YYYY")}
                </td>
                <td>{reservation.room_id_populated?.room_type}</td>
                <td>₱{reservation.total_price.toLocaleString()}</td>
                  <td>
                    <span
                      className="font-bold"
                      style={{
                        color: getStatusColor(reservation.status),
                      }}
                    >
                      {displayStatus(reservation.status)}
                    </span>
                  </td>
                <td className="text-right">
                  <Link
                    to={`/view/reservation/${reservation._id}`}
                    className="btn btn-sm btn-ghost"
                  >
                    View details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.hasNextPage && (
        <div className="text-center mt-8">
          <button
            className="btn btn-primary"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore && <span className="loading loading-spinner"></span>}
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </>
  );
};

export default function DashboardScreen() {
  const {
    resorts,
    loading: resortsLoading,
    hasResorts,
    fetchResortsByOwner,
  } = useResortStore();

  // State for filters
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  // State for Reservations
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reservationsError, setReservationsError] = useState<string | null>(
    null
  );
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // State for Amenities
  const [resortAmenities, setResortAmenities] = useState<Amenity[]>([]);
  const [loadingAmenities, setLoadingAmenities] = useState(true);

  // State for Stats
  const [resortStats, setResortStats] = useState<ResortStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedResort, setSelectedResort] = useState<Resort | null>(null);

  // --- 2. State for Feedbacks (no change) ---
  const [recentFeedbacks, setRecentFeedbacks] = useState<Feedback[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [feedbacksError, setFeedbacksError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "OneStay / Dashboard";
  }, []);

  const fetchReservations = useCallback(
    async (isRefresh = false, loadMore = false) => {
      try {
        if (isRefresh) {
          setReservationsLoading(true);
          setReservationsError(null);
          setCurrentPage(1);
        } else if (loadMore) {
          setLoadingMore(true);
        } else {
          setReservationsLoading(true);
          setReservationsError(null);
          setCurrentPage(1);
        }

        const pageToLoad = loadMore ? currentPage + 1 : 1;
        const filterValue =
          selectedFilter.toLowerCase() === "all"
            ? undefined
            : selectedFilter.toLowerCase();

        const response = await reservationAPI.getOwnerReservations({
          status: filterValue,
          page: pageToLoad,
          limit: 10,
          sortBy: "createdAt",
          sortOrder: "desc",
          search: searchQuery,
        });

        console.log(response.reservations);

        if (loadMore) {
          setReservations((prev) => [...prev, ...response.reservations]);
          setCurrentPage(pageToLoad);
        } else {
          setReservations(response.reservations || []);
        }

        setPagination(response.pagination);
      } catch (error: any) {
        console.error("Error fetching reservations:", error);
        setReservationsError(
          error.message || "Failed to load reservations. Please try again."
        );
      } finally {
        setReservationsLoading(false);
        setLoadingMore(false);
      }
    },
    [currentPage, selectedFilter, searchQuery]
  );

  const loadAmenities = useCallback(async (resortId: string) => {
    try {
      setLoadingAmenities(true);
      const amenities = await amenityAPI.getAmenitiesByResort(resortId);
      setResortAmenities(amenities);
    } catch (error) {
      console.error("Error loading amenities:", error);
    } finally {
      setLoadingAmenities(false);
    }
  }, []);

  const loadResortStats = useCallback(async (resortId: string) => {
    const defaultStats: ResortStats = {
      resortId,
      averageRating: 0,
      totalRooms: 0,
      totalReservations: 0,
      totalFeedbacks: 0,
      ratingBreakdown: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
    };

    try {
      setLoadingStats(true);
      const stats = await statsAPI.getResortStats(resortId);
      setResortStats(stats || defaultStats);
    } catch (error) {
      console.error("Error loading resort stats:", error);
      setResortStats(defaultStats);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadRecentFeedbacks = useCallback(async (resortId: string) => {
    try {
      setLoadingFeedbacks(true);
      setFeedbacksError(null);

      const { rooms } = await roomAPI.getRoomsByResort(resortId);
      if (!rooms || rooms.length === 0) {
        setRecentFeedbacks([]);
        return;
      }

      const roomMap = new Map<string, string>();
      rooms.forEach((room) => {
        roomMap.set(room._id, room.room_type);
      });

      const feedbackPromises = rooms.map((room) =>
        feedbackAPI.getRoomFeedbacks(room._id)
      );

      const allFeedbackResponses = await Promise.all(feedbackPromises);

      const allFeedbacks = allFeedbackResponses
        .flatMap((res) => res.feedbacks)
        .map((fb) => ({
          ...fb,
          // Manually add the room_name using the map
          room_name: roomMap.get(fb.room_id) || "Unknown Room",
        }));

      allFeedbacks.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setRecentFeedbacks(allFeedbacks.slice(0, 10) as Feedback[]);
    } catch (error: any) {
      console.error("Error loading recent feedbacks:", error);
      setFeedbacksError(error.message || "Failed to load feedback");
    } finally {
      setLoadingFeedbacks(false);
    }
  }, []);

  useEffect(() => {
    fetchResortsByOwner();
  }, [fetchResortsByOwner]);

  useEffect(() => {
    if (hasResorts && resorts.length > 0) {
      const resortId = resorts[0]._id;
      loadAmenities(resortId);
      loadResortStats(resortId);
      fetchReservations();
      loadRecentFeedbacks(resortId);
    }
  }, [
    hasResorts,
    resorts,
    loadAmenities,
    loadResortStats,
    fetchReservations,
    loadRecentFeedbacks,
  ]);

  const filteredReservations = useMemo(() => {
    if (selectedMonth === "All") {
      return reservations;
    }
    const monthIndex = allMonths.indexOf(selectedMonth);
    return reservations.filter((reservation) => {
      return dayjs(reservation.start_date).month() === monthIndex;
    });
  }, [reservations, selectedMonth]);

  if (resortsLoading) {
    return <FullPageLoader text="Loading your resort..." />;
  }

  if (!hasResorts) {
    return <NoResortEmptyState />;
  }

  const currentResort = resorts[0];

  const handleOpenEditModal = (resort: Resort) => {
    setSelectedResort(resort);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    if (currentResort) {
      loadResortStats(currentResort._id);
    }
  };

  return (
    <main className="relative flex flex-col gap-2 lg:grid grid-cols-[0.3fr_1fr] 2xl:grid-cols-[0.2fr_1fr] h-dvh bg-base-100">
      <Sidebar />
      <div className="flex flex-col gap-8 p-12 overflow-y-auto">
        <div className="flex flex-row items-center justify-between">
          <h1 className="lg:text-4xl font-bold">Dashboard</h1>
          <button
            className="btn btn-sm btn-outline btn-primary w-fit"
            onClick={() => handleOpenEditModal(currentResort)}
          >
            <Edit size={14} />
          </button>
        </div>

        <div className="flex flex-row gap-6 items-center">
          <img
            className="w-64 aspect-video rounded-xl object-cover shadow-md"
            src={currentResort.image}
            alt={currentResort.resort_name}
          />
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">{currentResort.resort_name}</h1>
            <p className="text-base-content/70">{currentResort.description}</p>
            <div className="flex flex-row gap-2 items-center text-base-content/90">
              <MapPin size={16} />
              <p>{currentResort.location.address}</p>
            </div>

            {loadingAmenities ? (
              <div className="flex flex-row gap-2 mt-2">
                <div className="skeleton h-8 w-24 rounded-full"></div>
                <div className="skeleton h-8 w-20 rounded-full"></div>
                <div className="skeleton h-8 w-28 rounded-full"></div>
              </div>
            ) : (
              <div className="flex flex-row gap-2 flex-wrap items-center mt-2">
                {resortAmenities.map((amenity) => (
                  <div
                    key={amenity._id}
                    className="flex flex-row gap-2 px-4 py-1.5 bg-base-300 rounded-full items-center"
                  >
                    <Star size={14} className="text-secondary" />
                    <p className="text-sm font-medium">{amenity.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <ResortScreenMaps
          location={{
            address: currentResort.location.address,
            latitude: currentResort.location.latitude,
            longitude: currentResort.location.longitude,
          }}
          resortName={currentResort.resort_name}
        />

        {loadingStats ? (
          <div className="grid grid-cols-2 2xl:grid-cols-4 gap-4">
            <div className="skeleton h-28 rounded-xl"></div>
            <div className="skeleton h-28 rounded-xl"></div>
            <div className="skeleton h-28 rounded-xl"></div>
            <div className="skeleton h-28 rounded-xl"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 2xl:grid-cols-4 gap-4">
            <div className="stat bg-base-200 rounded-xl shadow">
              <div className="stat-title">Avg. Rating</div>
              <div className="stat-value text-secondary">
                {resortStats?.averageRating.toFixed(1) || "0.0"}
              </div>
              <div className="stat-desc">
                {resortStats?.totalFeedbacks || 0} Reviews
              </div>
            </div>
            <div className="stat bg-base-200 rounded-xl shadow">
              <div className="stat-title">Total Rooms</div>
              <div className="stat-value">{resortStats?.totalRooms || 0}</div>
              <div className="stat-desc">All room types</div>
            </div>
            <div className="stat bg-base-200 rounded-xl shadow">
              <div className="stat-title">Total Reservations</div>
              <div className="stat-value">
                {resortStats?.totalReservations || 0}
              </div>
              <div className="stat-desc">All-time</div>
            </div>
            <div className="stat bg-base-200 rounded-xl shadow">
              <div className="stat-title">5-Star Ratings</div>
              <div className="stat-value text-secondary">
                {resortStats?.ratingBreakdown["5"] || 0}
              </div>
              <div className="stat-desc">
                Out of {resortStats?.totalFeedbacks || 0} reviews
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <h1 className="text-2xl font-bold">Total reservations</h1>
            <div className="hidden 2xl:flex flex-col md:flex-row gap-6">
              <label className="flex items-center gap-2">
                <ListFilter size={16} className="opacity-70" />
                <select
                  className="select select-bordered select-sm w-40"
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

              <label className="flex items-center gap-2">
                <CalendarIcon size={16} className="opacity-70" />
                <select
                  id="month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="select select-bordered select-sm w-40"
                >
                  <option value={"All"}>All Months</option>
                  {allMonths.map((monthName) => (
                    <option key={monthName} value={monthName}>
                      {monthName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="input input-bordered input-sm flex items-center gap-2">
                <input
                  type="search"
                  className="grow"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchReservations()}
                />
              </label>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => fetchReservations()}
              >
                <Search size={16} />
              </button>
            </div>
          </div>
          <div className="hidden 2xl:flex flex-col md:flex-row gap-6">
            <label className="flex items-center gap-2">
              <ListFilter size={16} className="opacity-70" />
              <select
                className="select select-bordered select-sm w-40"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </label>

            <label className="flex items-center gap-2">
              <CalendarIcon size={16} className="opacity-70" />
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="select select-bordered select-sm w-40"
              >
                <option value={"All"}>All Months</option>
                {allMonths.map((monthName) => (
                  <option key={monthName} value={monthName}>
                    {monthName}
                  </option>
                ))}
              </select>
            </label>

            <label className="input input-bordered input-sm flex items-center gap-2">
              <input
                type="search"
                className="grow"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchReservations()}
              />
            </label>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => fetchReservations()}
            >
              <Search size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-4 p-4 rounded-xl bg-base-200 shadow-sm">
            <ReservationsTable
              reservations={filteredReservations}
              loading={reservationsLoading}
              error={reservationsError}
              onRetry={fetchReservations}
              onLoadMore={() => fetchReservations(false, true)}
              loadingMore={loadingMore}
              pagination={pagination}
            />
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Recent Guest Feedback</h1>
            <div className="flex flex-col gap-4 p-4 rounded-xl bg-base-200 shadow-sm min-h-[500px]">
              {loadingFeedbacks ? (
                <div className="flex justify-center items-center h-64">
                  <LoadingSpinner />
                </div>
              ) : feedbacksError ? (
                <div className="alert alert-warning">
                  <AlertCircle size={20} />
                  <span>Could not load feedback.</span>
                </div>
              ) : recentFeedbacks.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-64 text-center">
                  <MessageSquare size={48} className="mb-4 opacity-50" />
                  <h3 className="font-bold text-xl">No Feedback Yet</h3>
                  <p className="text-sm py-2 opacity-70">
                    When guests leave reviews, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentFeedbacks.map((feedback) => (
                    <div
                      key={feedback._id}
                      className="card bg-base-100 shadow-sm"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="avatar placeholder">
                              <div className="bg-neutral text-neutral-content rounded-full w-10">
                                <span>
                                  {feedback.from_user_id.username
                                    .substring(0, 1)
                                    .toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <span className="font-bold">
                              {feedback.from_user_id.username}
                            </span>
                            <span className="badge badge-sm badge-neutral self-center">
                              {feedback.room_name || "Unknown Room"}
                            </span>
                          </div>
                          {renderStars(feedback.rating)}
                        </div>

                        <p className="text-base-content/90 italic mt-2">
                          "{feedback.comment}"
                        </p>
                        <span className="text-xs text-base-content/50 mt-1">
                          {dayjs(feedback.createdAt).format("MMM DD, YYYY")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditResortModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        resort={selectedResort}
      />
    </main>
  );
}
