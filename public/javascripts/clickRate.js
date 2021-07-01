const axios = require('axios');

function getClickRate(listing_id) {
    var shownCount, clickCount, clickRate;
     var clickRateStr ="";

    var arrStr = [0,0,0]
    var id = listing_id;

    async function countApi(url) {
        const host = "https://api.countapi.xyz"
        try {
          return await axios.get(host + url);
        } catch (err) {
          console.log('myRequest error', err)
        }
    }
      

}

module.exports = {
  getClickRate : getClickRate
}