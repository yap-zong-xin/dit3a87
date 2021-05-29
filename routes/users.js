var express = require('express');
var router = express.Router();
var middleware = require('../middleware');
var User = require("../models/user");
var listing = require("../models/listing");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'yappy', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//ADMIN DASHBOARD
//Get Route
router.get("/admin-dashboard", function(req,res){
	res.render("dashboards/admin/index.ejs");
});

//Get Route
router.get("/admin-dashboard/agent", function(req,res){
	User.find({}, function(err, allUsers){
		if(err){
			console.log(err);
		} else{
			res.render("dashboards/admin/agent.ejs", {users:allUsers});
		}
	});
});

//Get Route
router.get("/admin-dashboard/public", function(req,res){
	User.find({}, function(err, allUsers){
		if(err){
			console.log(err);
		} else{
			res.render("dashboards/admin/public.ejs", {users:allUsers});
		}
	});
});

//Show Route
router.get("/admin-dashboard/agent/:id", function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			res.redirect("/listings");
		} else{
			res.render("dashboards/admin/show.ejs", {user: foundUser});
		}
	});
});

//Edit Route
router.get("/admin-dashboard/agent/:id/edit", function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			res.redirect("/listings");
		} else{
			res.render("dashboards/admin/edit.ejs", {user: foundUser});
		}
	});
});

//Update Route
router.put("/admin-dashboard/agent/:id", function(req, res){
//can straight away use req.body.listing without having to define due to "listing[]" in the form name attributes
	User.findByIdAndUpdate(req.params.id, req.body.user, function(err, updatedUser){
		if(err){
			res.redirect("/listings");
		} else{
			res.redirect("/admin-dashboard/agent/" + req.params.id);
		}
	});
});

//AGENTS
//Get Route
router.get("/agent", function(req,res){
	User.find({}, function(err, allUsers){
		if(err){
			console.log(err);
		} else{
			res.render("users/agent.ejs", {users:allUsers});
		}
	});
});

//Show Route
router.get("/agent/:id", function (req, res) {
	//find the user with provided ID
	User.findById(req.params.id).populate("comments").populate({
			path: "reviews",
			options: {sort: {createdAt: -1}}
	}).exec(function (err, foundUser) {
			if (err) {
				req.flash("error", "Something went wrong.");
				console.log(err);
			} else {
				listing.find().where('author.id').equals(foundUser._id).exec(function(err, listings) {
					if(err) {
						req.flash("error", "Something went wrong.");
						return res.redirect("/");
					}
					res.render("users/show.ejs", {user: foundUser, listings: listings});
				})
			}
	});
});

//Edit Route
router.get("/agent/:id/edit", function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			res.redirect("/agent");
		} else{
			res.render("users/edit.ejs", {user: foundUser});
		}
	});
});

//Update Route
router.put("/agent/:id", upload.single("image"), function(req, res){
	User.findById(req.params.id, async function(err, user){
		if(err){
			req.flash("error", err.message);
			res.redirect("back");
		} else{
			if(req.file){
				try{
						await cloudinary.v2.uploader.destroy(user.imageId);
						var result = await cloudinary.v2.uploader.upload(req.file.path);
						user.image = result.secure_url;
						user.imageId = result.public_id;
				} catch(err){
						req.flash("error", err.message);
						return res.redirect("back");
				}
			}
		}
		user.username = req.body.user.username;
		user.email = req.body.user.email;
		user.firstName = req.body.user.firstName;
		user.lastName = req.body.user.lastName;
		user.save();
		console.log(user)
		req.flash("success", "Successfully Updated!");
		res.redirect("/agent/" + user._id);
	});
});

router.delete("/agent/:id", function(req, res){
  User.findById(req.params.id, async function(err, user) {
    if(err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
        await cloudinary.v2.uploader.destroy(user.imageId);
        user.remove();
        req.flash('success', 'listing deleted successfully!');
        res.redirect('/listings');
    } catch(err) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
    }
  });
});

module.exports = router;