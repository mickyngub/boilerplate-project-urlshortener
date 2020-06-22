'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
let bodyParser = require('body-parser');
var cors = require('cors');
let dns = require('dns');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', () => console.log("We're in"));
/** this project needs a db !! **/ 
// mongoose.connect(process.env.DB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use("", bodyParser.urlencoded({"extended":false}));

app.use("", (req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
})
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});
let urlSchema = new mongoose.Schema({
  longURL : {type: String, required: true },
  shortenURL : String,
});

let URL = mongoose.model("URL", urlSchema);

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.route("/api")

app.post("/api/shorturl/new", (req, res, done) => {
  let {url : oldURL} = req.body;
  console.log(req.body);

  const checking = new Promise((resolve, reject) => {
    let response = URL.exists({"longURL":oldURL});
    // let checkURL = dns.lookup(oldURL, (err,address,family) => console.log(address));
    if(response) {
      resolve(response);
    } else {
      reject("Problem has occurred");
    }
  });
  checking.then(result => {
    
    console.log(`Does the website exist in DB? ${result}`);
    
    if(!result) {
      if(/https*:\/\/www..*.(com|org).*/.test(oldURL)) {
        let shortenURL = Math.random().toString(32).substring(2,8);
        res.json({"original_url":oldURL,
        "shorten_url": shortenURL});

        let objURL = new URL({longURL: oldURL,
        shortenURL: shortenURL});
        console.log(`${objURL.longURL} ${objURL.shortenURL}`);

        objURL.save((err,data) => {
          if(err) {
            return console.error(err);
          }
        console.log("save successfully");
        done(null, data);
        });
        } else {
          res.json({"error": "invalid URL"});
      }

    } else {
      res.json({"error": "The website already exists"});

    }

    });
  
  
  // const checking = await URL.exists({"longURL": oldURL});
  // console.log(checking);
  
});

app.get("/api/shorturl/:newURL", (req, res, done) => {
  URL.findOne({"shortenURL": req.params.newURL}, (err, data) => {
    if(err) return console.error(err);
    console.log(data.longURL);
    res.redirect(data.longURL);
    done(null, data);
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});