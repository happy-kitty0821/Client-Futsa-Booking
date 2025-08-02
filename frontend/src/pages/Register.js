import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { registerUser } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import Swal from "sweetalert2"; // ✅ SweetAlert2
import bg from "../assets/bg.png"; // same image as login

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phone: yup
    .string()
    .matches(/^\+?\d{10,15}$/, "Invalid phone number")
    .required("Phone is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await registerUser(data);

      await Swal.fire({
        icon: "success",
        title: "Registration Successful",
        text: "You can now log in to your account.",
        confirmButtonColor: "#16a34a", // green-600
      });

      navigate("/login");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: error.response?.data?.message || "Something went wrong",
        confirmButtonColor: "#e11d48", // red-600
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl h-[550px] bg-white shadow-lg rounded-xl overflow-hidden flex">
        {/* Left image */}
        <div className="w-1/2 h-full hidden md:block">
          <img src={bg} alt="register" className="w-full h-full object-cover" />
        </div>

        {/* Right register form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-10 py-10">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-blue-800 text-center mb-4">Create an Account</h2>
            <p className="text-gray-600 text-center mb-6">Sign up to start booking and joining tournaments!</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <FormInput label="Name" type="text" name="name" register={register} error={errors.name} />
              <FormInput label="Email" type="email" name="email" register={register} error={errors.email} />
              <FormInput label="Phone" type="text" name="phone" register={register} error={errors.phone} />
              <FormInput label="Password" type="password" name="password" register={register} error={errors.password} />

              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold transition duration-200">
                Register
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="text-blue-600 font-semibold hover:underline">
                Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
