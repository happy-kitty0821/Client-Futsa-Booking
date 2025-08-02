import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { loginUser } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import FormInput from "../components/FormInput";
import bg from "../assets/bg.png";
import Swal from "sweetalert2"; // ✅ import SweetAlert2

const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const response = await loginUser(data);
      localStorage.setItem("token", response.token);
      const decoded = jwtDecode(response.token);
      localStorage.setItem("user", JSON.stringify(decoded));

      // ✅ Beautiful popup
      await Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: "Welcome back!",
        confirmButtonColor: "#2563eb", // Tailwind blue-600
      });

      if (decoded.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error.response?.data?.message || "Invalid credentials",
        confirmButtonColor: "#e11d48", // Tailwind red-600
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl h-[500px] bg-white shadow-lg rounded-xl overflow-hidden flex">
        {/* Left image */}
        <div className="w-1/2 h-full hidden md:block">
          <img src={bg} alt="football" className="w-full h-full object-cover" />
        </div>

        {/* Right login form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-10 py-8">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-blue-800 text-center mb-4">Welcome Back</h2>
            <p className="text-gray-600 text-center mb-6">Login to book courts, join tournaments, and more!</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormInput label="Email" type="email" name="email" register={register} error={errors.email} />
              <FormInput label="Password" type="password" name="password" register={register} error={errors.password} />

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold transition duration-200">
                Login
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Don’t have an account?{" "}
              <a href="/register" className="text-blue-600 font-semibold hover:underline">
                Register
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
