const router = require("express").Router();
const Conversation = require("../models/conversation");

//new conv

router.post("/conversation/:senderId/:receiverId", async (req, res) => {
  const senderId =req.params.senderId
  const receiverId = req.params.receiverId
  console.log(senderId)


 const convExists = await Conversation.find({members:[senderId,receiverId]})
 const convExists1 = await Conversation.find({members:[receiverId,senderId]})


if (convExists.length !==0 || convExists1.length !==0) {
  res.redirect("https://sap-dit3a87.herokuapp.com/chat/messenger/"+senderId);
} else {
    try {

      const newConversation = new Conversation({
        members: [senderId,receiverId],
      });
    const savedConversation = await newConversation.save();
    res.status(200).redirect("https://sap-dit3a87.herokuapp.com/chat/messenger/"+senderId);
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

module.exports = router;
