//initialise api
async function countApi(url) {
	const host = "https://api.countapi.xyz"
	try {
		return await axios.get(host + url);
	} catch (err) {
		console.log('myRequest error', err)
	}
}


var myChart = document.getElementById('myChart').getContext('2d');
var liveCount = document.getElementById("liveCount");
var timestampArr = [0, 0, 0, 0, 0];
var counterArr = new Array(5);

//create graph
var massPopChart = new Chart(myChart, {
	type: 'line',
	data: {
		labels: timestampArr,
		datasets: [{
			label: 'Count',
			data: counterArr,
			backgroundColor: 'blue'
		}]
	},
	options: {
		title: {
			display: true,
			text: 'Live View Graph'
		},
		legend: {
			display: 'false'
		}
	}
});


var updateChart = function updateChart(counter) {
	countApi("/get/3dpropertylistingsg/visits").then(success=> {
		//get data
		//y-axis (value)
		var counter = success.data.value;
		//x-axis (current time)
		var timestamp = moment().format('MMMM Do YYYY, h:mm:ss a')
		//populate graph
		massPopChart.data.datasets[0].data.shift();
		massPopChart.data.datasets[0].data.push(counter);
		massPopChart.data.labels.shift();
		massPopChart.data.labels.push(timestamp);
		massPopChart.update();
		console.log("updated");
		liveCount.innerText = counter;
	});
}

//update chart every 5 seconds
setInterval(updateChart,5000);