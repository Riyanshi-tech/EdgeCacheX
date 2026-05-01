import { useEffect, useState } from "react";
import api from "../services/api";
import Card from "../components/card";

type Analytics = {
  totalRequests: number;
  success: number;
  errors: number;
};

export default function Dashboard() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    api.get("/analytics").then((res) => {
      setData(res.data);
    });
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center items-center h-screen text-xl">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">EdgeCacheX Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          title="Total Requests"
          value={data.totalRequests}
          color="bg-blue-500"
        />

        <Card
          title="Success Requests"
          value={data.success}
          color="bg-green-500"
        />

        <Card
          title="Error Requests"
          value={data.errors}
          color="bg-red-500"
        />
      </div>
    </div>
  );
}