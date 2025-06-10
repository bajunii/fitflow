const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  paymentGateway: { type: String, required: true, enum: ['Mpesa', 'PayPal'] },
  gatewayTransactionId: { type: String, required: true, unique: true }, // Mpesa CheckoutRequestID or PayPal Order ID initially
  amount: { type: Number, required: true },
  currency: { type: String, required: true }, // e.g., "KES", "USD"
  status: { type: String, required: true, enum: ['pending', 'completed', 'failed', 'created', 'approved_by_user'], default: 'pending' },
  mpesaReceiptNumber: { type: String }, // Specific to Mpesa
  paypalOrderId: { type: String }, // Specific to PayPal (could be the same as gatewayTransactionId if that's the order ID)
  paypalCaptureId: { type: String }, // Specific to PayPal capture
  // You might also want to store the full callback/webhook payloads for auditing
  gatewayResponse: { type: Schema.Types.Mixed }, // To store raw responses from gateways
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
