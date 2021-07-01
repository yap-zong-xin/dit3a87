// const axios = require('axios');

async function countApi(url) {

	const host = "https://api.countapi.xyz"
	try {
	  return await axios.get(host + url);
	} catch (err) {
	  console.log('myRequest error', err)
	}
}

async function getClickRate(url) {
  console.log(url);
  var arrStr = [];

  async function getShow(url) {
    var result;
    result = await countApi("/get/3dpropertylistingsg/" + url)
    .then(success => {
      return success.data.value;
    })
    return result;
  }
  
  async function getShow2(url) {
    var result;
    result = await countApi("/get/3dpropertylistingsg/" + url + "-click")
    .then(success => {
      return success.data.value;
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
      var html = `<a><b> No. of clicks: `+ obj.click +`</b></a><br>
                  <a><b> No. of times displayed: `+ obj.shown +`</b></a><br>
                  <a><b> Click Rate: `+ obj.clickRate +`</b></a>`

      document.getElementById(obj.id).innerHTML = html;
      return obj;
  }

  result = await clickRateCalc();
}

// module.exports = {
//   getClickRate : getClickRate
// }