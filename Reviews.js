var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// mongoose.connect(process.env.DB);

// Movie schema
const ReviewSchema = new Schema({
  movieId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Movie',
    required: true
  },
  username: { type: String, required: true },
  review: { type: String, required: true },
  rating: { type: Number, min: 0, max: 5, required: true }
});
ReviewSchema.index({ movieId: 1, username: 1 }, { unique: true });
// return the model
module.exports = mongoose.model('Review', ReviewSchema);