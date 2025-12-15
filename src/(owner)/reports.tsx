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
import {
  AlertCircle,
  Inbox,
  ListFilter,
  Download,
  ChevronDown,
} from "lucide-react";
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
  const [pdfFilename, setPdfFilename] = useState(
    `report-${dayjs().format("YYYY-MM-DD")}.pdf`
  );
  const { toPDF, targetRef } = usePDF({
    filename: pdfFilename,
  });

  const VALID_SALES_STATUSES = ["approved", "confirmed", "completed"];


  const [selectedFilter, setSelectedFilter] = useState("All");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("All");


  const [pdfFilterMonth, setPdfFilterMonth] = useState("All");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    document.title = "OneStay / Reports";
  }, []);

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (selectedFilter === "All") return true;
      return r.status === selectedFilter.toLowerCase();
    });
  }, [reservations, selectedFilter]);


  useEffect(() => {
    if (isGeneratingPdf) {
      const timeout = setTimeout(() => {
        toPDF();
        setIsGeneratingPdf(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isGeneratingPdf, toPDF]);

  const handleExportPDF = (month: string) => {
    setPdfFilterMonth(month);
    setPdfFilename(
      `OneStay_Report_${month}_${dayjs().format("YYYY-MM-DD")}.pdf`
    );
    setIsGeneratingPdf(true);

    const elem = document.activeElement as HTMLElement;
    if (elem) {
      elem.blur();
    }
  };

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
  const salesData = allMonths.map((m) => ({
    month: m.substring(0, 3),
    sales: 0,
  }));

  filteredReservations.forEach((r) => {
    if (VALID_SALES_STATUSES.includes(r.status)) {
      salesData[dayjs(r.start_date).month()].sales += r.total_price;
    }
  });

  if (selectedMonth !== "All") {
    const idx = allMonths.indexOf(selectedMonth);
    return idx !== -1 ? [salesData[idx]] : [];
  }

  return salesData;
}, [filteredReservations, selectedMonth]);


const roomTypeData = useMemo(() => {
  const counts: Record<string, number> = {};

  filteredReservations.forEach((r) => {
    const type = r.room_id_populated?.room_type;
    if (type) counts[type] = (counts[type] || 0) + 1;
  });

  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}, [filteredReservations]);


const pdfData = useMemo(() => {
  const filtered = filteredReservations.filter((r) => {
    if (pdfFilterMonth === "All") return true;
    return (
      dayjs(r.start_date).month() === allMonths.indexOf(pdfFilterMonth)
    );
  });

  const salesData = allMonths.map((m) => ({
    month: m.substring(0, 3),
    sales: 0,
  }));

  const salesByMonth: Record<
    string,
    { id: string; roomType: string; price: number }[]
  > = {};

  filtered.forEach((r) => {
    if (VALID_SALES_STATUSES.includes(r.status)) {
      const monthIdx = dayjs(r.start_date).month();
      const monthName = allMonths[monthIdx];

      salesData[monthIdx].sales += r.total_price;

      if (!salesByMonth[monthName]) salesByMonth[monthName] = [];
      salesByMonth[monthName].push({
        id: r._id,
        roomType: r.room_id_populated?.room_type || "N/A",
        price: r.total_price,
      });
    }
  });

  let finalSalesData = salesData;
  if (pdfFilterMonth !== "All") {
    const idx = allMonths.indexOf(pdfFilterMonth);
    finalSalesData = idx !== -1 ? [salesData[idx]] : [];
  }

  const roomCounts: Record<string, number> = {};
  filtered.forEach((r) => {
    const type = r.room_id_populated?.room_type;
    if (type) roomCounts[type] = (roomCounts[type] || 0) + 1;
  });

  const roomData = Object.entries(roomCounts).map(([name, value]) => ({
    name,
    value,
  }));

  return {
    salesData: finalSalesData,
    roomData,
    salesByMonth, // ✅ RESTORED
  };
}, [filteredReservations, pdfFilterMonth]);




  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const renderContent = () => {
    if (loading) return <LoadingComponent />;
    if (error)
      return <ErrorComponent message={error} onRetry={fetchReservations} />;
    if (reservations.length === 0) return <EmptyComponent />;

    return (
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">
            Monthly Sales (Confirmed/Completed)
          </h2>
          <p className="text-sm -mt-3 text-base-content/70">
            This chart shows total sales from confirmed and completed
            reservations.
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
            This chart shows the breakdown of reservations based on status:
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
                  `${name} bookings`,
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
    <main className="grid grid-cols-[0.2fr_1fr] h-dvh bg-base-100">
      <Sidebar />
      <div className="flex flex-col gap-6 p-12 overflow-y-auto">
        <div className="flex flex-row items-center justify-between">
          <h1 className="lg:text-4xl font-bold">Reports</h1>

          <div className="join">
            <button
              className="btn btn-primary join-item"
              onClick={() => handleExportPDF("All")}
              disabled={loading || !!error || isGeneratingPdf}
            >
              {isGeneratingPdf && pdfFilterMonth === "All" ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <Download size={18} />
              )}
              Export PDF
            </button>
            <div className="dropdown dropdown-end join-item">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-primary join-item"
              >
                <ChevronDown size={18} />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 max-h-96 overflow-y-auto"
              >
                <li key="all">
                  <a onClick={() => handleExportPDF("All")}>All Months</a>
                </li>
                {allMonths.map((month) => (
                  <li key={month}>
                    <a onClick={() => handleExportPDF(month)}>{month}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-row gap-4 items-center">
          <label className="flex items-center gap-4">
            <ListFilter size={36} className="opacity-70" />
            <span className="font-medium text-nowrap">Filters</span>
            <select
              className="select select-bordered select-sm"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              disabled={loading}
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
            <select
              className="select select-bordered select-sm"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              disabled={loading}
            >
              <option value="All">All Month</option>
              {allMonths.map((month) => (
                <option value={month}>{month}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-4 p-6 rounded-xl bg-base-200 shadow-sm">
          {renderContent()}
        </div>
      </div>

      <PDFReportLayout
        ref={targetRef}
        monthlySalesData={pdfData.salesData}
        roomTypeData={pdfData.roomData}
        detailedSalesData={pdfData.salesByMonth}
        filterMonth={pdfFilterMonth}
        colors={COLORS}
      />
    </main>
  );
}
