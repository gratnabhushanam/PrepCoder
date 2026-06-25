const mongoose = require('mongoose');

const UserStatsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  username: { type: String },
  profileImage: { type: String },
  solvedProblems: [{ type: String }],
  mcqsPracticed: { type: Number, default: 0 },
  mcqScore: { type: Number, default: 0 },
  atsScore: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  readinessScore: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  lastActivityDate: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
UserStatsSchema.index({ userId: 1 });
UserStatsSchema.index({ totalPoints: -1 });

UserStatsSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

const UserStats = mongoose.models.UserStats || mongoose.model('UserStats', UserStatsSchema);

module.exports = UserStats;
