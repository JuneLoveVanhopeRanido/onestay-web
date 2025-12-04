/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Sidebar from "./components/sidebar";
import dayjs from "dayjs";
import { ListFilter, Calendar, AlertCircle, Inbox } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  type Reservation,
  type PaginationInfo,
  reservationAPI,
} from "../api/reservation";
import { getStatusColor } from "./helpers/ui";
import { allMonths } from "./helpers/general";
import { Link } from "react-router";

const LoadingComponent = () => (
  <div className="flex justify-center items-center h-64">
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
  <div className="alert alert-error shadow-lg h-64">
    <div className="flex flex-col items-center justify-center text-center">
      <AlertCircle size={48} className="mb-4" />
      <h3 className="font-bold text-xl">Failed to load reservations</h3>
      <p className="text-sm py-2">{message}</p>
      <button className="btn btn-sm btn-error-content mt-4" onClick={onRetry}>
        Try Again
      </button>
    </div>
  </div>
);

const EmptyComponent = () => (
  <div className="flex flex-col justify-center items-center h-64 text-center">
    <Inbox size={48} className="mb-4 opacity-50" />
    <h3 className="font-bold text-xl">No Reservations Found</h3>
    <p className="text-sm py-2 opacity-70">
      Try adjusting your search or filter settings.
    </p>
  </div>
);

export default function GuestsScreen() {
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const [loading, setLoading] = useState(true);
  const [_refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "OneStay / Guests";
  }, []);

  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchReservations = async (isRefresh = false, loadMore = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setCurrentPage(1);
        setError(null);
      } else if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const pageToLoad = loadMore ? currentPage + 1 : isRefresh ? 1 : 1;

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
        setCurrentPage(1);
      }

      setPagination(response.pagination);
    } catch (error: any) {
      const errorMessage = error.message || "An unknown error occurred";
      console.error("Error fetching reservations:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const filteredReservations = useMemo(() => {
    if (selectedMonth === "All") {
      return reservations;
    }

    const monthIndex = allMonths.indexOf(selectedMonth);

    return reservations.filter((reservation) => {
      return dayjs(reservation.start_date).month() === monthIndex;
    });
  }, [reservations, selectedMonth]);

  useEffect(() => {
    fetchReservations();
  }, [selectedFilter]);

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchReservations();
  };
  
  const displayStatus = (status: string) => {
    if (status === "rejected") return "Cancelled";
    return status.toUpperCase();
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingComponent />;
    }

    if (error) {
      return (
        <ErrorComponent message={error} onRetry={() => fetchReservations()} />
      );
    }

    if (filteredReservations.length === 0) {
      return <EmptyComponent />;
    }

    return (
      <>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Room Type</th>
                <th>Total Price</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((reservation) => (
                <tr key={reservation._id} className="hover">
                  <td className="font-mono text-xs opacity-80">
                    {reservation._id}
                  </td>
                  <td>{reservation.user_id_populated?.username}</td>
                  <td>{reservation.user_id_populated?.email}</td>
                  <td>{reservation.room_id_populated?.room_type} {reservation.room_id_populated?.room_number ?? "-"}</td>
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
              onClick={() => fetchReservations(false, true)}
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


  return (
    <main className="grid grid-cols-[0.3fr_1fr] 2xl:grid-cols-[0.2fr_1fr] h-dvh bg-base-100">
      <Sidebar />
      <div className="flex flex-col gap-6 p-12 overflow-y-auto">
        <div className="flex flex-row gap-4 items-center justify-between">
          <h1 className="lg:text-4xl font-bold">Guests</h1>

          <div className="flex flex-row gap-2 items-center">
            <label className="input input-bordered flex items-center gap-2">
              <input
                type="search"
                className="grow"
                placeholder="Search by name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <svg
                className="h-[1em] opacity-50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <g
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </g>
              </svg>
            </label>
            <button className="btn btn-primary" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>

        <div className="flex flex-row gap-8 items-center">
          <label className="flex items-center gap-2">
            <ListFilter size={36} className="opacity-70" />
            <span className="font-medium">Status</span>
            <select
              className="select select-bordered select-sm"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <Calendar size={36} className="opacity-70" />
            <span className="font-medium">Month</span>
            <select
              className="select select-bordered select-sm"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="All">All Months</option>
              {allMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-4 p-6 rounded-xl bg-base-200 shadow-sm">
          {renderContent()}
        </div>
      </div>
    </main>
  );
}
