var mongoose = require("mongoose");
 
const opts = { toJSON: {virtuals: true}};

var listingSchema = new mongoose.Schema({
   name: String,
   image: String,
   imageId: String,
   description: String,
   zone: String,
   price: Number,
   size: Number,
   type: String,
   author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
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

}, opts);
 
listingSchema.virtual("properties.popUpMarkup").get(function(){
   return `
      <strong><a href="/listings/${this._id}">${this.name}</a></strong>
      <p>${this.description.substring(0,20)}...</p>
      `;
})

module.exports = mongoose.model("listing", listingSchema);