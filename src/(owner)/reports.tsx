/* eslint-disable @typescript-eslint/no-explicit-any */
import Sidebar from "./components/sidebar";
import dayjs from "dayjs";
import { useState, useEffect, useMemo, useCallback } from "react";
import { type Reservation, reservationAPI } from "../api/reservation";
import { allMonths } from "./helpers/general";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePDF } from "react-to-pdf";
import { AlertCircle, Inbox, ListFilter, Download } from "lucide-react";
import { PDFReportLayout } from "./components/pdf_layout";

const LoadingComponent = () => (
  <div className="flex justify-center items-center h-[60vh]">
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
      <h3 className="font-bold text-xl">Failed to load reports</h3>
      <p className="text-sm py-2">{message}</p>
      <button className="btn btn-sm btn-error-content mt-4" onClick={onRetry}>
        Try Again
      </button>
    </div>
  </div>
);

const EmptyComponent = () => (
  <div className="flex flex-col justify-center items-center h-[60vh] text-center">
    <Inbox size={48} className="mb-4 opacity-50" />
    <h3 className="font-bold text-xl">No Data Found</h3>
    <p className="text-sm py-2 opacity-70">
      There is no reservation data matching your filter.
    </p>
  </div>
);

export default function ReportsScreen() {
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];
  const { toPDF, targetRef } = usePDF({
    filename: `report-${dayjs(new Date()).format("YYYY-MM-DD")}.pdf`,
  });

  const [selectedFilter, setSelectedFilter] = useState("All");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "OneStay / Reports";
  }, []);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterValue =
        selectedFilter.toLowerCase() === "all"
          ? undefined
          : selectedFilter.toLowerCase();

      const response = await reservationAPI.getOwnerReservations({
        status: filterValue,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      console.log(response.reservations);
      setReservations(response.reservations || []);
    } catch (error: any) {
      const errorMessage = error.message || "An unknown error occurred";
      console.error("Error fetching reservations:", error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedFilter]);

  const monthlySalesData = useMemo(() => {
    const salesData = allMonths.map((month) => ({
      month: month.substring(0, 3),
      sales: 0,
    }));

    reservations.forEach((reservation) => {
      if (
        reservation.status === "approved" ||
        reservation.status === "completed"
      ) {
        const monthIndex = dayjs(reservation.start_date).month(); // 0-11
        salesData[monthIndex].sales += reservation.total_price;
      }
    });

    return salesData;
  }, [reservations]);

  const roomTypeData = useMemo(() => {
    const counts: { [key: string]: number } = {};

    reservations.forEach((reservation) => {
      const roomType = reservation.room_id_populated?.room_type;
      if (roomType) {
        counts[roomType] = (counts[roomType] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [reservations]);

  const detailedSalesData = useMemo(() => {
    const salesByMonth: {
      [month: string]: { roomType: string; price: number; id: string }[];
    } = {};

    reservations.forEach((reservation) => {
      if (
        reservation.status === "approved" ||
        reservation.status === "completed"
      ) {
        const monthIndex = dayjs(reservation.start_date).month();
        const monthName = allMonths[monthIndex];

        if (!salesByMonth[monthName]) {
          salesByMonth[monthName] = [];
        }

        salesByMonth[monthName].push({
          id: reservation._id,
          roomType: reservation.room_id_populated?.room_type || "N/A",
          price: reservation.total_price,
        });
      }
    });
    return salesByMonth;
  }, [reservations]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const renderContent = () => {
    if (loading) {
      return <LoadingComponent />;
    }

    if (error) {
      return <ErrorComponent message={error} onRetry={fetchReservations} />;
    }

    if (reservations.length === 0) {
      return <EmptyComponent />;
    }

    return (
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">
            Monthly Sales (Confirmed/Completed)
          </h2>
          <p className="text-sm -mt-3 text-base-content/70">
            This chart shows total sales from confirmed and completed
            reservations for the year.
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={monthlySalesData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `₱${value.toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="sales" fill="#8884d8" name="Sales (PHP)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Reservations by Room Type</h2>
          <p className="text-sm -mt-3 text-base-content/70">
            This chart shows the breakdown of reservations based on the status:
            <span className="font-bold p-1 bg-base-300 rounded-md mx-1">
              {selectedFilter}
            </span>
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={roomTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name} (${entry.value})`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {roomTypeData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  value,
                  `${name} reservations`,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <main className="grid grid-cols-[0.3fr_1fr] 2xl:grid-cols-[0.2fr_1fr] h-dvh bg-base-100">
      <Sidebar />
      <div className="flex flex-col gap-6 p-12 overflow-y-auto">
        <div className="flex flex-row items-center justify-between">
          <h1 className="lg:text-4xl font-bold">Reports</h1>
          <button
            className="btn btn-primary"
            onClick={() => toPDF()}
            disabled={loading || !!error}
          >
            <Download size={18} />
            Export as PDF
          </button>
        </div>

        <div className="flex flex-row gap-4 items-center">
          <label className="flex items-center gap-4">
            <ListFilter size={36} className="opacity-70" />
            <span className="font-medium text-nowrap">Filter by Status</span>
            <select
              className="select select-bordered select-sm"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              disabled={loading}
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-4 p-6 rounded-xl bg-base-200 shadow-sm">
          {renderContent()}
        </div>
      </div>
      <PDFReportLayout
        ref={targetRef}
        monthlySalesData={monthlySalesData}
        detailedSalesData={detailedSalesData}
        roomTypeData={roomTypeData}
        filter={selectedFilter}
        colors={COLORS}
      />
    </main>
  );
}
