require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongo = require('mongo');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const shortId = require('shortid');
const validUrl = require('valid-url');

const port = process.env.PORT || 3000;
const httpRegex = /^(http|https)(:\/\/)/;

// Connecting to MongoDB database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Defining URL model
const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String,
});
const URL = mongoose.model('URL', urlSchema);

app.use(cors());

app.use(
  bodyParser.urlencoded({
    extended: false,
  }),
);

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async function (req, res) {
  const originalUrl = req.body.url;
  const urlCode = shortId.generate();

  if (httpRegex.test(originalUrl)) {
    try {
      let findOne = await URL.findOne({
        original_url: originalUrl,
      });

      if (findOne) {
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url,
        });
      } else {
        findOne = new URL({
          original_url: originalUrl,
          short_url: urlCode,
        });
        await findOne.save();
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url,
        });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({
        error: 'Server error',
      });
    }
  } else {
    res.json({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:short_url', async function (req, res) {
  const urlParam = await URL.findOne({
    short_url: req.params.short_url,
  });
  try {
    if (urlParam) {
      return res.redirect(urlParam.original_url);
    } else {
      return res.status(400).json({
        error: 'No URL found',
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: 'Server error',
    });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
