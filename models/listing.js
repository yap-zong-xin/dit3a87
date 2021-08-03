var mongoose = require("mongoose");
 
const opts = { toJSON: {virtuals: true}};

var listingSchema = new mongoose.Schema({
   name: String,
   thumbnail: String,
   thumbnailId: String,
   image: [{type: String}],
   imageId: [{type: String}],
   description: String,
   zone: String,
   price: Number,
   size: Number,
   type: String,
   bedrooms: Number,
   bathrooms: Number,
   tenure: String,
   threeDImage: String,
   video: [{type: String}],
   videoId: [{type: String}],
   soldStatus: {type: Boolean, default: false},
   archiveStatus: {type: Boolean, default: false},
   author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String,
		firstName: String,
		lastName: String,
      email: String,
      image: String,
      cea: String,
      rating: Number,
      phone: Number,
      createdAt: { type: Date, default: Date.now }
	},
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ],
   likes: [
      {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
      }
   ],
   createdAt: { type: Date, default: Date.now },
   location: String,
   unitNumber: String,
   street: String,
   geometry: {
      type: {
         type: String,
         enum: ["Point"],
         required: true
      },
      coordinates: {
         type: [Number],
         requird: true
      }
   },
   carpark: {type: Boolean, default: false},
   pool: {type: Boolean, default: false},
   gym: {type: Boolean, default: false},
   playground: {type: Boolean, default: false},
   hall: {type: Boolean, default: false},
   mall: {type: Boolean, default: false},
   intercom: {type: Boolean, default: false},
   security: {type: Boolean, default: false},
}, opts);
 
listingSchema.virtual("properties.popUpMarkup").get(function(){
   return `
      <strong><a href="/listings/${this._id}">${this.name}</a></strong>
      <p>${this.description.substring(0,20)}...</p>
      `;
})

module.exports = mongoose.model("listing", listingSchema);