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


	client.on("message",async (channel, messageText) => {
		const message = JSON.parse(messageText);

		if(channel === redisUtils.getProcessedMessageChannel()){
			await redisUtils.setHM(client, message.id, {
				status: redisUtils.getMessageStatuses()[
					(message.spam === true)? 3 : 4
				]
			});

			message.date = new Date();
			message.type = "spam";

			if(message.spam === true){
				await redisUtils.incrValueSortedList(client, redisUtils.getSpammerListKey(), message.from, 1);
				await redisUtils.addList(client, redisUtils.getEventJournalKey(), JSON.stringify(message));
			}


			await redisUtils.addList(
				client,
				redisUtils.getReceivedMessageIDListKey(message.to), 
				message.id
			);
		}else if(channel === redisUtils.getRawActionChannel()){
			message.date = new Date();

			if(message.type !== "message")
				await redisUtils.addList(client, redisUtils.getEventJournalKey(), JSON.stringify(message));

			if(message.type === "message"){
				await redisUtils.setHM(client, message.id, {
					status: redisUtils.getMessageStatuses()[1]
				});

				client.publish(redisUtils.getUnprocessedMessageChannel(), message.id);
			}else if(message.type === "login"){
				await redisUtils.addSet(client, redisUtils.getOnlineUsersKey(), message.from);
			}else if(message.type === "logout"){
				await redisUtils.removeSet(client, redisUtils.getOnlineUsersKey(), message.from);
			}
		}
	});

	client.subscribe(redisUtils.getRawActionChannel());
	client.subscribe(redisUtils.getProcessedMessageChannel());
})();