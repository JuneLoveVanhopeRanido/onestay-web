/* eslint-disable @typescript-eslint/no-explicit-any */
import Sidebar from "./components/sidebar";
import { useEffect, useState, useCallback } from "react";
import { reservationAPI, type Reservation } from "../api/reservation";
import dayjs from "dayjs";
import { AlertCircle, Check, X } from "lucide-react";
import { getStatusColor } from "./helpers/ui";
import { useParams } from "react-router";

const LoadingComponent = () => (
  <div className="flex justify-center items-center h-[80vh]">
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
  <div className="alert alert-error shadow-lg h-96">
    <div className="flex flex-col items-center justify-center text-center">
      <AlertCircle size={48} className="mb-4" />
      <h3 className="font-bold text-xl">Failed to load reservation</h3>
      <p className="text-sm py-2">{message}</p>
      <button className="btn btn-sm btn-error-content mt-4" onClick={onRetry}>
        Try Again
      </button>
    </div>
  </div>
);

export default function ViewReservationScreen() {
  const params = useParams();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "OneStay / Reservation";
  }, []);

  const fetchReservation = useCallback(async () => {
    if (!params.id) {
      setError("No reservation ID provided.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setActionError(null);

      const data = await reservationAPI.getReservationById(params.id);
      setReservation(data.reservation);
      console.log(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unknown error occurred.");
      setReservation(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  const handleUpdateStatus = async (
    status: "approved" | "rejected" | "cancelled" | "completed"
  ) => {
    if (!reservation) return;

    const apiCall = {
      approved: () =>
        reservationAPI.updateReservationStatus(reservation._id, "approved"),
      rejected: () =>
        reservationAPI.updateReservationStatus(reservation._id, "rejected"),
      cancelled: () => reservationAPI.cancelReservation(reservation._id),
      completed: () => reservationAPI.completeReservation(reservation._id),
    }[status];

    try {
      setIsSubmitting(true);
      setActionError(null);

      await apiCall();

      await fetchReservation();
    } catch (err: any) {
      console.error(`Failed to ${status} reservation:`, err);
      setActionError(err.message || `Failed to ${status} reservation.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingComponent />;
    }

    if (error) {
      return <ErrorComponent message={error} onRetry={fetchReservation} />;
    }

    if (!reservation) {
      return null;
    }
    const today = dayjs().startOf("day");
    const checkoutDate = dayjs(reservation.end_date).startOf("day");
    const canComplete =
      today.isAfter(checkoutDate) || today.isSame(checkoutDate);

    return (
      <div className="flex flex-col gap-4 p-6 bg-base-300 rounded-xl">
        <h2 className="text-xl font-semibold">Guest Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Name</legend>
            <input
              type="text"
              className="input w-full"
              value={(reservation.user_id as any).username || "N/A"}
              disabled={true}
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Email</legend>
            <input
              type="text"
              className="input w-full"
              value={(reservation.user_id as any).email || "N/A"}
              disabled={true}
            />
          </fieldset>
        </div>

        <h2 className="text-xl font-semibold mt-4">Reservation Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Reservation ID</legend>
            <input
              type="text"
              className="input w-full"
              value={reservation._id}
              disabled={true}
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Room Type</legend>
            <input
              type="text"
              className="input w-full"
              value={(reservation.room_id as any)?.room_type || "N/A"}
              disabled={true}
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Total Price</legend>
            <input
              type="text"
              className="input w-full"
              value={`₱${reservation.total_price.toLocaleString()}`}
              disabled={true}
            />
          </fieldset>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Check-in Date</legend>
            <input
              type="text"
              className="input w-full"
              value={dayjs(reservation.start_date).format("MMMM DD, YYYY")}
              disabled={true}
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Check-out Date</legend>
            <input
              type="text"
              className="input w-full"
              value={dayjs(reservation.end_date).format("MMMM DD, YYYY")}
              disabled={true}
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Status</legend>
            <input
              type="text"
              className="input w-full font-bold"
              value={reservation.status.toUpperCase()}
              disabled={true}
              style={{ color: getStatusColor(reservation.status) }}
            />
          </fieldset>
        </div>

        <div className="flex flex-col gap-4 items-center mt-6">
          {actionError && (
            <div className="alert alert-error shadow-lg">
              <div>
                <AlertCircle />
                <span>{actionError}</span>
              </div>
            </div>
          )}

          <div className="flex flex-row gap-4 items-center w-full">
            {reservation.status === "approved" && (
              <>
                <button
                  className="btn btn-neutral flex-1"
                  onClick={() => handleUpdateStatus("cancelled")}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    <X size={18} />
                  )}
                  Cancel Reservation
                </button>
                <div
                  className="tooltip flex-1"
                  data-tip={
                    !canComplete
                      ? "Can only mark as complete on or after the checkout date."
                      : ""
                  }
                >
                  <button
                    className="btn btn-success flex-1 w-full"
                    onClick={() => handleUpdateStatus("completed")}
                    disabled={isSubmitting || !canComplete}
                  >
                    {isSubmitting ? (
                      <span className="loading loading-spinner"></span>
                    ) : (
                      <Check size={18} />
                    )}
                    Mark as Completed
                  </button>
                </div>
              </>
            )}

            {reservation.status === "cancelled" && (
              <>
                <button
                  className="btn btn-success flex-1"
                  onClick={() => handleUpdateStatus("approved")}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    <Check size={18} />
                  )}
                  Re-Approve Reservation
                </button>
              </>
            )}

            {reservation.status === "pending" && (
              <>
                {/* <button
                  className="btn btn-error flex-1"
                  onClick={() => handleUpdateStatus("rejected")}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    <ThumbsDown size={18} />
                  )}
                  Reject Reservation
                </button> */}
                <button
                  className="btn btn-success flex-1"
                  onClick={() => handleUpdateStatus("approved")}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    <Check size={18} />
                  )}
                  Approve Reservation
                </button>
              </>
            )}

            {(reservation.status === "completed" ||
              reservation.status === "rejected") && (
              <p className="text-center w-full opacity-70">
                This reservation is <strong>{reservation.status}</strong> and no
                further actions can be taken.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="grid grid-cols-[0.2fr_1fr] h-dvh bg-base-100">
      <Sidebar />
      <div className="flex flex-col gap-6 p-12 overflow-y-auto">
        <h1 className="text-4xl font-bold">Reservation Details</h1>
        {renderContent()}
      </div>
    </main>
  );
}
