
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  body: { type: String, required: true },   // original comment
  original: { type: String },
  paraphrasedBody: { type: String },               // GPT-paraphrased text
  editedBody: { type: String },                    // user-approved edited paraphrase
  llmFeedback: { type: String },                   // GPT explanation of changes
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CommentLike' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CommentDislike' }],
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
}, { timestamps: true });

module.exports = mongoose.model('Comment', CommentSchema);
