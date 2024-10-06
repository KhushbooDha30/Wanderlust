const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner,validateListing} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const {storage} = require("../cloudConfig.js");
const upload = multer({storage});


//index route
router.get("/",wrapAsync(listingController.index));
 
 //create new listing
 router.get("/new",isLoggedIn,listingController.renderNewForm);

 router.get("/filter/:category",wrapAsync(listingController.partials));
 //show particular listing
 router.get("/:id",wrapAsync(listingController.showListing));
 
 //new route
router.post("/new",upload.single("listing[image]"),validateListing,wrapAsync(listingController.createListing));


 //edit route
 router.get("/:id/edit",isLoggedIn,isOwner,wrapAsync(listingController.renderEditForm));
 
 router.put("/:id",isLoggedIn,isOwner,upload.single("listing[image]"),wrapAsync(listingController.editListing));
 
 
 //delete route
 router.delete("/:id",isLoggedIn,isOwner,wrapAsync(listingController.deleteListing));
 
 module.exports = router;