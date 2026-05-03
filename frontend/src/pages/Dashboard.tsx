import { useEffect, useState } from "react";
import api from "../services/api";
import Card from "../components/card";
import RequestsChart from "../components/RequestsChart";
import LogsTable from "../components/LogsTable";

type Analytics = {
  totalRequests: number;
  success: number;
  errors: number;
};

export default function Dashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, timelineRes, logsRes] = await Promise.all([
          api.get("/analytics"),
          api.get("/analytics/timeline"),
          api.get("/analytics/logs"),
        ]);

        setData(analyticsRes.data);
        setTimeline(timelineRes.data);
        setLogs(logsRes.data);
        setError(null); // clear error if success
      } catch (err:unknown) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to fetch dashboard data. Please try again.");
      }
    };

    // initial load
    fetchData();

    // auto refresh every 5 sec
    const interval = setInterval(fetchData, 5000);

    // cleanup
    return () => clearInterval(interval);
  }, []);

  // Error UI
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500 text-xl font-semibold">
        {error}
      </div>
    );
  }

  // Loading UI
  if (!data) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 tracking-tight">
          EdgeCacheX Dashboard
        </h1>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card
            title="Total Requests"
            value={data.totalRequests}
            color="bg-gradient-to-br from-blue-500 to-pink-600"
          />

          <Card
            title="Success Requests"
            value={data.success}
            color="bg-gradient-to-br from-blue-500 to-green-600"
          />

          <Card
            title="Error Requests"
            value={data.errors}
            color="bg-gradient-to-br from-blue-500 to-red-600"
          />
        </div>

        {/* Charts + Logs */}
        <div className="space-y-10">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <RequestsChart data={timeline} />
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <LogsTable logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
}