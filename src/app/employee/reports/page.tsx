"use client";

import React from "react";

export default function EmployeeReportsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Employee Reports</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Performance Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="text-sm font-medium text-gray-500">Completed Errands</h3>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="text-sm font-medium text-gray-500">Average Rating</h3>
            <p className="text-2xl font-bold">N/A</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="text-sm font-medium text-gray-500">Response Time</h3>
            <p className="text-2xl font-bold">N/A</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="text-gray-500">
          <p>No recent activities to display.</p>
        </div>
      </div>
    </div>
  );
}