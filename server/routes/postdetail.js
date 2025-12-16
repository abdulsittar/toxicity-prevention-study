{
    const router = require('express').Router();
    const Post = require('../models/Post');
    const User = require('../models/User');
    const SpecialPost = require('../models/specialpost');
    const PostDislike = require('../models/PostDislike');
    const PostLike = require('../models/PostLike');
    const path = require('path');
    const fs = require('fs');
    const PostSurvey = require('../models/PostSurvey');
    const Repost = require('../models/Repost');
    const Viewpost = require('../models/Viewpost');
    const IDStorage = require('../models/IDStorage');
    //var ObjectId = require('mongodb').ObjectID;

    const Comment = require('../models/Comment');
    const Subscription = require('../models/Subscription');
    const webPush = require('web-push');
    const mongoose = require('mongoose');
    const { ObjectId } = require('mongoose').Types;
    const verifyToken = require('../middleware/verifyToken');
    const OpenAI = require("openai");
    
    require('dotenv').config();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });


function cleanFeedback(feedback = {}) {
  const REMOVE_PATTERNS = [
    /^no issues?\.?$/i,
    /^no .*issues?\.?$/i,
    /^no .*present\.?$/i,
    /^no .*detected\.?$/i, 
    /^none\.?$/i,
    /^$/ // empty string
  ];

  return Object.fromEntries(
    Object.entries(feedback).filter(([_, value]) => {
      if (typeof value !== "string") return false;

      const trimmed = value.trim();
      if (!trimmed) return false;

      return !REMOVE_PATTERNS.some((regex) => regex.test(trimmed));
    })
  );
}

// POST /api/paraphrase
router.post("/paraphrase", verifyToken, async (req, res) => {
  const { text } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a content moderator for a social media platform. 
Your job:
- Lightly edit user posts while preserving meaning.
- Fix grammar, spelling, clarity, and tone.
- Evaluate the text for safety issues using these categories:

TOXICITY: A rude, disrespectful, or unreasonable comment likely to push people away.
SEVERE_TOXICITY: Strong hateful or aggressive language that could drive users out of a discussion.
IDENTITY_ATTACK: Negative or hateful comments targeting a person's identity.
INSULT: Inflammatory or demeaning language toward a person or group.
PROFANITY: Curse words, obscene or highly offensive language.
THREAT: Expression of intent to cause pain, harm, or violence.

Return JSON only, with this exact shape:
{
  "paraphrasedText": "...",
  "feedback": {
    "SPELLING": "...",
    "GRAMMAR": "...",
    "TOXICITY": "...",
    "SEVERE_TOXICITY": "...",
    "IDENTITY_ATTACK": "...",
    "INSULT": "...",
    "PROFANITY": "...",
    "THREAT": "..."
  }
}
`
        },
        {
          role: "user",
          content: `Original text: ${text}`
        }
      ],
      temperature: 0.0,
    });

    let llmMessage = response.choices[0].message.content;

    llmMessage = llmMessage.replace(/```json|```/g, "").trim();

    const { paraphrasedText, feedback } = JSON.parse(llmMessage);

    const cleanedFeedback = cleanFeedback(feedback);

  res.status(200).json({
      paraphrasedText,
      feedback: cleanedFeedback
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process moderation request" });
  }
});





    module.exports = router;
}