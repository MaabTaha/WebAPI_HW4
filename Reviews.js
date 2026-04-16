var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect(process.env.DB);

// Movie schema
var ReviewSchema = new Schema({

});

// return the model
module.exports = mongoose.model('Review', ReviewSchema);