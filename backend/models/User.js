const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true }, // Changed from 'name' and 'email' for simplicity with existing auth
  password: { type: String, required: true },
  workouts: [{ type: Schema.Types.ObjectId, ref: 'Workout' }],
  transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
  goals: [{ type: Schema.Types.ObjectId, ref: 'Goal' }] // Added goals
}, { timestamps: true });

// Note: In a real app, you'd add methods for password hashing here (e.g., pre-save hook)
// or handle it in the route logic if not using Mongoose middleware.
// For this exercise, password hashing is already handled in the route logic before saving.

const User = mongoose.model('User', userSchema);
module.exports = User;
