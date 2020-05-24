module.exports = function (question) {
    process.stdin.resume();
    process.stdout.write(question);

    return new Promise((res) => {
    	process.stdin.once('data', function (data) {
	        res(data.toString().trim());
	    });
    });
}