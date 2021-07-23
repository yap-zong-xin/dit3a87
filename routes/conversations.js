const router = require("express").Router();
const Conversation = require("../models/conversation");
const listing = require("../models/listing");


router.post("/conversation/:senderId/:receiverId", async (req, res) => {
  const senderId = req.params.senderId
  const receiverId = req.params.receiverId
  console.log(senderId)


  const convExists = await Conversation.find({ members: [senderId, receiverId] })
  const convExists1 = await Conversation.find({ members: [receiverId, senderId] })


  if (convExists.length !== 0 || convExists1.length !== 0) {
    res.redirect("https://sap-dit3a87.herokuapp.com/chat/messenger/" + senderId);
  } else {
    try {

      const newConversation = new Conversation({
        members: [senderId, receiverId],
      });
      const savedConversation = await newConversation.save();
      res.status(200).redirect("https://sap-dit3a87.herokuapp.com/chat/messenger/" + senderId);
    } catch (err) {
      res.status(500).json(err);
    }
  }



});

//new conv w listing

router.post("/conversation/:senderId/:receiverId/:listingId", async (req, res) => {
  const senderId = req.params.senderId
  const receiverId = req.params.receiverId
  const listingId = req.params.listingId


  const convExists = await Conversation.find({ members: [senderId, receiverId] })
  const convExists1 = await Conversation.find({ members: [receiverId, senderId] })


  if (convExists.length !== 0 || convExists1.length !== 0) {
    Conversation.findOneAndUpdate({ members: [senderId, receiverId] } || { members: [receiverId, senderId] }, { $set: { offerListing: listingId } }, function (err, updatedConv) {
      if (err) {
        console.log(err)
      }
    })

    res.redirect("https://sap-dit3a87.herokuapp.com/chat/messenger/" + senderId);
  } else {
    try {
      const newConversation = new Conversation({
        members: [senderId, receiverId],
        offerListing: listingId
      });
      const savedConversation = await newConversation.save();
      res.status(200).redirect("https://sap-dit3a87.herokuapp.com/chat/messenger/" + senderId);
    } catch (err) {
      res.status(500).json(err);
    }
  }



});

//get conv of a user

router.get("/conversations/:userId", async (req, res) => {
  try {
    const conversation = await Conversation.find({
      members: { $in: [req.params.userId] },
    });
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get conv includes two userId

router.get("/conversations/find/:firstUserId/:secondUserId", async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      members: { $all: [req.params.firstUserId, req.params.secondUserId] },
    });
    res.status(200).json(conversation)
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/conversations/findById/:id", async (req, res) => {
  const convId = req.params.id
  try {
    const conv = await Conversation.findById(convId)
    res.status(200).json(conv);
  } catch (err) {
    res.status(500).json(err);
  }
})

router.post("/conversations/offer", async (req, res) => {
  const convId = req.body.id
  const offerAmt = req.body.offerAmt
  const offerStatus = req.body.offerStatus
  Conversation.findByIdAndUpdate(convId, { $set: { offerAmt: offerAmt, offerStatus } }, function (err, doc) {
    if (err) {
      console.log(err)
    } else {
      if (doc) {
        console.log("offer updated")
        return res.status(204).send({ response: 'success' });
      }
    }
  })

})

router.post("/conversations/acceptOffer/:id", async (req, res) => {
  const convId = req.params.id
  Conversation.findByIdAndUpdate(convId, { $set: { offerStatus: "accepted" } }, function (err, doc) {
    if (err) {
      console.log(err)
    } else {
      if (doc) {
        console.log("offer updated")
        return res.status(204).send({ response: 'success' });
      }
    }
  })


})

router.post("/conversations/rejectOffer/:id", async (req, res) => {
  const convId = req.params.id
  Conversation.findByIdAndUpdate(convId, { $set: { offerStatus: "rejected" } }, function (err, doc) {
    if (err) {
      console.log(err)
    } else {
      if (doc) {
        console.log("offer updated")
        return res.status(204).send({ response: 'success' });
      }
    }
  })


})

module.exports = router;
