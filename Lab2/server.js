const redis = require('redis');
const redisUtils = require('./utilities/redis-utils');
const terminalTitle = require('./utilities/terminal-title');


(async function(){
	const port="6379", host="127.0.0.1";
	const clientPub = await redisUtils.getClient(redis, host, port),
	clientSub = await redisUtils.getClient(redis, host, port);

	terminalTitle("Server");

	clientSub.on("message",async (channel, messageText) => {
		const message = JSON.parse(messageText);

		if(channel === redisUtils.getProcessedMessageChannel()){
			await redisUtils.setHM(clientPub, message.id, {
				status: redisUtils.getMessageStatuses()[
					(message.spam === true)? 3 : 4
				]
			});

			message.date = new Date();
			message.type = "spam";

			if(message.spam === true){
				await redisUtils.incrValueSortedList(clientPub, redisUtils.getSpammerListKey(), message.from, 1);
				await redisUtils.addList(clientPub, redisUtils.getEventJournalKey(), JSON.stringify(message));
			}


			await redisUtils.addList(
				clientPub,
				redisUtils.getReceivedMessageIDListKey(message.to), 
				message.id
			);
		}else if(channel === redisUtils.getRawActionChannel()){
			message.date = new Date();

			if(message.type !== "message")
				await redisUtils.addList(clientPub, redisUtils.getEventJournalKey(), JSON.stringify(message));

			if(message.type === "message"){
				await redisUtils.setHM(clientPub, message.id, {
					status: redisUtils.getMessageStatuses()[1]
				});

				clientPub.publish(redisUtils.getUnprocessedMessageChannel(), message.id);
			}else if(message.type === "login"){
				await redisUtils.addSet(clientPub, redisUtils.getOnlineUsersKey(), message.from);
			}else if(message.type === "logout"){
				await redisUtils.removeSet(clientPub, redisUtils.getOnlineUsersKey(), message.from);
			}
		}
	});

	clientSub.subscribe(redisUtils.getRawActionChannel());
	clientSub.subscribe(redisUtils.getProcessedMessageChannel());
})();