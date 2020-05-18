const https = require('https');

const url = "https://translate.google.com.ua/translate?sl=auto&tl=en&u=http%3A%2F%2Fncode.syosetu.com%2Fn4698cv%2F253%2F";

https.get(url, function(res) {
	let result = "";

    res.setEncoding("utf8");
    res.on("data", function (chunk) {
        result += chunk;
    });

    res.on("end", function () {
        console.log(result);
    });
});