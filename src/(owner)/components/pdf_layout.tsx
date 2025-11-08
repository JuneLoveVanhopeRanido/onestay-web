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
      className="absolute -left-full top-full w-[210mm] min-h-[297mm] p-12 bg-white text-black"
      style={{ fontFamily: "sans-serif" }}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold">OneStay Reports</h1>
          <p className="text-lg text-gray-600 mt-1">
            Generated: {dayjs().format("MMMM DD, YYYY - hh:mm A")}
          </p>
          <p className="text-lg text-gray-600 mt-1">
            {useAuthStore.getState().user?.name}
          </p>
        </div>
        <div className="w-full h-px bg-gray-300" />
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">
            Total Sales (Confirmed/Completed)
          </h2>
          <p className="text-sm -mt-3 text-gray-500">
            Full-year sales data from confirmed and completed reservations.
          </p>
          <BarChart
            width={650}
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
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-sm text-gray-500">
            Breakdown of sales from confirmed/completed reservations:
          </p>
          <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
            {Object.entries(detailedSalesData).length > 0 ? (
              Object.entries(detailedSalesData).map(([month, sales]) => (
                <div key={month} className="mb-4 last:mb-0">
                  <h3 className="text-xl font-semibold border-b border-gray-200 pb-1 mb-2">
                    {month}
                  </h3>
                  <div className="flex flex-col gap-1 text-sm">
                    {sales.map((sale) => (
                      <div key={sale.id} className="flex justify-between">
                        <span className="text-gray-700">
                          - {sale.roomType} (ID: ...{sale.id.slice(-6)})
                        </span>
                        <span className="font-medium">
                          ₱{sale.price.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">
                No sales data found for this period.
              </p>
            )}
          </div>
        </div>
        <div className="w-full h-px bg-gray-300" />
        <div style={{ breakBefore: "page" }}>
          <div className="flex flex-col gap-4" style={{ breakInside: "avoid" }}>
            <h2 className="text-2xl font-bold">Most Booked Rooms</h2>
            <p className="text-sm -mt-3 text-gray-500">
              Breakdown of reservations based on the status:{" "}
              <span className="font-bold">{filter}</span>
            </p>
            <PieChart width={650} height={300}>
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
                {roomTypeData.map((entry, index) => (
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
              <Legend />
            </PieChart>
          </div>
        </div>
      </div>
    </div>
  )
);
