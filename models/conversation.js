const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    members: {
      type: Array,
    },
    offerListing: {
      type: String,
    },
    offerAmt: {
      type: String,
    },
    offerStatus: {
      type:String,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("conversation", conversationSchema);
