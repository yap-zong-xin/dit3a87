import axios from "axios";
import { useState, useEffect } from "react";
import { Button, Form, Input, InputGroup, InputGroupAddon } from "reactstrap"
import "./chatOnline.css";

export default function ChatOnline({ currentId, conv }) {
  const [user, setUser] = useState(null);
  const [listing, setListing] = useState(null)
  // const [offerAmt, setOfferAmt] = useState("")
  const [newOfferAmt, setNewOfferAmt] = useState("")
  const [offerAmt1, setOfferAmt1] = useState(null)
  const [offerStatus, setOfferStatus] = useState("")

  // function refreshPage() {
  //   window.location.reload();
  // }



  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await axios("/users/" + currentId);
        setUser(res.data);
        // setOfferStatus("")
        // setOfferAmt1(null)
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
        setListing(null)
        setOfferStatus("")
        setOfferAmt1(null)
        console.log(err);
      }
    };


    // if (!conv.offerListing) {
    //   setListing(null)
    //   setOfferStatus("")
    //   setOfferAmt1(null)
    // } else {
    getListing();
    // }
    getUser();





  }, [currentId, conv])



  function AgentOfferStatus() {
    return (
      <div>

        <Button color="success" className="acceptBtn" onClick={() => { acceptOffer() }}>Accept</Button>
        <Button color="danger" onClick={() => { rejectOffer() }}>Reject</Button>
      </div>
    )
  }



  function acceptOffer() {

    try {
      axios.post("/conversations/acceptOffer/" + conv._id)
      // refreshPage()
      setOfferStatus("accepted")
    } catch (err) {
      console.log(err);
    }
  }

  function rejectOffer() {
    try {
      axios.post("/conversations/rejectOffer/" + conv._id)
      // refreshPage()
      setOfferStatus("rejected")
    } catch (err) {
      console.log(err);
    }
  }


  function AgentOfferInfo() {
    return (
      <div>
        {/* <hr /> */}

        <img className="listingImg" src={listing.thumbnail}
          alt="" />
        <div className="listingInfo">
          <p>   {listing.name}</p>
          {(offerStatus === "accepted") && <p className="text-success">You accepted this Offer</p>}
          {(offerStatus === "rejected") && <p className="text-danger">You rejected this Offer</p>}
          {(offerStatus !== undefined) && <OfferAmount></OfferAmount>}
          {(offerStatus === "pending") && <AgentOfferStatus></AgentOfferStatus>}

          {(offerStatus === "accepted") && <Button color="danger" onClick={() => { rejectOffer() }}>Cancel</Button>}
          {(offerStatus === "rejected") && <Button color="success" onClick={() => { acceptOffer() }}>Accept</Button>}

        </div>

      </div>
    )
  }
  function ListingInfo() {
    return (
      <div>
        {/* <hr /> */}
        <img className="listingImg" src={listing.thumbnail}
          alt="" />
        <div className="listingInfo">
          <p>{listing.name}</p>

          {(offerStatus === "accepted") && <p className="text-success">Accepted</p>}
          {(offerStatus === "rejected") && <p className="text-danger">Rejected</p>}
          {(offerStatus !== undefined) && <OfferAmount></OfferAmount>}
          {(offerStatus === "accepted") && <Button className="reviewBtn" onClick={() => window.open("https://sap-dit3a87.herokuapp.com/user/" + user._id + "/reviews/new")}>Leave Review</Button>}
        </div>
        {/* } */}

      </div>
    )
  }

  function submitOffer() {
    const conversation = {
      id: conv._id,
      offerAmt: newOfferAmt,
      offerStatus: "pending"
    }
    try {
      axios.post("/conversations/offer/", conversation)
      setOfferAmt1(newOfferAmt)
      // refreshPage()
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

  // function OfferBtn() {

  //   return (
  //     <div>
  //       <div className="Offer">
  //         <Form>
  //           <div className="offerInput">
  //             <InputGroup className="w-25">
  //               <InputGroupAddon className="sign" addonType="prepend">$</InputGroupAddon>
  //               <Input type="number" className="w-25" name="offer" id="offerInput" placeholder="" value={newOfferAmt} onChange={(e) => setNewOfferAmt(e.target.value)} />
  //               {(offerStatus === undefined) && <Button className="offerButton" onClick={submitOffer}>Make Offer</Button>}
  //               {(offerStatus === "pending") && <Button className="offerButton" onClick={submitOffer}>Edit Offer</Button>}
  //               {(offerStatus === "accepted") && <Button className="offerButton" onClick={submitOffer}>Edit Offer</Button>}
  //               {(offerStatus === "rejected") && <Button onClick={submitOffer}>Make New Offer</Button>}
  //             </InputGroup>
  //           </div>

  //         </Form>
  //       </div>

  //     </div>
  //   );
  // }











  return (
    <div>
      {user ? (
        <>
          <div>
            {user &&
              <div className="userImg">
                <img
                  className="chatOnlineImg"
                  src={
                    user.image
                  }
                  alt=""
                  onClick={() => window.open("https://sap-dit3a87.herokuapp.com/user/" + user._id)}
                />
                <div className="userInfo">
                  <h1 className="display-6">{user.firstName} {user.lastName}</h1>
                  {(user.cea) && <p>Agent</p>}
                  {(!user.cea) && <p>Seeker</p>}
                </div>
              </div>}



            <div className="offerInfo">
              {(listing && !user.cea) && <AgentOfferInfo></AgentOfferInfo>}
              {(listing && user.cea) && <ListingInfo></ListingInfo>}
            </div>


            {(listing && user.cea && offerStatus !== "accepted") &&
              <div className="OfferForm">
                {(offerStatus !== undefined) && <OfferAmount></OfferAmount>}
                <Form>
                  <div className="offerInput">
                    <InputGroup>
                      <InputGroupAddon className="sign" addonType="prepend">$</InputGroupAddon>
                      <Input type="number" className="w-25" name="offer" id="offerInput" placeholder="" value={newOfferAmt} onChange={(e) => setNewOfferAmt(e.target.value)} />
                      {(offerStatus === undefined) && <Button className="offerButton" onClick={submitOffer}>Make Offer</Button>}
                      {(offerStatus === "pending") && <Button className="offerButton" onClick={submitOffer}>Edit Offer</Button>}
                      {(offerStatus === "accepted") && <Button className="offerButton" onClick={submitOffer}>Edit Offer</Button>}
                      {(offerStatus === "rejected") && <Button onClick={submitOffer}>Make New Offer</Button>}
                    </InputGroup>
                  </div>
                </Form>
              </div>}

          </div>
        </>
      ) : (
        <p></p>
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
