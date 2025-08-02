import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";

const SuccessPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-green-50">
    <h1 className="text-3xl font-bold text-green-700 mb-4">Payment Successful ✅</h1>
    <p className="text-lg text-gray-600">Your court booking has been confirmed. Check your email for confirmation.</p>
    <a href="/dashboard" className="mt-6 text-blue-600 hover:underline">
      Go to Dashboard
    </a>
  </div>
);

export default SuccessPage;
