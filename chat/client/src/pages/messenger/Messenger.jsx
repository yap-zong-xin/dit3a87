import "./messenger.css";
import Conversation from "../../components/conversations/Conversation";
import Message from "../../components/message/Message";
import ChatOnline from "../../components/chatOnline/ChatOnline";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useParams } from "react-router";

export default function Messenger() {
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [friendId,setFriendId] = useState("")
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const socket = useRef();
  const userId = useParams().userid;
  const scrollRef = useRef();
  const scrollRef1 = useRef();

  useEffect(() => {
    socket.current = io("/");
    socket.current.on("getMessage", (data) => {
      setArrivalMessage({
        sender: data.senderId,
        text: data.text,
        createdAt: Date.now(),
      });
    });
  }, []);

  useEffect(() => {
    arrivalMessage &&
      currentChat?.members.includes(arrivalMessage.sender) &&
      setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage, currentChat]);

  useEffect(() => {
    socket.current.emit("addUser", userId);
  }, [userId]);

  useEffect(() => {
    const getConversations = async () => {
      try {
        const res = await axios.get("/conversations/" + userId);
        setConversations(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    getConversations();
  }, [userId]);

  useEffect(() => {
    const getMessages = async () => {
      try {
        const res = await axios.get("/messages/" + currentChat._id);
        setMessages(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    getMessages();
  }, [currentChat]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const message = {
        conversationId: currentChat._id,
        sender: userId,
        text: newMessage
    };

    const receiverId = currentChat.members.find(
      (member) => member !== userId
    );



const blank = new RegExp(/.*\S.*/)

if (blank.test(newMessage)=== false) {
  console.log("msg is blank")
} else {
  socket.current.emit("sendMessage", {
    senderId: userId,
    receiverId:receiverId,
    text: newMessage,
  });
  try {
    const res = await axios.post("/message", message);
    setMessages([...messages, res.data]);
    console.log(newMessage.length)
    setNewMessage("");
  } catch (err) {
    console.log(err);
  }
}

  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    scrollRef1.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);

  function handleCurrentChat (c){
    setCurrentChat(c)

    const receiverId = c.members.find(
      (member) => member !== userId
    );
    setFriendId(receiverId)



  }

  // function deleteChat (){

  // }

  return (
    <>
      {/* <Topbar /> */}
      <div className="messenger">
        <div className="chatMenu">
          <h3>Inbox</h3>
          <hr style={{
            height:0.4
          }}>
          </hr>
          <div className="chatMenuWrapper">
            {conversations.map((c) => (
                <div ref={scrollRef1}>
              <div onClick={() => handleCurrentChat(c)}>
                <Conversation conversation={c} currentUser={userId} />
                  </div>
              </div>
            ))}
          </div>
        </div>
        <div className="chatBox">
          <div className="chatBoxWrapper">
          <ChatOnline
              conv={currentChat}
              currentId={friendId}
            />
            {currentChat ? (
              <>
                <div className="chatBoxTop">
                  {messages.map((m) => (
                    <div ref={scrollRef}>
                      <Message message={m} own={m.sender === userId} />
                    </div>
                  ))}
                </div>
                <div className="chatBoxBottom">
                  <textarea
                    className="chatMessageInput"
                    placeholder="write something..."
                    onChange={(e) => setNewMessage(e.target.value)}
                    value={newMessage}
                  ></textarea>
                  <button className="chatSubmitButton" onClick={handleSubmit}>
                  <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAABWElEQVRIie3UL0hkURTHcf+MCwuCLGzwzwaDQRTMBpui0bRtrVbDCiYtloW1GjZsGavNsKhRo0WjSZBxFcGwiIiiH8Ocgau892ZGJ8medO+5v/v7nnt477S1/Y8k0I8F/G6l6Ud8xRbuVeP7W007MIFf+Od5PGDgtcZjWEMlMXzEHrZjv9Osaa2vBy8qPcEPDIVuP/LfGjHN6itcoYwptCf6wXjJNbrzTDsxg40Q1uIWm5jFh0RfQl+sl0O7UVR1OaOv8/iU07ZVlGJ/HPem67VlN4QXGM7RTeII/bEfjzsVdOYCMiDnGE3O2rGEu7RSrIf+Z6F5EQSf8SdyK4m2C5eRH2sIkAE5w2mst9GR6GYjf9iweQ4E/qL3hWYzzhabBmRAzjGSnPXgRnU0fHkVoAgSnzDNjoZGIar/Ccy9GZABuVBvNLQAQtFoaBEkfzS0AFJWbzS8i3gCIB2P4qUlL1gAAAAASUVORK5CYII=" alt=""/>
                  </button>
                </div>
              </>
            ) : (
              <span className="noConversationText">
                Open a conversation to start a chat.
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
