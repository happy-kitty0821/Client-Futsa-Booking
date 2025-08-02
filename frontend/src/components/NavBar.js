// src/components/Navbar.js
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-sm py-4 px-6 sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-extrabold text-indigo-700 tracking-tight">
          SkyKick Futsal
        </Link>

        <div className="flex items-center gap-4 text-sm font-medium">
          <Link to="/courts" className="text-gray-700 hover:text-indigo-600 px-3 py-1.5 rounded-md transition-colors duration-150">
            Courts
          </Link>

          <Link to="/booking" className="text-gray-700 hover:text-indigo-600 px-3 py-1.5 rounded-md transition-colors duration-150">
            Booking
          </Link>

          <Link to="/tournament" className="text-gray-700 hover:text-indigo-600 px-3 py-1.5 rounded-md transition-colors duration-150">
            Tournaments
          </Link>

          {user?.role === "admin" && (
            <Link to="/admin" className="text-gray-700 hover:text-indigo-600 px-3 py-1.5 rounded-md transition-colors duration-150">
              Admin Panel
            </Link>
          )}

          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600 px-3 py-1.5 rounded-md transition-colors duration-150">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-md transition duration-150">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-md transition duration-150">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
