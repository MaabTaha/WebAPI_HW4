/*
CSC3916 HW4
File: Server.js
Description: Web API scaffolding for Movie API
 */
require('dotenv').config();

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');
var mongoose = require('mongoose');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

const router = express.Router();

const rp = require('request-promise');
const crypto = require('crypto');

const GA_TRACKING_ID = process.env.GA_KEY; // Make sure this is set in your .env

mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

function trackMovieReviewEvent(movieTitle, genre, urlPath) {
    const options = {
        method: 'GET',
        url: 'https://www.google-analytics.com/collect',
        qs: {
            v: '1',                      // API Version
            tid: GA_TRACKING_ID,          // GA Tracking ID
            cid: crypto.randomBytes(16).toString('hex'), // Random client ID
            t: 'event',                   // Event hit type
            ec: genre,                    // Event category = Genre
            ea: urlPath,                  // Event action = URL path
            el: 'API Request for Movie Review', // Event label
            ev: 1,                        // Event value = 1
            cd1: movieTitle,              // Custom Dimension 1 = Movie Name
            cm1: 1                        // Custom Metric 1 = count of review
        },
        headers: { 'Cache-Control': 'no-cache' }
    };

    return rp(options)
        .then(res => console.log(`GA event sent for movie: ${movieTitle}`))
        .catch(err => console.error('GA tracking error:', err.message));
}

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', async (req, res) => { // Use async/await
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ success: false, msg: 'Please include both username and password to signup.' }); // 400 Bad Request
  }

  try {
    const user = new User({ // Create user directly with the data
      name: req.body.name,
      username: req.body.username,
      password: req.body.password,
    });

    await user.save(); // Use await with user.save()

    res.status(201).json({ success: true, msg: 'Successfully created new user.' }); // 201 Created
  } catch (err) {
    if (err.code === 11000) { // Strict equality check (===)
      return res.status(409).json({ success: false, message: 'A user with that username already exists.' }); // 409 Conflict
    } else {
      console.error(err); // Log the error for debugging
      return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' }); // 500 Internal Server Error
    }
  }
});


router.post('/signin', async (req, res) => { // Use async/await
  try {
    const user = await User.findOne({ username: req.body.username }).select('name username password');

    if (!user) {
      return res.status(401).json({ success: false, msg: 'Authentication failed. User not found.' }); // 401 Unauthorized
    }

    const isMatch = await user.comparePassword(req.body.password); // Use await

    if (isMatch) {
      const userToken = { id: user._id, username: user.username }; // Use user._id (standard Mongoose)
      const token = jwt.sign(userToken, process.env.SECRET_KEY, { expiresIn: '1h' }); // Add expiry to the token (1 hour)
      res.json({ success: true, token: 'JWT ' + token });
    } else {
      res.status(401).json({ success: false, msg: 'Authentication failed. Incorrect password.' }); // 401 Unauthorized
    }
  } catch (err) {
  console.error("SIGNIN ERROR:", err);
  console.log("SECRET_KEY:", process.env.SECRET_KEY);
  console.log("REQUEST BODY:", req.body);

  res.status(500).json({
    success: false,
    error: err.message
  });
}
});

// --------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------
router.post('/reviews', authJwtController.isAuthenticated, async (req, res) => {
  try {
    const { movieId, review, rating } = req.body;

    // Check if movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Check if user has already reviewed this movie
    const existingReview = await Review.findOne({ 
      movieId: movieId, 
      username: req.user.username 
    });

    if (existingReview) {
      return res.status(409).json({ 
        success: false, 
        message: 'You have already reviewed this movie.' 
      });
    }

    // Create new review
    const newReview = new Review({
      movieId,
      username: req.user.username, // comes from JWT
      review,
      rating
    });

    await newReview.save();

    // Fire GA tracking event
    trackMovieReviewEvent(movie.title, movie.genre, `/reviews`);

    res.status(201).json({ message: 'Review created!' });

  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

router.get('/reviews', authJwtController.isAuthenticated, async (req, res) => {
    try {
        const groupedReviews = await Review.aggregate([
            {
                $lookup: {
                    from: 'movies',            // collection name in MongoDB
                    localField: 'movieId',
                    foreignField: '_id',
                    as: 'movie'
                }
            },
            { $unwind: '$movie' },           // flatten the movie array
            {
                $group: {
                    _id: '$movie._id',
                    title: { $first: '$movie.title' },
                    reviews: {
                        $push: {
                            username: '$username',
                            review: '$review',
                            rating: '$rating'
                        }
                    }
                }
            }
        ]);

        res.json(groupedReviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});
// --------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------


router.route('/movies')
    .get(authJwtController.isAuthenticated, async (req, res) => {
      try {
        const movies = await Movie.find();
        res.json(movies);
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    })
    .post(authJwtController.isAuthenticated, async (req, res) => {
      try {
        const movie = new Movie(req.body);
        await movie.save();

        res.status(201).json(movie);
      } catch (err) {

        if (err.code === 11000) {
          return res.status(409).json({
            success: false,
            message: 'Movie already exists'
          });
        }

        res.status(400).json({
          success: false,
          message: err.message
        });
      }
    });

router.route('/movies/:id')

.put(authJwtController.isAuthenticated, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    res.json(movie);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
})

.delete(authJwtController.isAuthenticated, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }
    res.json({ success: true, message: 'Movie deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/movies/:id', authJwtController.isAuthenticated, async (req, res) => {
  try {
    const movieId = req.params.id;

    if (req.query.reviews === 'true') {
      
      const result = await Movie.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(movieId) } },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'movieId',
            as: 'reviews'
          }
        }
      ]);

      if (!result.length) {
        return res.status(404).json({ message: 'Movie not found' });
      }

      return res.json(result[0]);
    }

    // Normal movie fetch (no reviews)
    const movie = await Movie.findById(movieId);

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json(movie);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.use('/', router);

const PORT = process.env.PORT || 8080; // Define PORT before using it
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // for testing only