var mongoose = require("mongoose");
var listing = require("./models/listing");
var Comment   = require("./models/comment");
 
var data = [
    {
        name: "Cloud's Rest", 
        image: "https://farm4.staticflickr.com/3795/10131087094_c1c0a1c859.jpg",
        description: "blah blah blah"
    },
    {
        name: "Desert Mesa", 
        image: "https://farm6.staticflickr.com/5487/11519019346_f66401b6c1.jpg",
        description: "blah blah blah"
    },
    {
        name: "Canyon Floor", 
        image: "https://farm1.staticflickr.com/189/493046463_841a18169e.jpg",
        description: "blah blah blah"
    }
]
 
function seedDB(){
    listing.remove({}, function(err){
    //remove all codes inside here
    //because we are changing how the data prints out, so previous seed data will not reflect the new changes
    //remove
    }); 
 }
 
module.exports = seedDB;
