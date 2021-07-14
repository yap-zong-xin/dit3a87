// const axios = require('axios');

async function countApi(url) {

	const host = "https://api.countapi.xyz"
	try {
	  return await axios.get(host + url);
	} catch (err) {
	  return console.log("err", err);
	}
}

async function getClickRate(url) {
  // console.log(url);
  var arrStr = [];

  async function getShow(url) {
    var result;
    result = await countApi("/get/3dpropertylistingsg/" + url)
    .then(success => {
      try {
        value = success.data.value
      } catch (e) {
        value = 0;
      }
      return value
      //return success.data.value;
    })
    
    return result;
  }
  
  async function getShow2(url) {
    var result;
    result = await countApi("/get/3dpropertylistingsg/" + url + "-click")
    .then(success => {
      var value;
        try {
          value = success.data.value
        } catch (e) {
          value = 0;
        }
        return value;
    })

    return result;
  }

  async function clickRateCalc() {
    var e = await getShow(url)
    var f = await getShow2(url)

    var rateArr = [url,e,f];
    var obj;

    arrStr.push(rateArr);
      //calculate clickrate
      arrStr.forEach(function(item, i) {
        var id = arrStr[i][0];
        var clickCount = arrStr[i][1];
        var shownCount = arrStr[i][2]
        var clickRateStr = Math.round((clickCount/shownCount) * 100) + "%";

        obj = {
          "id" : id,
          "click" : clickCount,
          "shown" : shownCount,
          "clickRate" : clickRateStr
        }
      })
      // console.log(obj)
      
      //html
      var html = `
        <div class="row pt-2">
          <div class="col-4 text-center" style="border-right:1px solid lightgray;">
            <p>` + obj.shown + `</p>
            <p>Impressions</p>
          </div>
          <div class="col-4 text-center" style="border-right:1px solid lightgray;">
            <p>` + obj.click + `</p>
            <p>Clicks</p>
          </div>
          <div class="col-4 text-center">
            <p>` + obj.clickRate + `</p>
            <p>Click Rate</p>
          </div>
        </div>
      `
      document.getElementById(obj.id).innerHTML = html;
      document.getElementById("loader-"+obj.id).remove();
      return obj;
  }

  result = await clickRateCalc();
}

// module.exports = {
//   getClickRate : getClickRate
// }