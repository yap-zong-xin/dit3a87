function loadData(rs) {
    var resultSet = JSON.parse(rs);
    var insertDiv = document.getElementById("resultDiv");

    for (var i = 0; i < resultSet.length; i++) {
        var html;
        if (resultSet[i].rating === 0) {
            html = `<div class="col-md-12">
                            <div class="user-result" onClick="window.location='/user/` + resultSet[i]._id + `'">
                                <img src="` + resultSet[i].image + `" style="width : 200px; height: 200px;">
                                <div class="caption-result">
                                    <h4>`+ resultSet[i].firstName + ` ` + resultSet[i].lastName + `</h4>
                                    <h6>CEA: ` + resultSet[i].cea + `</h6>
                                    <em>No reviews found.</em>
                                </div>
                            </div> 
                        </div>`
        } else {
            var rating = resultSet[i].rating;
            var ratingArr = [1.5, 2.5, 3.5, 4.5];
            var arrNum;
            for (var e = 0; e < ratingArr.length; e++) {
                var rDiff = ratingArr[i] - rating;

                if (rDiff < 0) {
                    arrNum = e;
                }

            }
            switch (arrNum) {
                case 0:
                    html = `<div class="col-md-12">
                                <div class="user-result" onClick="window.location='/user/` + resultSet[i]._id + `'">
                                    <img src="` + resultSet[i].image + `" style="width : 200px; height: 200px;">
                                    <div class="caption-result">
                                        <h4>`+ resultSet[i].firstName +` ` + resultSet[i].lastName +`</h4>
                                        <h6>CEA: ` + resultSet[i].cea +`</h6>
                                        <span class="fa fa-star checked"></span>
                                        <span class="fa fa-star"></span>
                                        <span class="fa fa-star"></span>
                                        <span class="fa fa-star"></span>
                                        <span class="fa fa-star"></span>
                                    </div>
                                </div> 
                            </div>`
                break;
                case 1:
                    html = `<div class="col-md-12">
                                    <div class="user-result" onClick="window.location='/user/` + resultSet[i]._id + `'">
                                        <img src="` + resultSet[i].image + `" style="width : 200px; height: 200px;">
                                        <div class="caption-result">
                                            <h4>`+ resultSet[i].firstName +` ` + resultSet[i].lastName +`</h4>
                                            <h6>CEA: ` + resultSet[i].cea +`</h6>
                                            <span class="fa fa-star checked"></span>
                                            <span class="fa fa-star checked"></span>
                                            <span class="fa fa-star"></span>
                                            <span class="fa fa-star"></span>
                                            <span class="fa fa-star"></span>
                                        </div>
                                    </div> 
                                </div>`
                break;
                case 2:
                    html = `<div class="col-md-12">
                                <div class="user-result" onClick="window.location='/user/` + resultSet[i]._id + `'">
                                    <img src="` + resultSet[i].image + `" style="width : 200px; height: 200px;">
                                    <div class="caption-result">
                                        <h4>`+ resultSet[i].firstName +` ` + resultSet[i].lastName +`</h4>
                                        <h6>CEA: ` + resultSet[i].cea +`</h6>
                                        <span class="fa fa-star checked"></span>
                                        <span class="fa fa-star checked"></span>
                                        <span class="fa fa-star checked"></span>
                                        <span class="fa fa-star"></span>
                                        <span class="fa fa-star"></span>
                                    </div>
                                </div> 
                            </div>`
                break;
                case 3:
                    html = `<div class="col-md-12">
                                <div class="user-result" onClick="window.location='/user/` + resultSet[i]._id + `'">
                                    <img src="` + resultSet[i].image + `" style="width : 200px; height: 200px;">
                                    <div class="caption-result">
                                        <h4>`+ resultSet[i].firstName +` ` + resultSet[i].lastName +`</h4>
                                        <h6>CEA: ` + resultSet[i].cea +`</h6>
                                        <span class="fa fa-star checked"></span>
                                        <span class="fa fa-star checked"></span>
                                        <span class="fa fa-star checked"></span>
                                        <span class="fa fa-star checked"></span>
                                        <span class="fa fa-star"></span>
                                    </div>
                                </div> 
                            </div>`
                break;
                case 4:
                    html = `<div class="col-md-12">
                                <div class="user-result" onClick="window.location='/user/` + resultSet[i]._id + `'">
                                    <img src="` + resultSet[i].image + `" style="width : 200px; height: 200px;">
                                    <div class="caption-result">
                                        <h4>`+ resultSet[i].firstName +` ` + resultSet[i].lastName +`</h4>
                                        <h6>CEA: ` + resultSet[i].cea +`</h6>
                                        <span class="fa fa-star checked"></span>
                                        <span class="fa fa-star checked"></span>
                                        <span class="fa fa-star checked"></span>
                                        <span class="fa fa-star checked"></span>
                                        <span class="fa fa-star checked"></span>
                                    </div>
                                </div> 
                            </div>`
                break;
                default:
                    html = `<div class="col-md-12">
                        <div class="user-result" onClick="window.location='/user/` + resultSet[i]._id + `'">
                            <img src="` + resultSet[i].image + `" style="width : 200px; height: 200px;">
                            <div class="caption-result">
                                <h4>`+ resultSet[i].firstName +` ` + resultSet[i].lastName +`</h4>
                                <h6>CEA: ` + resultSet[i].cea +`</h6>
                                <span class="fa fa-star checked"></span>
                                <span class="fa fa-star"></span>
                                <span class="fa fa-star"></span>
                                <span class="fa fa-star"></span>
                                <span class="fa fa-star"></span>
                            </div>
                        </div> 
                    </div>`                    
            }
        }
        insertDiv.insertAdjacentHTML("beforebegin", html);
    }
}

function scrollData (rs) {
    let options = {
        root: null,
        rootMargins: "0px",
        threshold: 0.5
    };
    const observer = new IntersectionObserver(handleIntersect, options);
    observer.observe(document.querySelector("footer"));

    function handleIntersect(entries) {
        if(entries[0].isIntersecting) {
            console.log("hi")
        }
    }
}