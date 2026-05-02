import { useState } from "react";
type Log = {
  id: string;
  path: string;
  method: string;
  status: number;
  timestamp: string;
};
export default function LogsTable({ logs }: { logs: Log[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.path
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "success" && log.status < 400) ||
      (filter === "error" && log.status >= 400);
    return matchesSearch && matchesFilter;
  });
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6 overflow-x-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Recent Logs</h2>
          <p className="text-sm text-gray-500 mt-1">
            Showing {filteredLogs.length} of {logs.length} logs
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by path..."
            className="border border-gray-200 p-2.5 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full md:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-gray-200 p-2.5 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="success">Success Only</option>
            <option value="error">Errors Only</option>
          </select>
        </div>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-gray-50">
            <th className="px-4 py-3">Path</th>
            <th className="px-4 py-3">Method</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {filteredLogs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-4 text-sm font-medium text-gray-700 font-mono">{log.path}</td>
              <td className="px-4 py-4">
                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                  log.method === 'GET' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                }`}>
                  {log.method}
                </span>
              </td>
              <td className="px-4 py-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  log.status < 400 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                }`}>
                  {log.status}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-gray-500">
                {new Date(log.timestamp).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {filteredLogs.length === 0 && (
        <div className="py-12 text-center text-gray-400 italic">
          No logs found matching your criteria.
        </div>
      )}
    </div>
  );
}