function loadData(rs,loadObj) {
    //loadObj
    var totalRem = loadObj.totalRem;
    var sectionRem = loadObj.sectionRem;
    var remainUser = loadObj.remainUser;
    var startIndex = loadObj.startIndex;
    var endIndex;

    //loads all data
    var resultSet = JSON.parse(rs);
    var insertDiv = document.getElementById("resultDiv");
    var i;

    if (sectionRem == 0) {
        endIndex = startIndex + remainUser;
        //remaining minus 5 (as it has already been loaded)
        loadObj.totalRem = 0;
        //section minus 1 (as it has already been loaded)
        loadObj.sectionRem = 0;
        //remainUser remains the same
        loadObj.remainUser = 0;
        //end index becomes start index
        loadObj.startIndex = 0;
    } else {
        endIndex = startIndex + 5;
    }

    for (i = startIndex; i < endIndex; i++) {
        var dateMonthAsWord = moment(resultSet[i].createdAt).format('DD-MMM-YYYY');
        var html;
        if (resultSet[i].rating === 0) {
            html = `<div class="col-md-12" data-aos="fade-up" data-aos-once="true">
            <div class="col-lg-12 p-0 my-2 user-result shadow" onClick="window.location='/user/` + resultSet[i]._id + `'" >
                <div class="row col-lg-8 col-12 mx-0 py-4 px-5 user-detail justify-content-center justify-content-lg-start align-items-center d-flex" style="background: rgba(243,243,243,0.1);">
                    <img src="` + resultSet[i].image + `" style="width: 150px; height: 150px;">
                    <div class="caption-result">
                        <p class="mb-0" style="font-size:1.6em; font-weight:600;">` + resultSet[i].username + `</p>
                        <p class="px-3 mt-0 mb-2 text-center" style="font-size:0.9em!important; border-radius:15px; font-weight:400!important; border: 1px solid #4632DA;">CEA ` + resultSet[i].cea + `</p>
                        <em>No reviews found.</em>
                    </div>
                </div>
                <div class="col-lg-4 col-12 m-0 p-0 align-items-center d-flex agent-right" style="background: rgba(170,190,215,0.3);">
                    <div class="col-lg-12 m-0 p-0">
                        <p style="font-size:1em; font-weight:650;" class="mb-2" id="agent-info">Agent Details</p>
                        <div class="contact-row pb-1 align-items-center d-flex">
                            <ion-icon name="mail-outline" style="font-size:1.4em!important;"></ion-icon>
                            <li class="email-li">
                                <a href="mailto:` + resultSet[i].email + `"  style="color: black; font-size: 1em;">
                                ` + resultSet[i].email + `</a>
                            </li>
                        </div>
                        <div class="contact-row py-0 align-items-center d-flex">
                            <ion-icon name="call-outline" style="font-size:1.3em;"></ion-icon>
                            <p style="font-size:1em;" >` + resultSet[i].phone + `</p>
                        </div>
                        <div class="contact-row py-0 align-items-center d-flex">
                            <ion-icon name="male-female-outline" style="font-size:1.3em;"></ion-icon>
                            <p style="font-size:1em;" >` + resultSet[i].gender + `</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>`
        } else {
            var rating = resultSet[i].rating;
            var ratingArr = [1.5, 2.5, 3.5, 4.5];
            var arrNum;

            for (var e = ratingArr.length - 1; e >= 0; e--) {

                if (rating == 5) {
                    arrNum = 4
                }
                else if (ratingArr[e] > rating) {
                    arrNum = e;
                }
            }
            
            switch (arrNum) {
                case 0:
                    html = `<div class="col-md-12" data-aos="fade-up" data-aos-once="true">
                    <div class="col-lg-12 p-0 my-2 user-result shadow" onClick="window.location='/user/` + resultSet[i]._id + `'" >
                        <div class="row col-lg-8 col-12 mx-0 py-4 px-5 user-detail justify-content-center justify-content-lg-start align-items-center d-flex" style="background: rgba(243,243,243,0.1);">
                            <img src="` + resultSet[i].image + `" style="width: 150px; height: 150px;">
                            <div class="caption-result">
                                <p class="mb-0" style="font-size:1.6em; font-weight:600;">` + resultSet[i].username + `</p>
                                <p class="px-3 mt-0 mb-2 text-center" style="font-size:0.9em!important; border-radius:15px; font-weight:400!important; border: 1px solid #4632DA;">CEA ` + resultSet[i].cea + `</p>
                                <a href="/user/` + resultSet[i]._id + `/reviews" style="text-decoration: none; color: black;">
                                    <span>` + resultSet[i].rating.toFixed(2) + `</span>
                                    <span class="fa fa-star checked"></span>
                                    <span class="fa fa-star"></span>
                                    <span class="fa fa-star"></span>
                                    <span class="fa fa-star"></span>
                                    <span class="fa fa-star"></span>
                                </a>
                            </div>
                        </div>
                        <div class="col-lg-4 col-12 m-0 p-0 align-items-center d-flex agent-right" style="background: rgba(170,190,215,0.3);">
                            <div class="col-lg-12 m-0 p-0">
                                <p style="font-size:1em; font-weight:650;" class="mb-2" id="agent-info">Agent Details</p>
                                <div class="contact-row pb-1 align-items-center d-flex">
                                    <ion-icon name="mail-outline" style="font-size:1.4em!important;"></ion-icon>
                                    <li class="email-li">
                                        <a href="mailto:` + resultSet[i].email + `"  style="color: black; font-size: 1em;">
                                        ` + resultSet[i].email + `</a>
                                    </li>
                                </div>
                                <div class="contact-row py-0 align-items-center d-flex">
                                    <ion-icon name="call-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" >` + resultSet[i].phone + `</p>
                                </div>
                                <div class="contact-row py-0 align-items-center d-flex">
                                    <ion-icon name="male-female-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" >` + resultSet[i].gender + `</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
                break;
                case 1:
                    html = `<div class="col-md-12" data-aos="fade-up" data-aos-once="true">
                    <div class="col-lg-12 p-0 my-2 user-result shadow" onClick="window.location='/user/` + resultSet[i]._id + `'" >
                        <div class="row col-lg-8 col-12 mx-0 py-4 px-5 user-detail justify-content-center justify-content-lg-start align-items-center d-flex" style="background: rgba(243,243,243,0.1);">
                            <img src="` + resultSet[i].image + `" style="width: 150px; height: 150px;">
                            <div class="caption-result">
                                <p class="mb-0" style="font-size:1.6em; font-weight:600;">` + resultSet[i].username + `</p>
                                <p class="px-3 mt-0 mb-2 text-center" style="font-size:0.9em!important; border-radius:15px; font-weight:400!important; border: 1px solid #4632DA;">CEA ` + resultSet[i].cea + `</p>
                                <a href="/user/` + resultSet[i]._id + `/reviews" style="text-decoration: none; color: black;">
                                    <span>` + resultSet[i].rating.toFixed(2) + `</span>
                                    <span class="fa fa-star checked"></span>
                                    <span class="fa fa-star checked"></span>
                                    <span class="fa fa-star"></span>
                                    <span class="fa fa-star"></span>
                                    <span class="fa fa-star"></span>
                                </a>
                            </div>
                        </div>
                        <div class="col-lg-4 col-12 m-0 p-0 align-items-center d-flex agent-right" style="background: rgba(170,190,215,0.3);">
                            <div class="col-lg-12 m-0 p-0">
                                <p style="font-size:1em; font-weight:650;" class="mb-2" id="agent-info">Agent Details</p>
                                <div class="contact-row pb-1 align-items-center d-flex">
                                    <ion-icon name="mail-outline" style="font-size:1.4em!important;"></ion-icon>
                                    <li class="email-li">
                                        <a href="mailto:` + resultSet[i].email + `"  style="color: black; font-size: 1em;">
                                        ` + resultSet[i].email + `</a>
                                    </li>
                                </div>
                                <div class="contact-row py-0 align-items-center d-flex">
                                    <ion-icon name="call-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" >` + resultSet[i].phone + `</p>
                                </div>
                                <div class="contact-row py-0 align-items-center d-flex">
                                    <ion-icon name="male-female-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" >` + resultSet[i].gender + `</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
                break;
                case 2:
                    html = `<div class="col-md-12" data-aos="fade-up" data-aos-once="true">
                    <div class="col-lg-12 p-0 my-2 user-result shadow" onClick="window.location='/user/` + resultSet[i]._id + `'" >
                        <div class="row col-lg-8 col-12 mx-0 py-4 px-5 user-detail justify-content-center justify-content-lg-start align-items-center d-flex" style="background: rgba(243,243,243,0.1);">
                            <img src="` + resultSet[i].image + `" style="width: 150px; height: 150px;">
                            <div class="caption-result">
                                <p class="mb-0" style="font-size:1.6em; font-weight:600;">` + resultSet[i].username + `</p>
                                <p class="px-3 mt-0 mb-2 text-center" style="font-size:0.9em!important; border-radius:15px; font-weight:400!important; border: 1px solid #4632DA;">CEA ` + resultSet[i].cea + `</p>
                                <a href="/user/` + resultSet[i]._id + `/reviews" style="text-decoration: none; color: black;">
                                    <span>` + resultSet[i].rating.toFixed(2) + `</span>
                                    <span class="fa fa-star checked"></span>
                                    <span class="fa fa-star checked"></span>
                                    <span class="fa fa-star checked"></span>
                                    <span class="fa fa-star"></span>
                                    <span class="fa fa-star"></span>
                                </a>
                            </div>
                        </div>
                        <div class="col-lg-4 col-12 m-0 p-0 align-items-center d-flex agent-right" style="background: rgba(170,190,215,0.3);">
                            <div class="col-lg-12 m-0 p-0">
                                <p style="font-size:1em; font-weight:650;" class="mb-2" id="agent-info">Agent Details</p>
                                <div class="contact-row pb-1 align-items-center d-flex">
                                    <ion-icon name="mail-outline" style="font-size:1.4em!important;"></ion-icon>
                                    <li class="email-li">
                                        <a href="mailto:` + resultSet[i].email + `"  style="color: black; font-size: 1em;">
                                        ` + resultSet[i].email + `</a>
                                    </li>
                                </div>
                                <div class="contact-row py-0 align-items-center d-flex">
                                    <ion-icon name="call-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" >` + resultSet[i].phone + `</p>
                                </div>
                                <div class="contact-row py-0 align-items-center d-flex">
                                    <ion-icon name="male-female-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" >` + resultSet[i].gender + `</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
                break;
                case 3:
                    html = `<div class="col-md-12" data-aos="fade-up" data-aos-once="true">
                    <div class="col-lg-12 p-0 my-2 user-result shadow" onClick="window.location='/user/` + resultSet[i]._id + `'" >
                        <div class="row col-lg-8 col-12 mx-0 py-4 px-5 user-detail justify-content-center justify-content-lg-start align-items-center d-flex" style="background: rgba(243,243,243,0.1);">
                            <img src="` + resultSet[i].image + `" style="width: 150px; height: 150px;">
                            <div class="caption-result">
                                <p class="mb-0" style="font-size:1.6em; font-weight:600;">` + resultSet[i].username + `</p>
                                <p class="px-3 mt-0 mb-2 text-center" style="font-size:0.9em!important; border-radius:15px; font-weight:400!important; border: 1px solid #4632DA;">CEA ` + resultSet[i].cea + `</p>
                                <a href="/user/` + resultSet[i]._id + `/reviews" style="text-decoration: none; color: black;">
                                    <span>` + resultSet[i].rating.toFixed(2) + `</span>
                                    <span class="fa fa-star checked"></span>
                                    <span class="fa fa-star checked"></span>
                                    <span class="fa fa-star checked"></span>
                                    <span class="fa fa-star checked"></span>
                                    <span class="fa fa-star"></span>
                                </a>
                            </div>
                        </div>
                        <div class="col-lg-4 col-12 m-0 p-0 align-items-center d-flex agent-right" style="background: rgba(170,190,215,0.3);">
                            <div class="col-lg-12 m-0 p-0">
                                <p style="font-size:1em; font-weight:650;" class="mb-2" id="agent-info">Agent Details</p>
                                <div class="contact-row pb-1 align-items-center d-flex">
                                    <ion-icon name="mail-outline" style="font-size:1.4em!important;"></ion-icon>
                                    <li class="email-li">
                                        <a href="mailto:` + resultSet[i].email + `"  style="color: black; font-size: 1em;">
                                        ` + resultSet[i].email + `</a>
                                    </li>
                                </div>
                                <div class="contact-row py-0 align-items-center d-flex">
                                    <ion-icon name="call-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" >` + resultSet[i].phone + `</p>
                                </div>
                                <div class="contact-row py-0 align-items-center d-flex">
                                    <ion-icon name="male-female-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" >` + resultSet[i].gender + `</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
                break;
                case 4:
                    html = `<div class="col-md-12" data-aos="fade-up" data-aos-once="true">
                                <div class="col-lg-12 p-0 my-2 user-result shadow" onClick="window.location='/user/` + resultSet[i]._id + `'" >
                                    <div class="row col-lg-8 col-12 mx-0 py-4 px-5 user-detail justify-content-center justify-content-lg-start align-items-center d-flex" style="background: rgba(243,243,243,0.1);">
                                        <img src="` + resultSet[i].image + `" style="width: 150px; height: 150px;">
                                        <div class="caption-result">
                                            <p class="mb-0" style="font-size:1.6em; font-weight:600;">` + resultSet[i].username + `</p>
                                            <p class="px-3 mt-0 mb-2 text-center" style="font-size:0.9em!important; border-radius:15px; font-weight:400!important; border: 1px solid #4632DA;">CEA ` + resultSet[i].cea + `</p>
                                            <a href="/user/` + resultSet[i]._id + `/reviews" style="text-decoration: none; color: black;">
                                                <span>` + resultSet[i].rating.toFixed(2) + `</span>
                                                <span class="fa fa-star checked"></span>
                                                <span class="fa fa-star checked"></span>
                                                <span class="fa fa-star checked"></span>
                                                <span class="fa fa-star checked"></span>
                                                <span class="fa fa-star checked"></span>
                                            </a>
                                        </div>
                                    </div>
                                    <div class="col-lg-4 col-12 m-0 p-0 align-items-center d-flex agent-right" style="background: rgba(170,190,215,0.3);">
                                        <div class="col-lg-12 m-0 p-0">
                                            <p style="font-size:1em; font-weight:650;" class="mb-2" id="agent-info">Agent Details</p>
                                            <div class="contact-row pb-1 align-items-center d-flex">
                                                <ion-icon name="mail-outline" style="font-size:1.4em!important;"></ion-icon>
                                                <li class="email-li">
                                                    <a href="mailto:` + resultSet[i].email + `"  style="color: black; font-size: 1em;">
                                                    ` + resultSet[i].email + `</a>
                                                </li>
                                            </div>
                                            <div class="contact-row py-0 align-items-center d-flex">
                                                <ion-icon name="call-outline" style="font-size:1.3em;"></ion-icon>
                                                <p style="font-size:1em;" >` + resultSet[i].phone + `</p>
                                            </div>
                                            <div class="contact-row py-0 align-items-center d-flex">
                                                <ion-icon name="male-female-outline" style="font-size:1.3em;"></ion-icon>
                                                <p style="font-size:1em;" >` + resultSet[i].gender + `</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>`
                break;
                default:
                    html = `<div class="col-md-12" data-aos="fade-up" data-aos-once="true">
                    <div class="col-lg-12 p-0 my-2 user-result shadow" onClick="window.location='/user/` + resultSet[i]._id + `'" >
                        <div class="row col-lg-8 col-12 mx-0 py-4 px-5 user-detail justify-content-center justify-content-lg-start align-items-center d-flex" style="background: rgba(243,243,243,0.1);">
                            <img src="` + resultSet[i].image + `" style="width: 150px; height: 150px;">
                            <div class="caption-result">
                                <p class="mb-0" style="font-size:1.6em; font-weight:600;">` + resultSet[i].username + `</p>
                                <p class="px-3 mt-0 mb-2 text-center" style="font-size:0.9em!important; border-radius:15px; font-weight:400!important; border: 1px solid #4632DA;">CEA ` + resultSet[i].cea + `</p>
                                <a href="/user/` + resultSet[i]._id + `/reviews" style="text-decoration: none; color: black;">
                                    <span>` + resultSet[i].rating.toFixed(2) + `</span>
                                    <span class="fa fa-star"></span>
                                    <span class="fa fa-star"></span>
                                    <span class="fa fa-star"></span>
                                    <span class="fa fa-star"></span>
                                    <span class="fa fa-star"></span>
                                </a>
                            </div>
                        </div>
                        <div class="col-lg-4 col-12 m-0 p-0 align-items-center d-flex agent-right" style="background: rgba(170,190,215,0.3);">
                            <div class="col-lg-12 m-0 p-0">
                                <p style="font-size:1em; font-weight:650;" class="mb-2" id="agent-info">Agent Details</p>
                                <div class="contact-row pb-1 align-items-center d-flex">
                                    <ion-icon name="mail-outline" style="font-size:1.4em!important;"></ion-icon>
                                    <li class="email-li">
                                        <a href="mailto:` + resultSet[i].email + `"  style="color: black; font-size: 1em;">
                                        ` + resultSet[i].email + `</a>
                                    </li>
                                </div>
                                <div class="contact-row py-0 align-items-center d-flex">
                                    <ion-icon name="call-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" >` + resultSet[i].phone + `</p>
                                </div>
                                <div class="contact-row py-0 align-items-center d-flex">
                                    <ion-icon name="male-female-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" >` + resultSet[i].gender + `</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`                   
            }
        }
        insertDiv.insertAdjacentHTML("beforeend", html);
    }

    //update object
    // var totalRem = loadObj.totalRem;
    // var sectionRem = loadObj.sectionRem;
    // var remainUser = loadObj.remainUser;
    // var startIndex = loadObj.startIndex;
    //if section is not done
    if (sectionRem != 0) {
        //remaining minus 5 (as it has already been loaded)
        loadObj.totalRem = loadObj.totalRem - 5;
        //section minus 1 (as it has already been loaded)
        loadObj.sectionRem = loadObj.sectionRem - 1;
        //remainUser remains the same
        //loadObj[2]
        //end index becomes start index
        loadObj.startIndex = endIndex;
    } else {
        //remaining minus 5 (as it has already been loaded)
        loadObj.totalRem = loadObj.remainUser;
        //section minus 1 (as it has already been loaded)
        loadObj.sectionRem = 0;
        //remainUser remains the same
        //loadObj[2]
        //end index becomes start index
        loadObj.startIndex = endIndex;
    }

    return loadObj;
}

function loadFirstFive(rs) {
    var resultSet = JSON.parse(rs);
    var rsLength = resultSet.length;
    var loadObj;

    //divide into different sections
    var section = Math.floor(parseInt(rsLength,10) / 5); //number of sections (1 section, 5 users)
    var remSect = parseInt(rsLength,10) % 5; //number of users remaining

    var loadObj = {
        "totalRem" : rsLength,
        "sectionRem" : section,
        "remainUser" : remSect,
        "startIndex" : 0,
    }

    loadObj = loadData(rs,loadObj);
    return loadObj;
}