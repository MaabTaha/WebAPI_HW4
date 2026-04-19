var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');

mongoose.Promise = global.Promise;

//mongoose.connect(process.env.DB, { useNewUrlParser: true });
try {
    mongoose.connect( process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
        console.log("connected"));
}catch (error) {
    console.log("could not connect");
}
mongoose.set('useCreateIndex', true);

//user schema
var UserSchema = new Schema({
    name: String,
    username: { type: String, required: true, index: { unique: true }},
    password: { type: String, required: true, select: false }
});
UserSchema.pre('save', function(next) {
    var user = this;

    // hash the password
    if (!user.isModified('password')) return next();
    if (!user.password) return next(new Error('Password is missing'));

    bcrypt.hash(user.password, 10, function(err, hash) {  // set salt rounds to 10
        if (err) return next(err);

        // change the password
        user.password = hash;
        next();
    });
});

UserSchema.methods.comparePassword = async function(password) { // Use async/await
    try {
        return await bcrypt.compare(password, this.password);
    } catch (err) {
        return false; // Or handle the error as you see fit
    }
};

//return the model to server
module.exports = mongoose.model('User', UserSchema);