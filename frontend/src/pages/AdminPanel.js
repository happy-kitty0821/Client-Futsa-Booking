import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Swal from "sweetalert2"; // ✅ SweetAlert2

const fetchData = (url) =>
  axios
    .get(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    .then((res) => res.data);

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#9c27b0", "#ff4444", "#26c6da", "#66bb6a", "#ffa726"];

const AdminPanel = () => {
  const [tab, setTab] = useState("users");
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [image, setImage] = useState(null);
  const queryClient = useQueryClient();

  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    'Content-Type': 'multipart/form-data'
  };

  const { data: users = [] } = useQuery("users", () => fetchData("http://localhost:5000/api/users"));
  const { data: courts = [] } = useQuery("courts", () => fetchData("http://localhost:5000/api/courts"));
  const { data: bookings = [] } = useQuery("bookings", () => fetchData("http://localhost:5000/api/bookings/admin"));
  const { data: tournaments = [] } = useQuery("tournaments", () => fetchData("http://localhost:5000/api/tournaments"));
  const { data: activityReport = [] } = useQuery("activityReport", () => fetchData("http://localhost:5000/api/reports/user-activity"));
  const { data: courtReport = [] } = useQuery("courtReport", () => fetchData("http://localhost:5000/api/reports/court-utilization"));

  const deleteItem = async (id) => {
    const endpoints = {
      users: `http://localhost:5000/api/users/${id}`,
      courts: `http://localhost:5000/api/courts/${id}`,
      bookings: `http://localhost:5000/api/bookings/${id}`,
      tournaments: `http://localhost:5000/api/tournaments/${id}`,
    };

    if (endpoints[tab]) {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "This action cannot be undone!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        confirmButtonColor: "#e11d48",
      });

      if (result.isConfirmed) {
        await axios.delete(endpoints[tab], { headers });
        queryClient.invalidateQueries(tab);
        Swal.fire("Deleted!", "Record has been removed.", "success");
      }
    }
  };

  const mutation = useMutation(
    ({ url, method, payload }) => {
      if (tab === "courts" && image) {
        const formData = new FormData();
        Object.keys(payload).forEach(key => {
          formData.append(key, payload[key]);
        });
        formData.append('image', image);
        return axios[method](url, formData, { headers });
      }
      return axios[method](url, payload, { headers });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(tab);
        setEditItem(null);
        setForm({});
        setImage(null);
        Swal.fire("Success", "Saved successfully", "success");
      },
    }
  );

  const handleCreate = (e) => {
    e.preventDefault();
    const urlMap = {
      users: "http://localhost:5000/api/auth/register",
      courts: "http://localhost:5000/api/courts",
      bookings: "http://localhost:5000/api/bookings",
      tournaments: "http://localhost:5000/api/tournaments",
    };
    mutation.mutate({ url: urlMap[tab], method: "post", payload: form });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const renderCreateForm = () => {
    const handleChange = (e) => {
      const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
      setForm({ ...form, [e.target.name]: value });
    };
    const inputClass = "w-full p-2 border rounded mb-2";

    return (
      <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-6 mb-8 max-w-2xl mx-auto">
        <h3 className="text-xl font-semibold mb-4 text-indigo-700">Create New {tab.charAt(0).toUpperCase() + tab.slice(1)}</h3>
        {tab === "users" && (
          <>
            <input name="name" placeholder="Name" onChange={handleChange} className={inputClass} required />
            <input name="email" type="email" placeholder="Email" onChange={handleChange} className={inputClass} required />
            <input name="phone" placeholder="Phone" onChange={handleChange} className={inputClass} required />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} className={inputClass} required />
          </>
        )}
        {tab === "courts" && (
          <>
            <input name="name" placeholder="Court Name" onChange={handleChange} className={inputClass} required />
            <input name="location" placeholder="Location" onChange={handleChange} className={inputClass} required />
            <input
              name="price_per_hour"
              type="number"
              step="0.01"
              min="0"
              placeholder="Regular Price Per Hour"
              onChange={handleChange}
              className={inputClass}
              required
            />
            <input
              name="peak_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="Peak Hour Price"
              onChange={handleChange}
              className={inputClass}
              required
            />
            <input
              name="off_peak_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="Off-Peak Hour Price"
              onChange={handleChange}
              className={inputClass}
              required
            />
            <input
              name="available_slots"
              type="number"
              min="0"
              placeholder="Available Slots"
              onChange={handleChange}
              className={inputClass}
              required
            />
            <input name="contact_number" placeholder="Contact Number" onChange={handleChange} className={inputClass} required />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className={inputClass}
              required
            />
            {image && (
              <div className="mt-2">
                <img src={URL.createObjectURL(image)} alt="Preview" className="max-w-xs rounded-lg shadow-md" />
              </div>
            )}
          </>
        )}
        {tab === "bookings" && (
          <>
            <input name="court_id" placeholder="Court ID" onChange={handleChange} className={inputClass} required />
            <input name="date" type="date" placeholder="Date" onChange={handleChange} className={inputClass} required />
            <input name="start_time" type="time" placeholder="Start Time" onChange={handleChange} className={inputClass} required />
            <input name="end_time" type="time" placeholder="End Time" onChange={handleChange} className={inputClass} required />
          </>
        )}
        {tab === "tournaments" && (
          <>
            <input name="name" placeholder="Tournament Name" onChange={handleChange} className={inputClass} required />
            <input name="start_date" type="date" onChange={handleChange} className={inputClass} required />
            <input name="end_date" type="date" onChange={handleChange} className={inputClass} required />
            <select name="court_id" onChange={handleChange} className={inputClass} required defaultValue="">
                <option value="" disabled> 
                  Select Court </option>
                  {courts.map((court) => (   <option key={court.id} value={court.id}>{court.name}
              </option>))}
    </select>
    <input
      name="max_teams"
      type="number"
      min="1"
      placeholder="Max Teams"
      onChange={handleChange}
      className={inputClass}
      required
    />
          </>
        )}
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded mt-2">
          Create
        </button>
      </form>
    );
  };

  const renderTable = (items) => (
    <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
      <table className="w-full text-sm border">
        <thead className="bg-indigo-100 text-indigo-800">
          <tr>
            {Object.keys(items[0] || {}).filter(key => !['image_url', 'created_at'].includes(key)).map((key) => (
              <th key={key} className="px-4 py-2 text-left capitalize">
                {key.replace(/_/g, ' ')}
              </th>
            ))}
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t hover:bg-gray-50">
              {Object.keys(item).filter(key => !['image_url', 'created_at'].includes(key)).map((key) => (
                <td key={key} className="px-4 py-2">
                  {key.includes('price') ? (
                    `$${parseFloat(item[key]).toFixed(2)}`
                  ) : (
                    item[key]
                  )}
                </td>
              ))}
              <td className="px-4 py-2 space-x-2">
                <button onClick={() => setEditItem(item)} className="bg-yellow-400 text-white px-3 py-1 rounded">
                  Edit
                </button>
                <button onClick={() => deleteItem(item.id)} className="bg-red-600 text-white px-3 py-1 rounded">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderModal = () => {
    if (!editItem) return null;
    const handleChange = (e) => setEditItem({ ...editItem, [e.target.name]: e.target.value });
    const handleSave = () => {
      const formData = new FormData();
      Object.keys(editItem).forEach(key => {
        if (key !== 'image_url' || (key === 'image_url' && editItem[key] instanceof File)) {
          formData.append(key, editItem[key]);
        }
      });
      if (image) {
        formData.append('image', image);
      }

      const urlMap = {
        users: `http://localhost:5000/api/users/${editItem.id}`,
        courts: `http://localhost:5000/api/courts/${editItem.id}`,
        bookings: `http://localhost:5000/api/bookings/${editItem.id}`,
        tournaments: `http://localhost:5000/api/tournaments/${editItem.id}`,
      };

      mutation.mutate({
        url: urlMap[tab],
        method: "put",
        payload: tab === 'courts' ? formData : editItem
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Edit {tab}</h2>
          {Object.keys(editItem).map((key) => (
            <div key={key} className="mb-3">
              <label className="block mb-1 text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</label>
              {key === 'image_url' ? (
                <div>
                  {editItem[key] && (
                    <img
                      src={`http://localhost:5000/api${editItem[key]}`}
                      alt="Court"
                      className="w-32 h-32 object-cover rounded mb-2"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/600x400';
                      }}
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              ) : key.includes('price') ? (
                <input
                  name={key}
                  type="number"
                  step="0.01"
                  value={editItem[key] || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              ) : (
                <input
                  name={key}
                  value={editItem[key] || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  type={key.includes('password') ? 'password' : 'text'}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditItem(null)} className="px-4 py-2 bg-gray-200 rounded">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded">
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  const exportAsExcel = () => {
    const sheet = XLSX.utils.json_to_sheet(tab === "activity" ? activityReport : courtReport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Report");
    XLSX.writeFile(wb, `${tab}_report.xlsx`);
  };

  const exportAsPDF = () => {
    const doc = new jsPDF();
    doc.text(`${tab === "activity" ? "User Activity Report" : "Court Utilization Report"}`, 14, 10);
    doc.autoTable({ html: "#report-table" });
    doc.save(`${tab}_report.pdf`);
  };

  const renderReportChart = (data, labelKey, valueKey) => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey={valueKey} nameKey={labelKey} cx="50%" cy="50%" outerRadius={100} label>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  const currentData = { users, courts, bookings, tournaments }[tab];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-10 text-indigo-800">Futsal Admin Dashboard</h1>

      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {["users", "courts", "bookings", "tournaments", "activity", "utilization"].map((key) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              setEditItem(null);
            }}
            className={`px-5 py-2 rounded-full text-sm font-semibold shadow-md ${tab === key ? "bg-indigo-600 text-white" : "bg-white text-indigo-600 border border-indigo-600"}`}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {tab === "activity" && (
        <div className="bg-white p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-semibold text-indigo-700 mb-4">User Activity (Peak Booking Times)</h2>
          {renderReportChart(activityReport, "index", "count")}
          <div className="flex justify-end gap-4 mt-6">
            <button onClick={exportAsExcel} className="bg-green-600 text-white px-4 py-2 rounded">
              Export as Excel
            </button>
          </div>
        </div>
      )}

      {tab === "utilization" && (
        <div className="bg-white p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-semibold text-indigo-700 mb-4">Court Utilization Report</h2>
          {renderReportChart(courtReport, "court", "count")}
          <div className="flex justify-end gap-4 mt-6">
            <button onClick={exportAsExcel} className="bg-green-600 text-white px-4 py-2 rounded">
              Export as Excel
            </button>
          </div>
        </div>
      )}

      {currentData && tab !== "activity" && tab !== "utilization" && renderCreateForm()}
      {currentData && tab !== "activity" && tab !== "utilization" && renderTable(currentData)}
      {renderModal()}
    </div>
  );
};

export default AdminPanel;
