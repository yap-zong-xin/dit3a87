import axios from "axios";
import { useState, useEffect } from "react";
import { Button, Jumbotron, Container, Form, Input, InputGroup, InputGroupAddon } from "reactstrap"
import "./chatOnline.css";

export default function ChatOnline({ currentId, conv }) {
  const [user, setUser] = useState(null);
  const [listing, setListing] = useState(null)
  const [offerAmt, setOfferAmt] = useState("")
  const [offerAmt1, setOfferAmt1] = useState(null)
  const [offerStatus, setOfferStatus] = useState("")

  function refreshPage() {
    window.location.reload();
  }
  


  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await axios("/users/" + currentId);
        setUser(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    const getListing = async () => {
        try {
          const res = await axios("/listing/" + conv.offerListing);
          setListing(res.data);
          setOfferStatus(conv.offerStatus)
          setOfferAmt1(conv.offerAmt)
        } catch (err) {
          console.log(err);
        }
    };


    // if (!conv.offerListing) {
    //   setListing(null)
    //   setOfferStatus("")
    //   setOfferAmt1(null)
    //   setOfferAmt("")
    // } else {
      getListing();
    // }



    getUser();

  }, [currentId, conv])

  function AgentOfferInfo() {
    return (
      <div>
        <hr />
        <p>
          <img className="listingImg" src={listing.thumbnail}
            alt="" />
          {listing.name}</p>
        {(offerStatus=== "accepted") && <p className="text-success">Accepted</p>}
        {(offerStatus=== "rejected") && <p className="text-danger">Rejected</p>}
        {(offerStatus=== "pending") &&<OfferAmount></OfferAmount>}
        {(offerStatus=== "pending") && <AgentOfferStatus></AgentOfferStatus>}

      </div>
    )
  }

  function AgentOfferStatus() {
    return (
      <div>
        <Button color="success" onClick={() => { acceptOffer()}}>Accept</Button>
        <br></br>
        <br></br>
        <Button color="danger" onClick={() => { rejectOffer()}}>Reject</Button>
      </div>
    )
  }



  function acceptOffer() {

    try {
      axios.post("/conversations/acceptOffer/"+conv._id)
      refreshPage()
    } catch (err) {
      console.log(err);
    }
  }

  function rejectOffer() {
    try {
      axios.post("/conversations/rejectOffer/"+conv._id)
      refreshPage()
    } catch (err) {
      console.log(err);
    }
  }



  function ListingInfo() {
    return (
      <div>
        <hr />
        <p>
          <img className="listingImg" src={listing.thumbnail}
            alt="" />
          {listing.name}</p>
        {(offerStatus=== "accepted") && <p className="text-success">Accepted</p>}
        {(offerStatus=== "rejected") && <p className="text-danger">Rejected</p>}
        {(offerStatus!== undefined) &&<OfferAmount></OfferAmount>}
        {(offerStatus === "accepted") && <Button onClick={() => window.open("https://sap-dit3a87.herokuapp.com/user/" + user._id+ "/reviews")}>Leave Review</Button>}
        
        {/* } */}
        {(offerStatus !== "accepted") && <OfferBtn></OfferBtn>}
      </div>
    )
  }

  function submitOffer() {
    const conversation = {
      id: conv._id,
      offerAmt: offerAmt,
      offerStatus: "pending"
    }
    try {
      axios.post("/conversations/offer/", conversation)
      setOfferAmt1(offerAmt)
    } catch (err) {
      console.log(err);
    }
  }

  function OfferAmount() {
    if (user.cea) {
      return (
        <p>You offered S${offerAmt1}</p>
      )
    } else {
      return (
        <p>They offered S${offerAmt1}</p>
      )
    }
  }

  function OfferBtn() {

    return (
      <div>


        <div className="OfferBtn">
          <Form>
            <div className="offerInput">
              <InputGroup className="w-50">
                <InputGroupAddon addonType="prepend">$</InputGroupAddon>
                <Input type="number" name="offer" id="offerInput" placeholder="" value={offerAmt} onChange={(e) => setOfferAmt(e.target.value)} />
              </InputGroup>
            </div>
            {(offerStatus === undefined) && <Button onClick={submitOffer}>Make Offer</Button>}
            {(offerStatus === "pending") && <Button onClick={submitOffer}>Edit Offer</Button>}
            {(offerStatus === "accepted") && <Button onClick={submitOffer}>Edit Offer</Button>}
            {(offerStatus === "rejected") && <Button onClick={submitOffer}>Make New Offer</Button>}

          </Form>
        </div>

      </div>
    );
  }











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
                  onClick={() => window.open("https://sap-dit3a87.herokuapp.com/user/" + user._id)}
                />
                <h1 className="display-3">{user.firstName} {user.lastName}</h1>
                {(user.cea) && <p>Agent</p>}
                {(!user.cea) && <AgentOfferInfo></AgentOfferInfo>}
                {(listing && user.cea) && <ListingInfo></ListingInfo>}
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
