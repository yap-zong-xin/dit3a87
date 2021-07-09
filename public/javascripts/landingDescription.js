function updateElement(i, descObj) {
    var descObj = {
        "realExp" : {
            "title" : "Realest Experience.",
            "desc" : "Our 3D Virtual Tour provides a seamless navigating experience for your prospects, with the ability to adjust their view, zoom in or out and embedded texts to understand as much about the property they are viewing in this 3D experience.",
            "img" : ""
        },
        "pandeRoof" : {
            "title" : "Pandemic Roof.",
            "desc" : "With our 3D Virtual Tour, property viewers can enjoy the most immersive experience at the comfort of their own locations, timings and devices they use.",
            "img" : ""
        },
        "suitAll" : {
            "title" : "Suitable for All.",
            "desc" : "Regardless you are a Real Estate Agent, Developer, Architecturer, Interior Designer etc. Our 3D Virtual Tour allows you to showcase your beautiful properties, exhibitions and businesses.",
            "img" : ""
        },
        "highQual" : {
            "title" : "Higher Quality Prospects.",
            "desc" : "Upon enjoying and understanding better what is displayed in the 3D Virtual Tour, the more interested prospects are more likely to contact you to find out more, bringing in more meaningful businesses.",
            "img" : ""
        },
        "live" : {
            "title" : "Live 24/7.",
            "desc" : "Having our 3D Virtual Tour of the space you want to show your audience, you can share with as many prospects at any point in time. This creates more viewership to any space you want to showcase.",
            "img" : ""
        }
    }

    //update title
    document.getElementById("title-insert").innerHTML = descObj[i]["title"];
    //update desc
    document.getElementById("desc-insert").innerHTML = descObj[i]["desc"];
}



