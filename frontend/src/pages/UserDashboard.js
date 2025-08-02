import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Activity, Pencil, Trash, PlusCircle, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import UserPayment from "../components/UserPayment";

// Custom Button component with improved styling
const Button = ({ children, variant = "primary", onClick, className = "", disabled = false }) => {
  const baseClasses =
    "inline-flex justify-center items-center gap-2 rounded-lg font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 px-5 py-3 shadow-md",
    secondary:
      "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-300 px-5 py-3",
    danger:
      "bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-300 px-5 py-3",
    outline:
      "border border-gray-300 text-gray-700 hover:text-indigo-600 hover:border-indigo-500 focus:ring-indigo-500 px-5 py-3",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }) => <div className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 ${className}`}>{children}</div>;

const Badge = ({ status }) => {
  const statusMap = {
    confirmed: {
      icon: <CheckCircle className="h-4 w-4 mr-1" />,
      label: "Confirmed",
      className: "bg-green-50 text-green-700 border border-green-200",
    },
    pending: {
      icon: <Clock className="h-4 w-4 mr-1" />,
      label: "Pending",
      className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    },
    cancelled: {
      icon: <XCircle className="h-4 w-4 mr-1" />,
      label: "Cancelled",
      className: "bg-red-50 text-red-700 border border-red-200",
    },
  };

  const { icon, label, className } = statusMap[status] || statusMap.pending;

  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${className}`}>
      {icon}
      {label}
    </span>
  );
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editBooking, setEditBooking] = useState(null);
  const [activeTab, setActiveTab] = useState("bookings");
  const [paymentBooking, setPaymentBooking] = useState(null);

  const { data: bookings = [], isLoading } = useQuery("userBookings", fetchUserBookings);

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  const mutation = useMutation(({ url, method, payload }) => axios[method](url, payload, { headers }), {
    onSuccess: () => {
      queryClient.invalidateQueries("userBookings");
      setEditBooking(null);
      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Your booking has been updated successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
    },
  });

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You are about to cancel this booking.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, cancel it!",
    });

    if (result.isConfirmed) {
      await axios.delete(`http://localhost:5000/api/bookings/${id}`, { headers });
      queryClient.invalidateQueries("userBookings");
      Swal.fire("Cancelled!", "Your booking has been cancelled.", "success");
    }
  };

  async function fetchUserBookings() {
    const res = await axios.get("http://localhost:5000/api/bookings", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return res.data;
  }

  const renderModal = () => {
    if (!editBooking) return null;

    const handleChange = (e) => setEditBooking({ ...editBooking, [e.target.name]: e.target.value });

    const handleSave = () => {
      mutation.mutate({
        url: `http://localhost:5000/api/bookings/${editBooking.id}`,
        method: "put",
        payload: editBooking,
      });
    };

    return (
      <AnimatePresence>
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200"
          >
            <div className="bg-indigo-700 px-6 py-5 rounded-t-3xl">
              <h2 className="text-2xl font-semibold text-white tracking-wide">Modify Booking Details</h2>
            </div>
            <div className="p-8 space-y-6">
              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={editBooking.date}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 text-base placeholder-gray-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Start Time */}
              <div>
                <label htmlFor="start_time" className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <input
                    id="start_time"
                    name="start_time"
                    type="time"
                    value={editBooking.start_time}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 text-base placeholder-gray-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* End Time */}
              <div>
                <label htmlFor="end_time" className="block text-sm font-semibold text-gray-700 mb-2">
                  End Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <input
                    id="end_time"
                    name="end_time"
                    type="time"
                    value={editBooking.end_time}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 text-base placeholder-gray-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <svg
                  className="h-4 w-4 mr-2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium text-gray-900">NPR {bookings.amount?.toFixed(2) || '0.00'}</span>
              </div>
              {/* Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  className="px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  onClick={() => setEditBooking(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="px-6 py-3 font-semibold"
                  onClick={handleSave}
                  disabled={mutation.isLoading}
                >
                  {mutation.isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  };

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="bg-indigo-50 inline-flex p-3 rounded-full mb-4">
        <Calendar className="h-6 w-6 text-indigo-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">No bookings found</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">You haven't made any bookings yet. Book a court to get started with your futsal journey!</p>
      <Button onClick={() => navigate("/booking")}>Book a Court</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-indigo-800">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-30"
            src="https://images.unsplash.com/photo-1552879935-4c5d3895ddfd?auto=format&fit=crop&w=1600&q=80"
            alt="Futsal pitch"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-800 mix-blend-multiply" />
        </div>
        <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">Welcome to SkyKick Futsal</h1>
          <p className="mt-3 max-w-md text-lg text-indigo-200 sm:text-xl md:mt-5 md:max-w-3xl">Elevate your game with our premium facilities and seamless booking experience.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`${activeTab === "bookings" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
            >
              My Bookings
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`${activeTab === "profile" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
            >
              Profile
            </button>
          </nav>
        </div>

        {activeTab === "bookings" && (
          <>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Your Bookings</h2>
              <Button onClick={() => navigate("/booking")}>
                <PlusCircle className="h-4 w-4" />
                <span>New Booking</span>
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : bookings.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.map((booking) => (
                  <motion.div key={booking.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <Card>
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-indigo-50 p-2 rounded-lg">
                          <Activity className="h-6 w-6 text-indigo-600" />
                        </div>
                        <Badge status={booking.status} />
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2">Court {booking.court}</h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{booking.date}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            {booking.start_time} - {booking.end_time}
                          </span>
                        </div>
                      </div>

                      {booking.status !== "cancelled" ? (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 flex-col">
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setEditBooking(booking)}>
                              <Pencil className="h-4 w-4" />
                              <span>Edit</span>
                            </Button>

                            <Button variant="danger" className="flex-1" onClick={() => handleDelete(booking.id)}>
                              <Trash className="h-4 w-4" />
                              <span>Cancel</span>
                            </Button>
                          </div>

                          {booking.payment_status !== "paid" ? (
                            <Button
                              variant="primary"
                              className="w-full mt-4"
                              onClick={() => setPaymentBooking(booking)}
                            >
                              Pay Now
                            </Button>
                          ) : (
                            <span className="inline-flex items-center justify-center w-full mt-4 py-3 rounded-lg bg-green-100 text-green-700 font-semibold">
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Already Paid
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-red-500 flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
                          </svg>
                          This booking has been cancelled. Editing is disabled.
                        </div>
                      )}

                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "profile" && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500">Your profile information and account settings would appear here.</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Booking Modal */}
      {renderModal()}

      {/* Payment Modal */}
      {paymentBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl font-bold"
              onClick={() => setPaymentBooking(null)}
              aria-label="Close payment modal"
            >
              &times;
            </button>
            <UserPayment
              amount={paymentBooking.amount}
              bookingId={paymentBooking.id}
              onSuccess={async (method, payload) => {
                try {
                  const jwt = localStorage.getItem("token");
                  console.log("Booking Info:", paymentBooking);
                  await fetch(`http://localhost:5000/api/bookings/${paymentBooking.id}/payment`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${jwt}`,
                    },
                  });

                  Swal.fire({
                    icon: "success",
                    title: "Payment Successful",
                    text: `Your payment via ${method} was successful!`,
                  });

                  queryClient.invalidateQueries("userBookings");
                } catch (error) {
                  console.error("Error updating payment status:", error);
                  Swal.fire({
                    icon: "warning",
                    title: "Payment processed",
                    text: "But we couldn't update the booking status. Please contact support.",
                  });
                } finally {
                  setPaymentBooking(null);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
