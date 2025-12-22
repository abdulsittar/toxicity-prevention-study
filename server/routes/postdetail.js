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
    // German 🇩🇪 - "keine" (none/no) patterns
    /^keine\s+fehler\.?$/i,
    /^keine\s+.*inhalte\.?$/i,
    /^keine\s+.*beleidigungen\.?$/i,
    /^keine\s+.*bedrohungen\.?$/i,
    /^keine\s+.*angriffe.*\.?$/i,
    /^keine\s+.*festgestellt\.?$/i,
    /^keine\s+.*vorhanden\.?$/i,
    /^keine\s+.*erkannt\.?$/i,
    /^keine\s+.*probleme\.?$/i,
    /^keine\.?$/i,
    
    // German - "kein/keinen" variations
    /^kein(e|en)?\s+.*$/i,
    
    // German - "nicht" (not) patterns
    /^nicht\s+vorhanden\.?$/i,
    /^nicht\s+festgestellt\.?$/i,
    /^nicht\s+erkannt\.?$/i,
    /^nicht\s+toxisch\.?$/i,
    /^nicht\s+zutreffend\.?$/i,
    /^nicht\s+anwendbar\.?$/i,
    /^nicht\s+relevant\.?$/i,
    /^nichts\s+gefunden\.?$/i,
    /^nichts\.?$/i,
    
    // German - positive/correct patterns
    /^korrekt\.?$/i,
    /^richtig\.?$/i,
    /^in\s+ordnung\.?$/i,
    /^alles\s+in\s+ordnung\.?$/i,
    /^ok\.?$/i,
    /^okay\.?$/i,
    /^gut\.?$/i,
    /^passt\.?$/i,
    
    // English patterns
    /^none\.?$/i,
    /^no\s+issues?\.?$/i,
    /^no\s+problems?\.?$/i,
    /^not\s+found\.?$/i,
    /^not\s+detected\.?$/i,
    /^not\s+applicable\.?$/i,
    /^not\s+relevant\.?$/i,
    /^not\s+toxic\.?$/i,
    /^correct\.?$/i,
    /^fine\.?$/i,
    /^good\.?$/i,
    /^n\/?a\.?$/i,
    
    // Empty/whitespace
    /^[\s\-\.]*$/
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
    "Rechtschreibung": "...",
    "Grammatik": "...",
    "Toxizität": "...",
    "Schwere Toxizität": "...",
    "Identitätsangriff": "...",
    "Beleidigung": "...",
    "Vulgäre Sprache": "...",
    "Bedrohung": "..."
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
    
    // If API quota exceeded or other error, return original text with empty feedback
    if (err.status === 429 || err.code === 'insufficient_quota') {
      return res.status(200).json({
        paraphrasedText: text, // Return original text
        feedback: {} // Empty feedback
      });
    }
    
    res.status(500).json({ error: "Failed to process moderation request" });
  }
});





    module.exports = router;
}