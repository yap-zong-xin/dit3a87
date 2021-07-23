import axios from "axios";
import { useEffect, useState } from "react";
import "./conversation.css";

export default function Conversation({ conversation, currentUser }) {
  const [user, setUser] = useState(null);


  useEffect(() => {
    const friendId = conversation.members.find((m) => m !== currentUser);
    console.log(friendId)

    const getUser = async () => {
      try {
        const res = await axios("/users/" + friendId);
        setUser(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    getUser();

  }, [currentUser, conversation]);

  return (
    <div>
      <hr style={{
        height: .4
      }}></hr>
      <div className="conversation">

        <img
          className="conversationImg"
          src={
            user?.image
          }
          alt=""
        />
        <span className="conversationName">{user?.username}</span>
      </div>
    </div>
  );
}
