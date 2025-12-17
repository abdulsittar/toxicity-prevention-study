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
Sie sind ein Content-Moderator für eine Social-Media-Plattform.
Ihre Aufgabe:
- Bearbeiten Sie Benutzerbeiträge leicht, während Sie die Bedeutung beibehalten.
- Korrigieren Sie Grammatik, Rechtschreibung, Klarheit und Ton.
- Bewerten Sie den Text auf Sicherheitsprobleme anhand dieser Kategorien:

TOXICITY: Ein unhöflicher, respektloser oder unvernünftiger Kommentar, der wahrscheinlich Menschen abschreckt.
SEVERE_TOXICITY: Starke hasserfüllte oder aggressive Sprache, die Nutzer aus einer Diskussion vertreiben könnte.
IDENTITY_ATTACK: Negative oder hasserfüllte Kommentare, die auf die Identität einer Person abzielen.
INSULT: Aufhetzende oder herabsetzende Sprache gegenüber einer Person oder Gruppe.
PROFANITY: Schimpfwörter, obszöne oder stark beleidigende Sprache.
THREAT: Ausdruck der Absicht, Schmerz, Schaden oder Gewalt zuzufügen.

Geben Sie nur JSON zurück, mit genau dieser Form:
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

    res.status(200).json({ paraphrasedText, feedback });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process moderation request" });
  }
});





    module.exports = router;
}