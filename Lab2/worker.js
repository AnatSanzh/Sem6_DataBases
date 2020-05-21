//const { detectSpam } = require('./utilities/detect-spam');
const redis = require('redis');
const redisUtils = require('./utilities/redis-utils');

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

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
	

	client.on("message",async (channel, messageId) => {
		const message = await redisUtils.getHM(client, messageId);

		await redisUtils.setHM(client, message.id, {
			status: redisUtils.getMessageStatuses()[2]
		});

		//message.spamProbability = detectSpam(message.text);
		await sleep(getRandomArbitrary(3,5));
		
		client.publish(redisUtils.getProcessedMessageChannel(), JSON.stringify({
			id: messageId,
			spam: Math.random() > 0.75,
			to: message.to,
			from: message.from
		}));
	});

	client.subscribe(redisUtils.getUnprocessedMessageChannel());
})();