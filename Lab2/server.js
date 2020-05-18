const redis = require('redis');
const redisUtils = require('./utilities/redis-utils');

/*
1.1. Сховище, що містить : дані користувачів, їхні групи (звичайний
користувач та адміністратор), а також повідомлення, що пересилаються
між ними.
1.2. Черга повідомлень, які підлягають перевірці на спам та відправленню
адресату.
1.3. Інструмент Publish/Subscribe для ведення та розсилання журналу
активності користувачів: Вхід/вихід користувача.
*/

/*
обов’язково використати наступні структури даних та інструменти Redis: 
1) List(event journal, message data)
2) Hash(user data)
3) Sorted List(messages from user to user)
4) Set(online users)
5) Pub/Sub(action queue, message queue for spam det(channel raw, channel proc))
*/


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

		if(channel === redisUtils.getProcessedMessageChannel()){
			redisUtils.addList(client, redisUtils.getMessageListKey(message.from, message.to), messageText);
			//;
		}else if(channel === redisUtils.getRawActionChannel()){
			message.date = new Date();

			redisUtils.addList(client, redisUtils.getEventJournalKey(), JSON.stringify(message));

			if(message.type === "message"){
				delete message.type;
				client.publish(redisUtils.getUnprocessedMessageChannel(), JSON.stringify(message));
			}else if(message.type === "login"){

			}else if(message.type === "logout"){

			}
		}
	});

	client.subscribe(redisUtils.getRawActionChannel());
	client.subscribe(redisUtils.getProcessedMessageChannel());
})();