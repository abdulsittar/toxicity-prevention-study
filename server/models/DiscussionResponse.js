const mongoose = require('mongoose');

const DiscussionResponseSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  responses: {
    afraid: { type: Number, min: 1, max: 5 },
    angry: { type: Number, min: 1, max: 5 },
    happy: { type: Number, min: 1, max: 5 },
    sad: { type: Number, min: 1, max: 5 },
    trusting: { type: Number, min: 1, max: 5 },
    disgusted: { type: Number, min: 1, max: 5 },
    curious: { type: Number, min: 1, max: 5 },
    surprised: { type: Number, min: 1, max: 5 }
  }
}, { timestamps: true });

module.exports = mongoose.model('DiscussionResponse', DiscussionResponseSchema);
