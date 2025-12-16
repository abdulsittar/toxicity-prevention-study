const express = require('express');
const router = express.Router();
const PostSurvey = require('../models/PostSurvey');
const PreSurvey = require('../models/PreSurvey');
const verifyToken = require('../middleware/verifyToken');
const sanitizeHtml = require('sanitize-html');
const User = require('../models/User');

function sanitize(input) {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
}

// Submit Post-Survey
router.post('/submit/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { data } = req.body; // extract data object
    const { uniqueId, usability, manipulation, feedback } = data;

    // Check if already submitted
    const existing = await PostSurvey.findOne({ userId });
    if (existing) {
      return res.status(400).json({
        message: "Post-survey already submitted",
        prolific_code: existing.prolific_code
      });
    }

    // Fetch prolific code from PreSurvey
    const preSurvey = await PreSurvey.findOne({ uniqueId });
    if (!preSurvey) {
      return res.status(404).json({ message: "PreSurvey not found for this user" });
    }

    const prolificCode = preSurvey.prolificId;

    const newSurvey = new PostSurvey({
      userId,

      // Usability
      usability_q1: usability.q1,
      usability_q2: usability.q2,

      // Manipulation
      manipulation_q1: manipulation.q1,
      manipulation_q2: manipulation.q2,
      manipulation_q3: manipulation.q3,
      manipulation_q4: manipulation.q4,
      manipulation_q5: manipulation.q5,

      // Feedback
      feedback: sanitize(feedback),

      // Prolific
      prolific_code: prolificCode
    });

    await newSurvey.save();

    return res.status(200).json({
      message: "Post-survey saved",
      prolific_code: prolificCode
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});




module.exports = router;
