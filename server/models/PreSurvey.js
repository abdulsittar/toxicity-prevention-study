const mongoose = require('mongoose');

const PersonalitySchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

const PreSurveySchema = new mongoose.Schema(
  {
    uniqueId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "IDStorage",
    },

    prolificId: { type: String, required: true },

    age: { type: Number, required: true },
    gender: { type: String, required: true },
    political: { type: String, required: true },

    personality: [PersonalitySchema],

    completedAt: { type: Date, required: true },
    surveyVersion: { type: String, default: "3-stage-v1" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PreSurvey", PreSurveySchema);
