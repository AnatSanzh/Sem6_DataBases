const { detectSpam } = require('./utilities/detect-spam');
const redis = require('redis');
const redisUtils = require('./utilities/redis-utils');

(async function(){
	const port="6379", host="127.0.0.1";
	const client = redis.createClient(port, host);


	try{
		await (new Promise((res, rej) => {
			client.on('connect', res);
			client.on('error', rej);
		}));
	}catch(e){
		console.log("Error: " + e);
		return;
	}
	

	client.on("message", (channel, messageText) => {
		const message = JSON.parse(messageText);

		message.spamProbability = detectSpam(message.text);

		client.publish(redisUtils.getProcessedMessageChannel(), JSON.stringify(message));
	});

	client.subscribe(redisUtils.getUnprocessedMessageChannel());
})();