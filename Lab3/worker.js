//const { detectSpam } = require('./utilities/detect-spam');
const redis = require('redis');
const redisUtils = require('./utilities/redis-utils');
const terminalTitle = require('./utilities/terminal-title');
const neo4jUtils = require('./utilities/neo4j-utils');


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
	const clientPub = await redisUtils.getClient(redis, host, port),
		  clientSub = await redisUtils.getClient(redis, host, port);

	const session = neo4jUtils.getNeo4jDriver().session();


	terminalTitle("Worker");

	clientSub.on("message", async (channel, messageId) => {
		const message = await redisUtils.getHM(clientPub, messageId);


		await redisUtils.setHM(clientPub, messageId, {
			status: redisUtils.getMessageStatuses()[2]
		});

		//message.spamProbability = detectSpam(message.text);
		await sleep(getRandomArbitrary(3,5));
		const spamDetected = Math.random() > 0.75;
		
		clientPub.publish(redisUtils.getProcessedMessageChannel(), JSON.stringify({
			id: messageId,
			spam: spamDetected,
			to: message.to,
			from: message.from
		}));

		await neo4jUtils.createSpamAlert(session, messageId);
		await neo4jUtils.createMessage(session, message.from, message.to, message.text, messageId, spamDetected, message.tags);
	});

	clientSub.subscribe(redisUtils.getUnprocessedMessageChannel());
})();