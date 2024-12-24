const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken});

module.exports.index =  async (req,res)=>{
    let allListings = await Listing.find({});
     res.render("listings/index.ejs",{allListings});
 };

 module.exports.renderNewForm = (req,res) =>{
    res.render("./listings/new.ejs");
 };

module.exports.partials = async (req, res) => {
    const { category } = req.params;
    try {
        // Fetch listings with the selected category
        const filteredListings = await Listing.find({ category: category });
        if (filteredListings.length === 0) {
            // Send a specific message if no listings are found
            return res.send('<div>No results found for this category.</div>');
        }
        res.render('./listings/partials/listings.ejs', { allListings: filteredListings });
    } catch (error) {
        console.error('Error fetching listings by category:', error);
        res.status(500).send("Error loading listings");
    }
}


module.exports.searching = async (req, res) => {
    const { city } = req.query; // Get the search query from the URL
  
    if (!city) {
      return res.status(400).send('City is required.');
    }
  
    try {
      const filteredListings = await Listing.find({
        city: new RegExp(city, 'i') // Case-insensitive search
      });
  
      if (filteredListings.length === 0) {
        // Return a message if no results are found
        res.render('./listings/partials/noResults.ejs');
      } else {
        // Render only the listings part for the search results
        res.render('./listings/partials/listings.ejs', { allListings: filteredListings });
      }
    } catch (error) {
      console.error('Error searching for listings:', error);
      res.status(500).send('Internal server error.');
    }
  };
  
 module.exports.showListing = async (req,res) =>{
    let {id} = req.params;
    const listing = await Listing.findById(id).populate({path : "reviews",populate : { path : "author",},}).populate("owner");
    if(!listing){
       req.flash("error" ,"Listing you requested for does not exist !");
       res.redirect("/listings");  
    }
    console.log(listing);
    res.render("./listings/show.ejs",{listing});
};

module.exports.createListing = async (req,res,next) =>{
    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
      })
        .send()
    let url = req.file.path;
    let filename = req.file.filename;
    console.log(req.body.listing);
    const newListing = new Listing(req.body.listing);
    
    newListing.owner = req.user._id;
    newListing.image = {url,filename};
    newListing.geometry = response.body.features[0].geometry
    let savedListing = await newListing.save();
    
    console.log(savedListing);
    req.flash("success" ,"New listing created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req,res) =>{
    let {id} = req.params;
    let listing = await Listing.findById(id);
    if(!listing){
       req.flash("error" ,"Listing you requested for does not exist !");
       res.redirect("/listings");  
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload","/upload/h_300,w_250");
    res.render("./listings/edit.ejs",{listing,originalImageUrl});
};

module.exports.editListing = async (req, res) => {
  let { id } = req.params;

  // Log req.body to debug
  console.log(req.body);

  try {
      // Update the listing with the provided data
      let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

      // Check if a new file is uploaded and handle it
      if (req.file) {
          let url = req.file.path;
          let filename = req.file.filename;
          listing.image = { url, filename };
          await listing.save();
      }

      // Send a flash message and redirect after updating
      req.flash("success", "Listing Updated!");
      res.redirect(`/listings/${id}`);
  } catch (error) {
      console.error('Error updating listing:', error);
      res.status(500).send('Internal Server Error');
  }
};

module.exports.deleteListing = async(req,res) =>{
    let {id} = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success" ,"Listing Deleted!");
    res.redirect("/listings");
};