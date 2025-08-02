import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";

// Mock Khalti import (replace with real Khalti integration in your project)
const KhaltiCheckout = {
  show: () => console.log("Khalti payment initiated")
};
const KHALTI_CONFIG = {};

const stripePromise = loadStripe(
  "pk_test_51RnIO7Fyf0x3AipADirfHucXX4opUd20G9kBmb3OfXgriKvh5VlZ1JyBKD6agfHk4UrJl9u8AwtzdTky6njYnJEX00cOBR1nUo"
);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#0f172a",
      fontFamily: '"Inter", sans-serif',
      "::placeholder": {
        color: "#94a3b8",
        opacity: 1
      },
      padding: "14px 16px",
      letterSpacing: "0.025em",
      fontWeight: 500
    },
    invalid: {
      color: "#ef4444"
    }
  },
  hidePostalCode: true
};

const StripeForm = ({ bookingId, amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!stripe || !elements) {
      setLoading(false);
      return;
    }

    try {
      // 1. Call backend to create PaymentIntent
      const jwtToken = localStorage.getItem('token')
      const response = await fetch("http://localhost:5000/api/payments/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ 
           bookingId: bookingId,
          //  amount: Math.round(amount * 100) 
          amount// dont amount in paisa/cents
          }) 
      });

      if (!response.ok) {
        throw new Error("Failed to initialize payment.");
      }

      const { clientSecret } = await response.json();

      if (!clientSecret) {
        throw new Error("Missing client secret from payment initialization.");
      }

      // 2. Confirm card payment using clientSecret
      const cardElement = elements.getElement(CardElement);

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement
        }
      });

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
      } else if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
        // Payment successful, call onSuccess with payment info
        onSuccess("stripe", result.paymentIntent);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || "Something went wrong during payment.");
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-6 bg-white rounded-2xl p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]"
    >
      <div>
        <label
          htmlFor="card-element"
          className="block text-base font-medium text-slate-700 mb-3"
        >
          Card Details
        </label>
        <div
          id="card-element"
          className="border border-slate-200 rounded-xl p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all bg-white"
        >
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        {error && (
          <p className="text-sm mt-2 text-red-500 font-medium">
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-between items-center mt-2">
        <div className="text-slate-500 text-sm">
          Total Amount
        </div>
        <div className="text-xl font-bold text-slate-800">
          NPR {amount.toFixed(2)}
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className={`w-full mt-4 py-3.5 rounded-xl text-white font-bold text-base tracking-wide transition-all duration-300
          ${
            loading
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg"
          } flex items-center justify-center`}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing Payment
          </>
        ) : (
          "Pay Securely"
        )}
      </button>

      <div className="flex items-center justify-center mt-4">
        <div className="flex items-center space-x-2 text-slate-500 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Payments are secure and encrypted</span>
        </div>
      </div>
    </form>
  );
};

const UserPayment = ({ amount = 0, bookingId, onSuccess }) => {
  const [method, setMethod] = useState("stripe");

  const handleKhaltiPayment = () => {
    const checkout = new KhaltiCheckout(KHALTI_CONFIG);
    checkout.show({ amount: amount * 100 }); // paisa
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl shadow-xl border border-slate-200">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
          Complete Your Payment
        </h2>
        <p className="text-slate-500 mt-2">Secure payment for booking #{bookingId}</p>
      </div>

      {/* Payment method selector */}
      <div className="relative bg-slate-100 rounded-xl p-1 mb-8 flex">
        {["stripe", "khalti"].map((payMethod) => {
          const isActive = method === payMethod;
          return (
            <button
              key={payMethod}
              onClick={() => setMethod(payMethod)}
              type="button"
              className={`relative flex-1 py-3.5 px-4 rounded-xl text-center font-medium transition-all duration-300 z-10
                ${
                  isActive
                    ? "text-blue-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {payMethod === "stripe" ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 7h2.5l1.25 7h2.5l-1.25-7H12l1 5.5h1l-1-5.5h2.5l-1.25 7H16l1-5.5H19l-1 5.5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Credit Card
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 bg-[#5C2D91] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">K</span>
                  </div>
                  Khalti Wallet
                </div>
              )}
            </button>
          );
        })}
        <div className={`absolute top-1 bottom-1 left-1 right-1/2 bg-white shadow-sm rounded-xl transform transition-all duration-300 ease-in-out ${
          method === "khalti" ? "translate-x-full" : ""
        }`}></div>
      </div>

      {/* Payment form */}
      {method === "stripe" && (
        <Elements stripe={stripePromise}>
          <StripeForm bookingId={bookingId} amount={amount} onSuccess={onSuccess} />
        </Elements>
      )}

      {method === "khalti" && (
        <div className="bg-white rounded-2xl p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mb-5">
              <div className="w-10 h-10 bg-[#5C2D91] rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">K</span>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-800 mb-2">Pay with Khalti Wallet</h3>
            <p className="text-slate-500 text-center text-sm max-w-xs mb-6">
              Securely pay using your Khalti account with one click
            </p>

            <div className="flex justify-between w-full mb-6">
              <div className="text-slate-500 text-sm">
                Amount to pay
              </div>
              <div className="text-xl font-bold text-slate-800">
                NPR {amount.toFixed(2)}
              </div>
            </div>

            <button
              type="button"
              onClick={handleKhaltiPayment}
              className="w-full py-3.5 bg-gradient-to-r from-[#5C2D91] to-[#7E3DC8] hover:from-[#4a2373] hover:to-[#6b32ab] text-white font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-3"
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-[#5C2D91] text-sm font-bold text-black">K</span>
              </div>
              <span className="text-black"> Pay with Khalti</span>
            </button>

            <div className="mt-4 text-slate-400 text-xs">
              You'll be redirected to Khalti for payment
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex flex-col items-center text-slate-500 text-sm">
          <div className="flex items-center space-x-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>SSL Secure Payment</span>
          </div>
          <div className="flex items-center space-x-4 mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Money-Back Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPayment;
