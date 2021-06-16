const router = require("express").Router();
const Conversation = require("../models/Conversation");

//new conv

router.post("/:senderId/:receiverId", async (req, res) => {
  const senderId =req.params.senderId
  const receiverId = req.params.receiverId
  console.log(senderId)


 const convExists = await Conversation.find({members:[senderId,receiverId]})

if (convExists.length !==0) {
  res.redirect("http://localhost:3001/messenger/"+senderId);
} else {
    try {

      const newConversation = new Conversation({
        members: [senderId,receiverId],
      });
    const savedConversation = await newConversation.save();
    res.status(200).redirect("http://localhost:3001/messenger/"+senderId);
    res
  } catch (err) {
    res.status(500).json(err);
  }
}



});

//get conv of a user

router.get("/:userId", async (req, res) => {
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

router.get("/find/:firstUserId/:secondUserId", async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      members: { $all: [req.params.firstUserId, req.params.secondUserId] },
    });
    res.status(200).json(conversation)
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
