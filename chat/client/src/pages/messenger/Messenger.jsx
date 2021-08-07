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

          <h3>
            <a href="https://sap-dit3a87.herokuapp.com/">
            <img className="home" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE2LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgd2lkdGg9IjQ2MC4yOThweCIgaGVpZ2h0PSI0NjAuMjk3cHgiIHZpZXdCb3g9IjAgMCA0NjAuMjk4IDQ2MC4yOTciIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQ2MC4yOTggNDYwLjI5NzsiDQoJIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPGc+DQoJPGc+DQoJCTxwYXRoIGQ9Ik0yMzAuMTQ5LDEyMC45MzlMNjUuOTg2LDI1Ni4yNzRjMCwwLjE5MS0wLjA0OCwwLjQ3Mi0wLjE0NCwwLjg1NWMtMC4wOTQsMC4zOC0wLjE0NCwwLjY1Ni0wLjE0NCwwLjg1MnYxMzcuMDQxDQoJCQljMCw0Ljk0OCwxLjgwOSw5LjIzNiw1LjQyNiwxMi44NDdjMy42MTYsMy42MTMsNy44OTgsNS40MzEsMTIuODQ3LDUuNDMxaDEwOS42M1YzMDMuNjY0aDczLjA5N3YxMDkuNjRoMTA5LjYyOQ0KCQkJYzQuOTQ4LDAsOS4yMzYtMS44MTQsMTIuODQ3LTUuNDM1YzMuNjE3LTMuNjA3LDUuNDMyLTcuODk4LDUuNDMyLTEyLjg0N1YyNTcuOTgxYzAtMC43Ni0wLjEwNC0xLjMzNC0wLjI4OC0xLjcwN0wyMzAuMTQ5LDEyMC45MzkNCgkJCXoiLz4NCgkJPHBhdGggZD0iTTQ1Ny4xMjIsMjI1LjQzOEwzOTQuNiwxNzMuNDc2VjU2Ljk4OWMwLTIuNjYzLTAuODU2LTQuODUzLTIuNTc0LTYuNTY3Yy0xLjcwNC0xLjcxMi0zLjg5NC0yLjU2OC02LjU2My0yLjU2OGgtNTQuODE2DQoJCQljLTIuNjY2LDAtNC44NTUsMC44NTYtNi41NywyLjU2OGMtMS43MTEsMS43MTQtMi41NjYsMy45MDUtMi41NjYsNi41Njd2NTUuNjczbC02OS42NjItNTguMjQ1DQoJCQljLTYuMDg0LTQuOTQ5LTEzLjMxOC03LjQyMy0yMS42OTQtNy40MjNjLTguMzc1LDAtMTUuNjA4LDIuNDc0LTIxLjY5OCw3LjQyM0wzLjE3MiwyMjUuNDM4Yy0xLjkwMywxLjUyLTIuOTQ2LDMuNTY2LTMuMTQsNi4xMzYNCgkJCWMtMC4xOTMsMi41NjgsMC40NzIsNC44MTEsMS45OTcsNi43MTNsMTcuNzAxLDIxLjEyOGMxLjUyNSwxLjcxMiwzLjUyMSwyLjc1OSw1Ljk5NiwzLjE0MmMyLjI4NSwwLjE5Miw0LjU3LTAuNDc2LDYuODU1LTEuOTk4DQoJCQlMMjMwLjE0OSw5NS44MTdsMTk3LjU3LDE2NC43NDFjMS41MjYsMS4zMjgsMy41MjEsMS45OTEsNS45OTYsMS45OTFoMC44NThjMi40NzEtMC4zNzYsNC40NjMtMS40Myw1Ljk5Ni0zLjEzOGwxNy43MDMtMjEuMTI1DQoJCQljMS41MjItMS45MDYsMi4xODktNC4xNDUsMS45OTEtNi43MTZDNDYwLjA2OCwyMjkuMDA3LDQ1OS4wMjEsMjI2Ljk2MSw0NTcuMTIyLDIyNS40Mzh6Ii8+DQoJPC9nPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPC9zdmc+DQo=" alt="Home"/>
            </a>
            Inbox
            </h3>
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
