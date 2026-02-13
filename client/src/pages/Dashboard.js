import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  FileText,
  Map,
  BarChart3,
  Upload,
  TrendingUp
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {

const [stats, setStats] = useState({
  totalDocuments: 0,
  totalMappings: 0,
  alignmentScore: 0
});

const [recentDocuments, setRecentDocuments] = useState([]);
const [alignmentChart, setAlignmentChart] = useState([]);

const ALIGNMENT_COLORS = {
  "Fully Aligned": "#22c55e",
  "Partially Aligned": "#f59e0b",
  "Not Aligned": "#ef4444"
};

useEffect(() => {
  const fetchDashboard = async () => {
    try {
      const documents = (await axios.get('/api/documents')).data;
      const mappingsStats = (await axios.get('/api/mappings/statistics')).data;

      const totalMappings = mappingsStats.reduce((s, m) => s + m.total_mappings, 0);
      const fullyAligned = mappingsStats.reduce((s, m) => s + m.fully_aligned, 0);
      const partiallyAligned = mappingsStats.reduce((s, m) => s + m.partially_aligned, 0);
      const notAligned = totalMappings - (fullyAligned + partiallyAligned);

      const alignmentScore = totalMappings > 0
        ? ((fullyAligned + (partiallyAligned * 0.5)) / totalMappings * 100).toFixed(1)
        : 0;

      setStats({
        totalDocuments: documents.length,
        totalMappings,
        alignmentScore: parseFloat(alignmentScore)
      });

      setRecentDocuments(documents.slice(0, 5));

      setAlignmentChart([
        { name: "Fully Aligned", value: fullyAligned },
        { name: "Partially Aligned", value: partiallyAligned },
        { name: "Not Aligned", value: notAligned }
      ]);

    } catch (err) {
      console.error(err);
    }
  };

  fetchDashboard();
}, []);

return (
<div className="space-y-8">

  {/* Top Banner */}
  <div className="bg-white border border-gray-200 rounded-xl p-6 flex justify-between items-center shadow-sm">
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Security Posture Overview</h1>
      <p className="text-gray-500">Cybersecurity policy alignment intelligence</p>
    </div>
    <Link
      to="/documents"
      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
    >
      <Upload className="w-4 h-4" />
      <span>Upload Policy</span>
    </Link>
  </div>

  {/* Metrics */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Metric icon={FileText} label="Documents" value={stats.totalDocuments} color="text-blue-600"/>
    <Metric icon={Map} label="Mappings" value={stats.totalMappings} color="text-green-600"/>
    <Metric icon={TrendingUp} label="Alignment Score" value={`${stats.alignmentScore}%`} color="text-red-500"/>
  </div>

  {/* Chart + Docs */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

    {/* Security Alignment Chart */}
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-gray-700 font-semibold mb-4">Security Alignment Analysis</h3>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={alignmentChart}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={95}
              paddingAngle={3}
            >
              {alignmentChart.map((entry, index) => (
                <Cell key={index} fill={ALIGNMENT_COLORS[entry.name]} />
              ))}
            </Pie>

            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
              className="fill-gray-700 text-xl font-bold">
              {stats.alignmentScore}%
              <tspan x="50%" dy="22" className="text-sm fill-gray-500">Overall Alignment</tspan>
            </text>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm">
        <LegendItem color="bg-green-500" text="Fully Aligned — Controls fully compliant" />
        <LegendItem color="bg-yellow-500" text="Partially Aligned — Needs improvement" />
        <LegendItem color="bg-red-500" text="Not Aligned — Security gaps exist" />
      </div>
    </div>

    {/* Recent Docs */}
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-gray-700 font-semibold mb-4">Recent Documents</h3>
      {recentDocuments.map(doc => (
        <div key={doc.id} className="flex justify-between items-center border-b border-gray-200 py-3">
          <div>
            <p className="text-gray-800 font-medium">{doc.original_name}</p>
            <p className="text-sm text-gray-500">{doc.relevant_agency || 'No agency'}</p>
          </div>
          <button
            onClick={() => window.open(`http://localhost:5000/api/documents/file/${doc.id}`)}
            className="text-blue-600 hover:text-blue-700 text-sm">View</button>
        </div>
      ))}
    </div>

  </div>

  {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-gray-700 font-semibold mb-4">Security Operations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Action icon={Upload} label="Upload Policies" link="/documents" />
          <Action icon={Map} label="Map Controls" link="/mapping" />
          <Action icon={BarChart3} label="Analyze Gaps" link="/analysis" />
        </div>
      </div>



</div>
);
};

const Metric = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center space-x-4">
    <Icon className={`w-8 h-8 ${color}`} />
    <div>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const LegendItem = ({ color, text }) => (
  <div className="flex items-center gap-2">
    <span className={`w-4 h-4 rounded ${color}`}></span>
    <span>{text}</span>
  </div>
);
const Action = ({ icon: Icon, label, link }) => (
  <Link
    to={link}
    className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 p-4 rounded-lg transition"
  >
    <Icon className="w-6 h-6 text-blue-600" />
    <span className="text-gray-700 font-medium">{label}</span>
  </Link>
);

export default Dashboard;
