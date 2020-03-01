const https = require('https');
const http = require('http');

module.exports = (url) => new Promise((acc, rej) => {
	(url.indexOf("https") == 0 ? https : http)
	.get(url, function(res) {
		let result = "";

	    res.setEncoding("utf8");
	    res.on("data", function (chunk) {
	        result += chunk;
	    });

	    res.on("end", function () {
	        acc(result);
	    });

	    res.on("error", function (err) {
	        rej(err);
	    });
	});
});
