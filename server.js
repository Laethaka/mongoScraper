// Dependencies
var express = require("express");
var mongojs = require("mongojs");
// Require request and cheerio. This makes the scraping possible
var request = require("request");
var cheerio = require("cheerio");

// Initialize Express
var app = express();

// Database configuration
var databaseUrl = "steamScraper";
var collections = ["scrapedSteam"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
  console.log("Database Error:", error);
});

// Main route (simple Hello World Message)
app.get("/", function(req, res) {
  res.send("Hello world");
});

// Retrieve data from the db
app.get("/all", function(req, res) {
  // Find all results from the scrapedData collection in the db
  db.scrapedData.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as json
    else {
      res.json(found);
    }
  });
});

// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function(req, res) {

  // Make a request for the news section of ycombinator
  request("https://store.steampowered.com/news/?feed=steam_announce", function(error, response, html) {
    // Load the html body from request into cheerio
    var $ = cheerio.load(html);
    // For each element with a "title" class
    $(".newsPostBlock").each(function(i, element) {
      // Save the text and href of each link enclosed in the current element
      var title = $(element).children('.feed').text().split('-')[0];
      var link = $(element).children(".body").children('a:first-child').attr("href");
      var summary = $(element).children('.body').text();

    // console.log(title, link, summary)

      // If this found element had both a title and a link
        if (link.includes('http://store.steampowered.com/app/')) { //NEWS ITEM IS FOR A DISCRETE GAME
            // Insert the data in the scrapedData db
            db.scrapedSteam.insert({
                title: title,
                link: link,
                summary: summary
            },
            function(err, inserted) {
                if (err) {
                // Log the error if one is encountered during the query
                console.log(err);
                } else {
                // Otherwise, log the inserted data
                console.log(inserted);
                }
            });
        }
    });
  });

  // Send a "Scrape Complete" message to the browser
  res.send("Scrape Complete");
});


// Listen on port 3000
app.listen(5588, function() {
  console.log("App running on port 5588!");
});