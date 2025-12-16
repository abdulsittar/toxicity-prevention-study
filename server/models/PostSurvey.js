const mongoose = require('mongoose');

const PostSurveySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },

  // 3.1 Usability Check
  usability_q1: { type: String, required: false }, // topics relevant
  usability_q2: { type: String, required: false }, // comments connected

  // 3.2 Manipulation Check
  manipulation_q1: { type: String, required: false }, // spelling improved
  manipulation_q2: { type: String, required: false }, // readability
  manipulation_q3: { type: String, required: false }, // more civil
  manipulation_q4: { type: String, required: false }, // preserved meaning
  manipulation_q5: { type: String, required: false }, // useful overall

  // 3.3 Feedback
  feedback: { type: String, required: false },

  // Prolific code from PreSurvey
  prolific_code: { type: String, required: false }

}, { timestamps: true });

module.exports = mongoose.model('PostSurvey', PostSurveySchema);
