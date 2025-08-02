import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import UserPayment from "../components/UserPayment";

const PaymentForm = () => {
  const [params] = useSearchParams();
  const bookingId = params.get("bookingId");
  const amount = parseInt(params.get("amount"), 10);

  const [user, setUser] = useState({ name: "", email: "", phone: "" });
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setUser(res.data);
      } catch (error) {
        console.error("Failed to load user info", error);
      }
    };

    fetchUser();
  }, []);

  if (!bookingId || isNaN(amount)) {
    return <div className="text-center mt-20 text-red-500">Invalid booking information.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-3xl p-8 transition-all duration-300">
        <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">
          Booking Payment
        </h1>

        {paymentSuccess ? (
          <div className="text-center">
            <div className="text-green-600 text-2xl font-semibold mb-2">
              ✅ Payment Completed
            </div>
            <p className="text-slate-600 mb-4">Thank you for your payment! Your court booking has been confirmed.</p>
            <a
              href="/"
              className="inline-block px-6 py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow transition-all"
            >
              Go to Dashboard
            </a>
          </div>
        ) : (
          <>
            <p className="text-slate-600 text-center mb-6">
              You can pay securely now or later. Use Stripe or Khalti below.
            </p>

            <UserPayment
              bookingId={bookingId}
              amount={amount}
              onSuccess={(method, paymentInfo) => {
                console.log("✅ Payment successful via", method, paymentInfo);
                setPaymentSuccess(true);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentForm;
