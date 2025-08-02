import Stripe from 'stripe';
import db from '../config/db.js'; // your database connection

const stripe = new Stripe('sk_test_51RnIO7Fyf0x3AipAmMP30qAaF96BPVEyv7bAmbqsXeRMUeMD1DDpeaBtVM0mn1byNf8dBiHwWW5nSdgsfnI36OSu00ZKRu5ser');

export const createPaymentIntent = async (req, res) => {
  try {
    console.info('the req body for payment from client is : \n ', req.body)
    const { amount, bookingId } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // 1️⃣ Validate amount
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    // 2️⃣ Get booking using raw SQL
    console.log("userId:", userId);
    console.info("booking id is : " , bookingId)
    console.log("amount:", amount);
    const [rows] = await db.execute(
      'SELECT * FROM bookings WHERE id = ? LIMIT 1',
      [bookingId]
    );

    const booking = rows[0];

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // 3️⃣ Check if the booking belongs to the authenticated user
    if (booking.user_id !== userId) {
      return res.status(403).json({ message: 'You are not authorized to pay for this booking' });
    }

    // 4️⃣ Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to paisa
      currency: 'npr',
      metadata: {
        bookingId: booking.id.toString(),
        userId: userId.toString()
      },
      description: `Payment for booking #${bookingId}`,
      receipt_email: userEmail
    });
    console.log('Stripe PaymentIntent created:', paymentIntent.id, paymentIntent.client_secret);
    // ✅ Respond to client
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Payment processing error:', error);

    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
