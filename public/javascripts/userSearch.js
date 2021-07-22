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
            <div class="col-md-12 user-result" onClick="window.location='/user/` + resultSet[i]._id + `'" style="border-top: 0.5px solid lightgray;">
                <div class="row col-md-8 col-6 m-0 py-4 px-5 user-detail align-items-center d-flex">
                    <img src="` + resultSet[i].image + `" style="width: 150px; height: 150px;">
                    <div class="caption-result">
                        <p class="mb-0" style="font-size:1.6em; font-weight:600;">` + resultSet[i].firstName + ` ` + resultSet[i].lastName + `</p>
                        <p class="px-3 mt-0 mb-2" style="font-size:0.9em!important; border-radius:15px; font-weight:400!important; border: 1px solid #4632DA;">CEA ` + resultSet[i].cea + `</p>
                        <em>No reviews found.</em>
                    </div>
                </div>
                <div class="col-md-4 col-6 m-0 py-4 px-5 align-items-center d-flex">
                    <div class="col-md-12">
                        <p style="font-size:1em; font-weight:650;" class="mb-3">Agent Details</p>
                        <div class="contact-row pb-1">
                            <ion-icon name="mail-outline" style="font-size:1.3em;"></ion-icon>
                            <a href="mailto:` + resultSet[i].email + `" class="pl-4" style="color: black; font-size: 1em;">
                            ` + resultSet[i].email + `</a>
                        </div>
                        <div class="contact-row pb-1">
                            <ion-icon name="call-outline" style="font-size:1.3em;"></ion-icon>
                            <p style="font-size:1em;" class="pl-4">` + resultSet[i].phone + `</p>
                        </div>
                        <div class="contact-row pb-1">
                            <ion-icon name="male-female-outline" style="font-size:1.3em;"></ion-icon>
                            <p style="font-size:1em;" class="pl-4">` + resultSet[i].gender + `</p>
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
                    <div class="col-md-12 user-result" onClick="window.location='/user/` + resultSet[i]._id + `'" style="border-top: 0.5px solid lightgray;">
                        <div class="row col-md-8 col-6 m-0 py-4 px-5 user-detail align-items-center d-flex">
                            <img src="` + resultSet[i].image + `" style="width: 150px; height: 150px;">
                            <div class="caption-result">
                                <p class="mb-0" style="font-size:1.6em; font-weight:600;">` + resultSet[i].firstName + ` ` + resultSet[i].lastName + `</p>
                                <p class="px-3 mt-0 mb-2" style="font-size:0.9em!important; border-radius:15px; font-weight:400!important; border: 1px solid #4632DA;">CEA ` + resultSet[i].cea + `</p>
                                <span class="fa fa-star checked"></span>
                                <span class="fa fa-star"></span>
                                <span class="fa fa-star"></span>
                                <span class="fa fa-star"></span>
                                <span class="fa fa-star"></span>
                            </div>
                        </div>
                        <div class="col-md-4 col-6 m-0 py-4 px-5 align-items-center d-flex">
                            <div class="col-md-12">
                                <p style="font-size:1em; font-weight:650;" class="mb-3">Agent Details</p>
                                <div class="contact-row pb-1">
                                    <ion-icon name="mail-outline" style="font-size:1.3em;"></ion-icon>
                                    <a href="mailto:` + resultSet[i].email + `" class="pl-4" style="color: black; font-size: 1em;">
                                    ` + resultSet[i].email + `</a>
                                </div>
                                <div class="contact-row pb-1">
                                    <ion-icon name="call-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" class="pl-4">` + resultSet[i].phone + `</p>
                                </div>
                                <div class="contact-row pb-1">
                                    <ion-icon name="male-female-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" class="pl-4">` + resultSet[i].gender + `</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
                break;
                case 1:
                    html = `<div class="col-md-12" data-aos="fade-up" data-aos-once="true">
                    <div class="col-md-12 user-result" onClick="window.location='/user/` + resultSet[i]._id + `'" style="border-top: 0.5px solid lightgray;">
                        <div class="row col-md-8 col-6 m-0 py-4 px-5 user-detail align-items-center d-flex">
                            <img src="` + resultSet[i].image + `" style="width: 150px; height: 150px;">
                            <div class="caption-result">
                                <p class="mb-0" style="font-size:1.6em; font-weight:600;">` + resultSet[i].firstName + ` ` + resultSet[i].lastName + `</p>
                                <p class="px-3 mt-0 mb-2" style="font-size:0.9em!important; border-radius:15px; font-weight:400!important; border: 1px solid #4632DA;">CEA ` + resultSet[i].cea + `</p>
                                <span class="fa fa-star checked"></span>
                                <span class="fa fa-star checked"></span>
                                <span class="fa fa-star"></span>
                                <span class="fa fa-star"></span>
                                <span class="fa fa-star"></span>
                            </div>
                        </div>
                        <div class="col-md-4 col-6 m-0 py-4 px-5 align-items-center d-flex">
                            <div class="col-md-12">
                                <p style="font-size:1em; font-weight:650;" class="mb-3">Agent Details</p>
                                <div class="contact-row pb-1">
                                    <ion-icon name="mail-outline" style="font-size:1.3em;"></ion-icon>
                                    <a href="mailto:` + resultSet[i].email + `" class="pl-4" style="color: black; font-size: 1em;">
                                    ` + resultSet[i].email + `</a>
                                </div>
                                <div class="contact-row pb-1">
                                    <ion-icon name="call-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" class="pl-4">` + resultSet[i].phone + `</p>
                                </div>
                                <div class="contact-row pb-1">
                                    <ion-icon name="male-female-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" class="pl-4">` + resultSet[i].gender + `</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
                break;
                case 2:
                    html = `<div class="col-md-12" data-aos="fade-up" data-aos-once="true">
                    <div class="col-md-12 user-result" onClick="window.location='/user/` + resultSet[i]._id + `'" style="border-top: 0.5px solid lightgray;">
                        <div class="row col-md-8 col-6 m-0 py-4 px-5 user-detail align-items-center d-flex">
                            <img src="` + resultSet[i].image + `" style="width: 150px; height: 150px;">
                            <div class="caption-result">
                                <p class="mb-0" style="font-size:1.6em; font-weight:600;">` + resultSet[i].firstName + ` ` + resultSet[i].lastName + `</p>
                                <p class="px-3 mt-0 mb-2" style="font-size:0.9em!important; border-radius:15px; font-weight:400!important; border: 1px solid #4632DA;">CEA ` + resultSet[i].cea + `</p>
                                <span class="fa fa-star checked"></span>
                                <span class="fa fa-star checked"></span>
                                <span class="fa fa-star checked"></span>
                                <span class="fa fa-star"></span>
                                <span class="fa fa-star"></span>
                            </div>
                        </div>
                        <div class="col-md-4 col-6 m-0 py-4 px-5 align-items-center d-flex">
                            <div class="col-md-12">
                                <p style="font-size:1em; font-weight:650;" class="mb-3">Agent Details</p>
                                <div class="contact-row pb-1">
                                    <ion-icon name="mail-outline" style="font-size:1.3em;"></ion-icon>
                                    <a href="mailto:` + resultSet[i].email + `" class="pl-4" style="color: black; font-size: 1em;">
                                    ` + resultSet[i].email + `</a>
                                </div>
                                <div class="contact-row pb-1">
                                    <ion-icon name="call-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" class="pl-4">` + resultSet[i].phone + `</p>
                                </div>
                                <div class="contact-row pb-1">
                                    <ion-icon name="male-female-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" class="pl-4">` + resultSet[i].gender + `</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
                break;
                case 3:
                    html = `<div class="col-md-12" data-aos="fade-up" data-aos-once="true">
                    <div class="col-md-12 user-result" onClick="window.location='/user/` + resultSet[i]._id + `'" style="border-top: 0.5px solid lightgray;">
                        <div class="row col-md-8 col-6 m-0 py-4 px-5 user-detail align-items-center d-flex">
                            <img src="` + resultSet[i].image + `" style="width: 150px; height: 150px;">
                            <div class="caption-result">
                                <p class="mb-0" style="font-size:1.6em; font-weight:600;">` + resultSet[i].firstName + ` ` + resultSet[i].lastName + `</p>
                                <p class="px-3 mt-0 mb-2" style="font-size:0.9em!important; border-radius:15px; font-weight:400!important; border: 1px solid #4632DA;">CEA ` + resultSet[i].cea + `</p>
                                <span class="fa fa-star checked"></span>
                                <span class="fa fa-star checked"></span>
                                <span class="fa fa-star checked"></span>
                                <span class="fa fa-star checked"></span>
                                <span class="fa fa-star"></span>
                            </div>
                        </div>
                        <div class="col-md-4 col-6 m-0 py-4 px-5 align-items-center d-flex">
                            <div class="col-md-12">
                                <p style="font-size:1em; font-weight:650;" class="mb-3">Agent Details</p>
                                <div class="contact-row pb-1">
                                    <ion-icon name="mail-outline" style="font-size:1.3em;"></ion-icon>
                                    <a href="mailto:` + resultSet[i].email + `" class="pl-4" style="color: black; font-size: 1em;">
                                    ` + resultSet[i].email + `</a>
                                </div>
                                <div class="contact-row pb-1">
                                    <ion-icon name="call-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" class="pl-4">` + resultSet[i].phone + `</p>
                                </div>
                                <div class="contact-row pb-1">
                                    <ion-icon name="male-female-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" class="pl-4">` + resultSet[i].gender + `</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
                break;
                case 4:
                    html = `<div class="col-md-12" data-aos="fade-up" data-aos-once="true">
                                <div class="col-md-12 user-result" onClick="window.location='/user/` + resultSet[i]._id + `'" style="border-top: 0.5px solid lightgray;">
                                    <div class="row col-md-8 col-6 m-0 py-4 px-5 user-detail align-items-center d-flex">
                                        <img src="` + resultSet[i].image + `" style="width: 150px; height: 150px;">
                                        <div class="caption-result">
                                            <p class="mb-0" style="font-size:1.6em; font-weight:600;">` + resultSet[i].firstName + ` ` + resultSet[i].lastName + `</p>
                                            <p class="px-3 mt-0 mb-2" style="font-size:0.9em!important; border-radius:15px; font-weight:400!important; border: 1px solid #4632DA;">CEA ` + resultSet[i].cea + `</p>
                                            <span class="fa fa-star checked"></span>
                                            <span class="fa fa-star checked"></span>
                                            <span class="fa fa-star checked"></span>
                                            <span class="fa fa-star checked"></span>
                                            <span class="fa fa-star checked"></span>
                                        </div>
                                    </div>
                                    <div class="col-md-4 col-6 m-0 py-4 px-5 align-items-center d-flex">
                                        <div class="col-md-12">
                                            <p style="font-size:1em; font-weight:650;" class="mb-3">Agent Details</p>
                                            <div class="contact-row pb-1">
                                                <ion-icon name="mail-outline" style="font-size:1.3em;"></ion-icon>
                                                <a href="mailto:` + resultSet[i].email + `" class="pl-4" style="color: black; font-size: 1em;">
                                                ` + resultSet[i].email + `</a>
                                            </div>
                                            <div class="contact-row pb-1">
                                                <ion-icon name="call-outline" style="font-size:1.3em;"></ion-icon>
                                                <p style="font-size:1em;" class="pl-4">` + resultSet[i].phone + `</p>
                                            </div>
                                            <div class="contact-row pb-1">
                                                <ion-icon name="male-female-outline" style="font-size:1.3em;"></ion-icon>
                                                <p style="font-size:1em;" class="pl-4">` + resultSet[i].gender + `</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>`
                break;
                default:
                    html = `<div class="col-md-12" data-aos="fade-up" data-aos-once="true">
                    <div class="col-md-12 user-result" onClick="window.location='/user/` + resultSet[i]._id + `'" style="border-top: 0.5px solid lightgray;">
                        <div class="row col-md-8 col-6 m-0 py-4 px-5 user-detail align-items-center d-flex">
                            <img src="` + resultSet[i].image + `" style="width: 150px; height: 150px;">
                            <div class="caption-result">
                                <p class="mb-0" style="font-size:1.6em; font-weight:600;">` + resultSet[i].firstName + ` ` + resultSet[i].lastName + `</p>
                                <p class="px-3 mt-0 mb-2" style="font-size:0.9em!important; border-radius:15px; font-weight:400!important; border: 1px solid #4632DA;">CEA ` + resultSet[i].cea + `</p>
                                <span class="fa fa-star"></span>
                                <span class="fa fa-star"></span>
                                <span class="fa fa-star"></span>
                                <span class="fa fa-star"></span>
                                <span class="fa fa-star"></span>
                            </div>
                        </div>
                        <div class="col-md-4 col-6 m-0 py-4 px-5 align-items-center d-flex">
                            <div class="col-md-12">
                                <p style="font-size:1em; font-weight:650;" class="mb-3">Agent Details</p>
                                <div class="contact-row pb-1">
                                    <ion-icon name="mail-outline" style="font-size:1.3em;"></ion-icon>
                                    <a href="mailto:` + resultSet[i].email + `" class="pl-4" style="color: black; font-size: 1em;">
                                    ` + resultSet[i].email + `</a>
                                </div>
                                <div class="contact-row pb-1">
                                    <ion-icon name="call-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" class="pl-4">` + resultSet[i].phone + `</p>
                                </div>
                                <div class="contact-row pb-1">
                                    <ion-icon name="male-female-outline" style="font-size:1.3em;"></ion-icon>
                                    <p style="font-size:1em;" class="pl-4">` + resultSet[i].gender + `</p>
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