const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const goalSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  goalType: {
    type: String,
    enum: ['weight', 'workoutFrequency', 'caloriesBurned', 'distance', 'duration', 'other'],
    required: true
  },
  targetValue: {
    type: Number,
    required: true
  },
  currentValue: {
    type: Number,
    default: 0
  },
  unit: { // e.g., 'kg', 'workouts', 'kcal', 'km', 'minutes', 'sessions'
    type: String,
    required: function() { return this.goalType !== 'other'; } // Required if not 'other' type
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    // Validate that endDate is after startDate if both are provided
    validate: [
      {
        validator: function(value) {
          // 'this' refers to the document being validated
          return !this.startDate || !value || this.startDate <= value;
        },
        message: 'End date must be after start date.'
      }
    ]
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  }
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

// Index for user and status to quickly find active goals for a user
goalSchema.index({ user: 1, status: 1 });

const Goal = mongoose.model('Goal', goalSchema);
module.exports = Goal;
