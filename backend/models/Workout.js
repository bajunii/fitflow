const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const workoutSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, trim: true }, // e.g., "Running", "Weightlifting"
  duration: { type: Number, required: true }, // in minutes
  caloriesBurned: { type: Number },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

const Workout = mongoose.model('Workout', workoutSchema);
module.exports = Workout;
