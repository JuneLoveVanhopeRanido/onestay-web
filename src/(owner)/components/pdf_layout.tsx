/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from "dayjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import React from "react";
import { useAuthStore } from "../../(auth)/store/Auth";

export const PDFReportLayout = React.forwardRef<
  HTMLDivElement,
  {
    monthlySalesData: any[];
    detailedSalesData: {
      [month: string]: { roomType: string; price: number; id: string }[];
    };
    roomTypeData: any[];
    filterMonth: string;
    colors: string[];
  }
>(
  (
    { monthlySalesData, detailedSalesData, roomTypeData, filterMonth, colors },
    ref
  ) => (
    <div
      ref={ref}
      className="absolute -left-full -top-full bg-white text-black"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "40px",
        fontFamily: "sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div className="flex flex-col gap-6 h-full">
        <div className="flex flex-col items-center pb-2">
          <h1 className="text-4xl font-bold text-gray-900">OneStay Reports</h1>
          <p className="text-lg text-gray-600 mt-2">
            Generated: {dayjs().format("MMMM DD, YYYY - hh:mm A")}
          </p>
          <p className="text-base text-gray-500">
            Owner: {useAuthStore.getState().user?.name || "Admin"}
          </p>
          <div className="badge badge-neutral mt-2">
            Report Period: {filterMonth === "All" ? "Full Year" : filterMonth}
          </div>
        </div>

        <div className="w-full h-px bg-gray-300 my-2" />

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Total Sales</h2>
          <p className="text-sm -mt-3 text-gray-500 italic">
            Sales data from confirmed and completed reservations.
          </p>

          <div className="flex justify-center border border-gray-100 rounded-lg p-4">
            <BarChart
              width={650}
              height={350}
              data={monthlySalesData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "#666" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#666" }}
                axisLine={false}
                tickLine={false}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Bar
                dataKey="sales"
                fill="#1F2937"
                name="Sales (PHP)"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </div>
          <div className="flex flex-col gap-2 mt-6 flex-1 overflow-hidden">
            <p className="text-sm text-gray-500 mb-1">
              Sales Breakdown (Confirmed/Completed):
            </p>
            <div className="border border-gray-200 rounded-lg p-4 h-full">
              {Object.entries(detailedSalesData).length > 0 ? (
                <div className="flex flex-col gap-4">
                  {Object.entries(detailedSalesData).map(([month, sales]) => (
                    <div key={month}>
                      <h3 className="font-bold text-gray-800 border-b border-gray-100 mb-1">
                        {month}
                      </h3>
                      {sales.map((sale) => (
                        <div
                          key={sale.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600 truncate w-2/3">
                            - {sale.roomType}{" "}
                            <span className="text-xs text-gray-400">
                              ({sale.id.slice(-6)})
                            </span>
                          </span>
                          <span>₱{sale.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic text-center mt-10">
                  No sales data available.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-gray-300 my-8" />

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Most Booked Rooms
          </h2>
          <p className="text-sm -mt-3 text-gray-500 italic">
            Breakdown by room type for the selected period.
          </p>

          <div className="flex justify-center border border-gray-100 rounded-lg p-4">
            <PieChart width={650} height={350}>
              <Pie
                data={roomTypeData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={(entry) => `${entry.name} (${entry.value})`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {roomTypeData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Legend layout="vertical" verticalAlign="middle" align="right" />
            </PieChart>
          </div>
        </div>
      </div>
    </div>
  )
);
