var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect(process.env.DB);

// Movie schema
var MovieSchema = new Schema({

});

// return the model
module.exports = mongoose.model('Movie', MovieSchema);