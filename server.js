'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var shortid = require('shortid');
var cors = require('cors');
//const validUrl = require("valid-url");
const dns = require('dns');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 7000;

/** this project needs a db !! **/ 
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true }, (err, db) => {
  if (err) console.log(`Error`, err);
  console.log(`Connected to MongoDB`);
});

const Schema = mongoose.Schema;

const shortUrlSchema = new Schema({
    givenUrl : String,
    urlCode : String,
    urlXs : String});

const ShortUrl = mongoose.model("ShortUrl", shortUrlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use(bodyParser.urlencoded({ extended: true }))

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.post("/api/shorturl/new", function (req, res) {
  const url=req.body.url;
  //console.log(url);
  var urlTest=url.replace(/^https?\:\/\//,'').replace('www.','').split(/[\/:?#]/)[0];
  console.log(url);
  dns.lookup(urlTest, function (err, data) {    
      if(err) {
        console.log("Invalid url")
        res.send({"error":"invalid URL", url}); 
      } else {
          console.log("Valid url");
          ShortUrl.findOne({givenUrl:url}, (err, data) => {
            if (err) {
              console.log("ups");
              res.send(err);
            }
            if (data) {
              console.log(data);
              return res.status(200).json({"original_url": data.givenUrl, "short_url": data.urlXs});
            } else {
              console.log("record");
              const urlCode = shortid.generate();              
              const urlXs = "https://shorten-ol.glitch.me/api/shorturl/" + urlCode;
              const record = new ShortUrl({
                givenUrl:url,
                urlCode:urlCode,
                urlXs:urlXs
              });
              record.save()
              .then(data=>res.status(200).json({"original_url": data.givenUrl, "short_url": data.urlXs}))            
              .catch (err => res.status(401).json(err));
              console.log(record);
            }
          });          
      }
  });    
});

app.get("/api/shorturl/:code", function (req, res) {
  const code = req.params.code;
  ShortUrl.findOne({urlCode:code}, (err, data) => {
            if (err) {
              res.send(err);
            }
            if (data) {
              res.redirect(data.givenUrl);
            } else {
              res.status(401).json("Invalid Short Url");
            }           
  });
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});
