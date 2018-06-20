// Dependencies
var express = require("express");
// var mongojs = require("mongojs");
var request = require("request");
var cheerio = require("cheerio");
var mongoose = require('mongoose');
var bodyParser = require("body-parser");

// Initialize Express
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/steamScraper", {
});

var db = require("./models");

app.get("/", function (req, res) {
  res.send("Server working");
});

app.get("/all", function (req, res) {
  db.Article.find({}).then(function (found) {
    res.json(found);
  });
});

app.get("/post/:id", function (req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function (result) {
      res.json(result);
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.post("/post/:id", function (req, res) {
  db.Note.create(req.body)
    .then(function (noteInput) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: noteInput._id }, { new: true });
    })
    .then(function (result) {
      res.json(result);
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.get("/scrape", function (req, res) {

  request("https://store.steampowered.com/news/?feed=steam_announce", function (error, response, html) {
    var $ = cheerio.load(html);
    $(".newsPostBlock").each(function (i, element) { //LOOPING THROUGH ALL POSTS ON STEAM ANNOUNCEMENTS PAGE
      var title = $(element).children('.feed').text().split('-')[0].trim();
      var link = $(element).children(".body").children('a:first-child').attr("href");
      var summary = $(element).children('.body').text().trim();

      if (link.includes('http://store.steampowered.com/app/')) { //POST IS FOR A DISCRETE GAME
        db.Article.find({ title: title }, function (err, res) {
          if (res.length === 0) {//POST NOT YET IN MONGO
            db.Article.create({
              title: title,
              link: link,
              summary: summary
            },
              function (err, inserted) {
                if (err) {
                  console.log(err);
                } else {
                  console.log('inserted', title);
                }
              });
          } else {
            console.log('duplicate post scraped!', title)
          }
        })
      } else { //POST IS SOME RANDOM CRAP
        console.log('rejecting this random crap:', title)
      };
    }); //LOOP ENDS
  });
  res.send("Scrape Complete");
});


app.listen(5588, function () {
  console.log("App running on port 5588!");
});