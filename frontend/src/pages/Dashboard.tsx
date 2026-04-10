import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Dashboard() {
  const stats = [
    { title: "Total Jobs", value: 12, icon: "💼" },
    { title: "Candidates", value: 45, icon: "👨‍💻" },
    { title: "Applications", value: 120, icon: "📄" },
  ];

  // Chart data
  const data = [
    { name: "Jan", applications: 30 },
    { name: "Feb", applications: 50 },
    { name: "Mar", applications: 40 },
    { name: "Apr", applications: 70 },
    { name: "May", applications: 90 },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-6">
        <h2 className="text-2xl font-bold mb-8">Job Portal</h2>
        <ul className="space-y-4">
          <li className="cursor-pointer hover:text-gray-300">Dashboard</li>
          <li className="cursor-pointer hover:text-gray-300">Jobs</li>
          <li className="cursor-pointer hover:text-gray-300">Candidates</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-100 p-6">
        <h1 className="text-3xl font-bold mb-8">
          Admin Analytics Dashboard
        </h1>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {stats.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition"
            >
              <div className="flex justify-between">
                <h2 className="text-gray-600">{item.title}</h2>
                <span>{item.icon}</span>
              </div>
              <p className="text-3xl font-bold mt-4">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            Applications Overview
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="applications" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;