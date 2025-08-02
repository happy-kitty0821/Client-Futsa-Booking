import axios from "axios";

export const KHALTI_CONFIG = {
  baseUrl: "https://a.khalti.com/api/v2",
  secretKey: "",
};

console.log(KHALTI_CONFIG);

export const khaltiClient = axios.create({
  baseURL: KHALTI_CONFIG.baseUrl,
  headers: {
    Authorization: `Key ${KHALTI_CONFIG.secretKey}`,
    "Content-Type": "application/json",
  },
});

// export const KHALTI_CONFIG = (bookingId, amount, onSuccess) => ({
//   publicKey: "test_public_key_dc74e5c8b71145c7bc95acfd393134b9",
//   productIdentity: bookingId,
//   productName: "Futsal Booking",
//   productUrl: "http://localhost:3000/dashboard",
//   eventHandler: {
//     onSuccess(payload) {
//       console.log("Khalti Payment Success:", payload);
//       onSuccess("khalti", payload);
//     },
//     onError(error) {
//       console.error("Khalti Error:", error);
//     },
//     onClose() {
//       console.log("Khalti Modal Closed");
//     },
//   },
// });
