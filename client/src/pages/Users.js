import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, UserCog, ShieldCheck } from "lucide-react";

const Users = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await axios.get("http://localhost:5000/api/auth/users", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    setUsers(res.data);
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    await axios.delete(`http://localhost:5000/api/auth/users/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    fetchUsers();
  };

  const changeRole = async (id, role) => {
    await axios.put(
      `http://localhost:5000/api/auth/users/${id}/role`,
      { role },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    fetchUsers();
  };
const [showModal, setShowModal] = useState(false);
const [form, setForm] = useState({
  username: '',
  email: '',
  password: '',
  role: 'analyst'
});
const createUser = async () => {
  try {
    await axios.post("http://localhost:5000/api/auth/register", form, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    setShowModal(false);
    setForm({ username: '', email: '', password: '', role: 'analyst' });
    fetchUsers(); // refresh table
  } catch (err) {
    alert(err.response?.data?.error || "Error creating user");
  }
};

  const toggleStatus = async (id, current) => {
    await axios.put(
      `http://localhost:5000/api/auth/users/${id}/status`,
      { is_active: current ? 0 : 1 },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    fetchUsers();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
    
      <div className="overflow-x-auto">

<div className="flex justify-between items-center mb-4">
  <h2 className="text-xl font-bold text-gray-800">User Management</h2>

  <button
    onClick={() => setShowModal(true)}
    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
  >
    + Add User
  </button>
</div>


        <table className="w-full text-sm border-separate border-spacing-y-2">
        <thead>
  <tr className="text-gray-500 text-xs uppercase tracking-wider text-center">
    <th className="py-3 px-4 text-left">User</th>
    <th className="py-3">Email</th>
    <th className="py-3">Role</th>
    <th className="py-3">Status</th>
    <th className="py-3">Created</th>
    <th className="py-3">Actions</th>
  </tr>
</thead>


        <tbody>
  {users.map((u) => (
    <tr key={u.id} className="bg-gray-50 hover:bg-gray-100 transition">
      <td className="py-3 px-4 text-left font-semibold text-gray-800">
        {u.username}
      </td>

      <td className="text-center text-gray-600">{u.email}</td>

      <td className="text-center">
        <select
          value={u.role}
          onChange={(e) => changeRole(u.id, e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1 bg-white"
        >
          <option value="admin">Admin</option>
         
        </select>
      </td>

      <td className="text-center">
        <span
          onClick={() => toggleStatus(u.id, u.is_active)}
          className={`px-3 py-1 text-xs rounded-full cursor-pointer font-medium ${
            u.is_active
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {u.is_active ? "Active" : "Disabled"}
        </span>
      </td>

      <td className="text-center text-gray-500 text-xs">
        {new Date(u.created_at).toLocaleDateString()}
      </td>

      <td className="text-center">
        <div className="flex justify-center space-x-3">
          <button
            onClick={() => deleteUser(u.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 size={18} />
          </button>
          <ShieldCheck className="text-blue-500" size={18} />
          <UserCog className="text-gray-500" size={18} />
        </div>
      </td>
    </tr>
  ))}
</tbody>

        </table>
      </div>
      {showModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl">

      <h3 className="text-lg font-bold mb-4">Create New User</h3>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
          className="w-full border rounded-lg px-3 py-2"
        />

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          className="w-full border rounded-lg px-3 py-2"
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          className="w-full border rounded-lg px-3 py-2"
        />

        <select
          value={form.role}
          onChange={e => setForm({ ...form, role: e.target.value })}
          className="w-full border rounded-lg px-3 py-2"
        >
        
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 bg-gray-200 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={createUser}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Create
        </button>
      </div>

    </div>
  </div>
)}

    </div>
  );
};

export default Users;
