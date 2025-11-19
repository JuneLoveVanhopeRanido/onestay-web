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
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import React from "react";
import { useAuthStore } from "../../(auth)/store/Auth";

export const PDFReportLayout = React.forwardRef<
  HTMLDivElement,
  {
    monthlySalesData: any[];
    roomTypeData: any[];
    detailedSalesData: {
      [month: string]: { roomType: string; price: number; id: string }[];
    };
    filter: string;
    colors: string[];
  }
>(
  (
    { monthlySalesData, roomTypeData, detailedSalesData, filter, colors },
    ref
  ) => (
    <div
      ref={ref}
      className="absolute -left-full -top-full bg-white text-black"
      style={{
        width: "210mm",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "297mm",
          padding: "40px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="flex flex-col items-center pb-4">
          <h1 className="text-4xl font-bold">OneStay Report</h1>
          <p className="text-lg text-gray-600 mt-2">
            Generated: {dayjs().format("MMMM DD, YYYY - hh:mm A")}
          </p>
          <p className="text-lg text-gray-600">
            By: {useAuthStore.getState().user?.name || "Admin"}
          </p>
        </div>

        <div className="w-full h-px bg-gray-300 my-4" />

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Total Sales</h2>
          <p className="text-sm -mt-3 text-gray-500">
            Full-year sales from confirmed and completed reservations.
          </p>
          <BarChart
            width={700}
            height={300}
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

      <div
        style={{
          width: "100%",
          height: "297mm",
          padding: "40px",
          boxSizing: "border-box",
          pageBreakBefore: "always",
        }}
      >
        <div className="pb-4 border-b border-gray-200 mb-6">
          <p className="text-gray-400 text-sm">OneStay Report - Page 2</p>
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold">Most Booked Room Types</h2>
          <p className="text-sm -mt-4 text-gray-500">
            Breakdown of reservations based on the status:{" "}
            <span className="font-bold">{filter}</span>
          </p>

          <div className="flex justify-center items-center mt-8">
            [Image of a Pie Chart showing Room Types]
            <PieChart width={700} height={400}>
              <Pie
                data={roomTypeData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={(entry) => `${entry.name} (${entry.value})`}
                outerRadius={140}
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
              <Tooltip
                formatter={(value: number, name: string) => [
                  value,
                  `${name} reservations`,
                ]}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </div>
        </div>
      </div>
    </div>
  )
);
