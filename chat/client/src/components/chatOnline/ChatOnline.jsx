import axios from "axios";
import {useState} from "react";
import {Button, Jumbotron, Container} from "reactstrap"
import "./chatOnline.css";

export default function ChatOnline({ conversation, currentId }) {
  const [user, setUser] = useState(null);

  if (conversation != null) {
    const friendId = conversation.members.find((m) => m !== currentId);
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

  }

  




  // const handleClick = async (user) => {
  //   try {
  //     const res = await axios.get(
  //       `/conversations/find/${currentId}/${user._id}`
  //     );
  //     setCurrentChat(res.data);
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

  return (
    <div>
      {user ? (
        <>
        <div>
      <Jumbotron fluid>
        <Container fluid>
        <img
            className="chatOnlineImg"
            src={
              user.image
            }
            alt=""
          />
          <h1 className="display-3">{user.firstName} {user.lastName}</h1>
          <p className="lead">Email: {user.email}</p>
          <p className="lead">Phone: {user.phone}</p>
          <p className="lead">From: {user.country}</p>
          <Button color="primary" size="lg" onClick={()=> window.open("https://sap-dit3a87.herokuapp.com//user/"+user._id)}>View Profile</Button>
        </Container>
      </Jumbotron>
      </div>
        </>
      ) : (
        <p>Start a conversation!</p>
      )
      }
    </div>


    // <div className="chatOnline">
    //   {onlineFriends.map((o) => (
    //     <div className="chatOnlineFriend" onClick={() => handleClick(o)}>
    //       <div className="chatOnlineImgContainer">
    //         <img
    //           className="chatOnlineImg"
    //           src={
    //             o?.profilePicture
    //               ? PF + o.profilePicture
    //               : PF + "person/noAvatar.png"
    //           }
    //           alt=""
    //         />
    //         <div className="chatOnlineBadge"></div>
    //       </div>
    //       <span className="chatOnlineName">{o?.username}</span>
    //     </div>
    //   ))}
    // </div>
  );
}
