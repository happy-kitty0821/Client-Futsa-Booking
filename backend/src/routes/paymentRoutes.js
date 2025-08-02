import express from 'express';
import { createPaymentIntent } from '../controllers/paymentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';


const router = express.Router();

// POST /api/payments/create-intent
router.post('/create-intent', protect, createPaymentIntent);

export default router;