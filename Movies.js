const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the process if the connection fails (optional)
  }
};

connectDB();

// Movie schema
const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true , unique: true },
  releaseDate: { type: Number, min: [1900, 'Must be greater than 1899'], max: [2100, 'Must be less than 2100']},
  genre: {
    type: String,
    enum: [
      'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Thriller', 'Western', 'Science Fiction'
    ],
  },
  actors: [{
    actorName: { type: String, required: true },
    characterName: { type: String, required: true },
  }],
});

MovieSchema.path('actors').validate(arr => Array.isArray(arr) && arr.length > 0, 'Movie must have at least one actor');

module.exports = mongoose.model('Movie', MovieSchema);

// Example Movies
/*
[
    {
        "_id": "69e454c3b7843425b05383ca",
        "title": "Toy Story",
        "releaseDate": 1995,
        "genre": "Adventure",
        "actors": [
            {
                "_id": "69e454c3b7843425b05383cb",
                "actorName": "Tom Hanks",
                "characterName": "Woody"
            },
            {
                "_id": "69e454c3b7843425b05383cc",
                "actorName": "Tim Allen",
                "characterName": "Buzz Lightyear"
            }
        ],
        "__v": 0
    },
    {
        "_id": "69e454dfb7843425b05383d8",
        "title": "Finding Nemo",
        "releaseDate": 2003,
        "genre": "Adventure",
        "actors": [
            {
                "_id": "69e454dfb7843425b05383d9",
                "actorName": "Albert Brooks",
                "characterName": "Marlin"
            },
            {
                "_id": "69e454dfb7843425b05383da",
                "actorName": "Ellen DeGeneres",
                "characterName": "Dory"
            }
        ],
        "__v": 0
    },
    {
        "_id": "69e4f1281d62076e6c0bf37c",
        "title": "Shrek",
        "releaseDate": 2001,
        "genre": "Comedy",
        "actors": [
            {
                "_id": "69e4f1281d62076e6c0bf37d",
                "actorName": "Mike Myers",
                "characterName": "Shrek"
            },
            {
                "_id": "69e4f1281d62076e6c0bf37e",
                "actorName": "Eddie Murphy",
                "characterName": "Donkey"
            }
        ],
        "__v": 0
    },
    {
        "_id": "69e4f13e1d62076e6c0bf381",
        "title": "The Incredibles",
        "releaseDate": 2004,
        "genre": "Action",
        "actors": [
            {
                "_id": "69e4f13e1d62076e6c0bf382",
                "actorName": "Craig T. Nelson",
                "characterName": "Mr. Incredible"
            },
            {
                "_id": "69e4f13e1d62076e6c0bf383",
                "actorName": "Holly Hunter",
                "characterName": "Elastigirl"
            }
        ],
        "__v": 0
    },
    {
        "_id": "69e4f1d21d62076e6c0bf386",
        "title": "Ratatouille",
        "releaseDate": 2007,
        "genre": "Comedy",
        "actors": [
            {
                "_id": "69e4f1d21d62076e6c0bf387",
                "actorName": "Patton Oswalt",
                "characterName": "Remy"
            },
            {
                "_id": "69e4f1d21d62076e6c0bf388",
                "actorName": "Lou Romano",
                "characterName": "Linguini"
            }
        ],
        "__v": 0
    },
    {
        "_id": "69e4f1e11d62076e6c0bf38b",
        "title": "Coraline",
        "releaseDate": 2009,
        "genre": "Fantasy",
        "actors": [
            {
                "_id": "69e4f1e11d62076e6c0bf38c",
                "actorName": "Dakota Fanning",
                "characterName": "Coraline"
            },
            {
                "_id": "69e4f1e11d62076e6c0bf38d",
                "actorName": "Teri Hatcher",
                "characterName": "Other Mother"
            }
        ],
        "__v": 0
    },
    {
        "_id": "69e4f2011d62076e6c0bf39d",
        "title": "WALL-E",
        "releaseDate": 2008,
        "genre": "Science Fiction",
        "actors": [
            {
                "_id": "69e4f2011d62076e6c0bf39e",
                "actorName": "Ben Burtt",
                "characterName": "WALL-E"
            },
            {
                "_id": "69e4f2011d62076e6c0bf39f",
                "actorName": "Elissa Knight",
                "characterName": "EVE"
            }
        ],
        "__v": 0
    }
]
*/