import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useQuery, useMutation } from "react-query";
import { fetchBookingsForDate, bookCourt, bookRecurringCourt } from "../api/bookingApi";
import { fetchCourts } from "../api/bookingApi";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Calendar, Clock, Activity, PlusCircle } from "lucide-react";

const socket = io("http://localhost:5000");

const Button = ({ children, variant = "primary", onClick, className = "", disabled = false }) => {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-800",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700",
    outline: "border border-gray-300 hover:border-indigo-500 hover:text-indigo-600",
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }) => <div className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 ${className}`}>{children}</div>;

const Booking = () => {
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState("");
  const [recurring, setRecurring] = useState("none");
  const [availableSlots, setAvailableSlots] = useState([]);

  const { data: courts } = useQuery("courts", fetchCourts);
  const { data: bookings, refetch } = useQuery(["bookings", selectedDate], () => fetchBookingsForDate(selectedDate.toISOString().split("T")[0]), { enabled: !!selectedDate });

  useEffect(() => {
    if (bookings) {
      const allSlots = [
        "08:00 - 09:00",
        "09:00 - 10:00",
        "10:00 - 11:00",
        "11:00 - 12:00",
        "12:00 - 13:00",
        "13:00 - 14:00",
        "14:00 - 15:00",
        "15:00 - 16:00",
        "16:00 - 17:00",
        "17:00 - 18:00",
        "18:00 - 19:00",
      ];
      const bookedSlots = bookings.map((b) => `${b.start_time} - ${b.end_time}`);
      setAvailableSlots(allSlots.filter((slot) => !bookedSlots.includes(slot)));
    }
  }, [bookings]);

  useEffect(() => {
    socket.on("update-availability", () => {
      refetch();
    });
  }, [refetch]);

  const mutation = useMutation(bookCourt, {
    onSuccess: (data) => {
      Swal.fire({
        icon: "success",
        title: "Booking successful!",
        text: "Redirecting to payment...",
        timer: 1500,
        showConfirmButton: false,
      });
      socket.emit("new-booking");
      setSelectedSlot(null);
      setRecurring("none");

      const selected = courts.find((court) => court.id == selectedCourt);
      const price = selected?.price_per_hour ? selected.price_per_hour * 100 : 1000;

      setTimeout(() => {
        navigate(`/payment?bookingId=${data.bookingId}&amount=${price}`);
      }, 1500);
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Booking failed",
        text: error.response?.data?.message || "Something went wrong",
      });
    },
  });

  const handleBooking = () => {
    if (!selectedSlot || !selectedCourt) {
      Swal.fire({
        icon: "warning",
        title: "Missing selection",
        text: "Please select both a court and time slot.",
      });
      return;
    }

    const [start_time, end_time] = selectedSlot.split(" - ");
    const baseData = {
      court_id: selectedCourt,
      start_time,
      end_time,
    };

    const data =
      recurring !== "none"
        ? {
            ...baseData,
            start_date: selectedDate.toISOString().split("T")[0],
            recurrence: recurring,
            recurring: true,
          }
        : {
            ...baseData,
            date: selectedDate.toISOString().split("T")[0],
          };

    if (recurring !== "none") {
      bookRecurringCourt(data)
        .then(() => {
          Swal.fire({
            icon: "success",
            title: "Recurring bookings created!",
          });
          socket.emit("new-booking");
        })
        .catch((err) =>
          Swal.fire({
            icon: "error",
            title: "Failed to create recurring bookings",
            text: err.response?.data?.message || "Something went wrong",
          })
        );
    } else {
      mutation.mutate(data);
    }
  };

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
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">Book Your Court</h1>
          <p className="mt-3 max-w-md text-lg text-indigo-200 sm:text-xl md:mt-5 md:max-w-3xl">Choose your preferred court, date, and time slot.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Court Booking</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Court Selection */}
          <Card>
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-50 p-2 rounded-lg">
                <Activity className="h-6 w-6 text-indigo-600" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-4">Select Court</h3>
            <select
              value={selectedCourt}
              onChange={(e) => setSelectedCourt(e.target.value)}
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Select Court --</option>
              {courts?.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name} – {court.location}
                </option>
              ))}
            </select>
          </Card>

          {/* Date Selection */}
          <Card>
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-50 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-indigo-600" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-4">Select Date</h3>

            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="yyyy-MM-dd"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Recurring Booking</label>
              <select
                value={recurring}
                onChange={(e) => setRecurring(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="none">No</option>
                <option value="weekly">Weekly (Next 4 Weeks)</option>
                <option value="monthly">Monthly (Next 4 Months)</option>
              </select>
            </div>
          </Card>

          {/* Time Slot Selection */}
          <Card>
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-50 p-2 rounded-lg">
                <Clock className="h-6 w-6 text-indigo-600" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-4">Select Time Slot</h3>

            <div className="space-y-2">
              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {availableSlots.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2 border rounded-lg transition-colors ${
                        selectedSlot === slot ? "bg-indigo-600 text-white border-indigo-700" : "bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-300"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-red-500">No slots available for this date</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Booking Summary & Button */}
        <div className="mt-8">
          <Card>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Booking Summary</h3>
                <p className="text-gray-500 mb-4 md:mb-0">
                  {selectedCourt && courts ? `Court: ${courts.find((c) => c.id == selectedCourt)?.name}` : "No court selected"}
                  {selectedDate ? ` • Date: ${selectedDate.toISOString().split("T")[0]}` : ""}
                  {selectedSlot ? ` • Time: ${selectedSlot}` : ""}
                  {recurring !== "none" ? ` • ${recurring === "weekly" ? "Weekly" : "Monthly"} recurring` : ""}
                </p>
              </div>
              <Button onClick={handleBooking} className="md:self-end">
                <PlusCircle className="h-4 w-4" />
                <span>{recurring === "none" ? "Confirm Booking" : "Book Recurring Slot"}</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Booking;
