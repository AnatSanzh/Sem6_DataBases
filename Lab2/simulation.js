const prompt = require('./utilities/prompt');
const redis = require('redis');
const redisUtils = require('./utilities/redis-utils');
const uuid = require('uuid');
const terminalTitle = require('./utilities/terminal-title');



function userLogin(client,login){
	client.publish(redisUtils.getRawActionChannel(), JSON.stringify({
		type: "login",
		from: login
	}));
	console.log("User \""+login+"\" login'ed");
}

function userLogout(client,login){
	client.publish(redisUtils.getRawActionChannel(), JSON.stringify({
		type: "logout",
		from: login
	}));
	console.log("User \""+login+"\" logout'ed");
}

async function userRead(client,login){
	const indexHolderKey = redisUtils.getCurrentReceivedMessageIDIndexKey(login);
	let listIndex = await redisUtils.getString(client, indexHolderKey);
	let message, messageKey;

	while(true){
		messageKey = (await redisUtils.getList(
			client,
			redisUtils.getReceivedMessageIDListKey(login),
			listIndex,listIndex
		))[0];

		if(messageKey === undefined){
			return;
		}

		message = await redisUtils.getHM(client, messageKey);
		
		if(message.status === redisUtils.getMessageStatuses()[4]){
			break;
		}

		listIndex=new String(1+ new Number(listIndex));
		await redisUtils.incrNumAsString(client, indexHolderKey, 1);
	}

	await redisUtils.setHM(client, messageKey, {
		status: redisUtils.getMessageStatuses()[5]
	});
	await redisUtils.incrNumAsString(client, indexHolderKey, 1);

	return message.text;
}

async function userSend(client,sender,receiver,text){
	const newMessageKey = redisUtils.getMessageKey(
		sender,
		receiver,
		uuid.v4()
	);

	await redisUtils.setHM(client,
		newMessageKey,
		{
			from: sender,
			to: receiver,
			text: text,
			status: redisUtils.getMessageStatuses()[0]
		}
	);

	client.publish(redisUtils.getRawActionChannel(), JSON.stringify({
		type: "message",
		id: newMessageKey
	}));

	await redisUtils.incrValueSortedList(client, redisUtils.getActiveUserListKey(), sender, 1);
	await redisUtils.addList(client, redisUtils.getSentMessageIDListKey(sender), newMessageKey);
}

const getRandomArr = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getRandomStr = (minLen, maxLen) => {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const len = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;

	for ( let i = 0; i < len; i++ ) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
};
const getRandomArbitrary = (min, max) => Math.random() * (max - min) + min;


(async function(){
	const port="6379", host="127.0.0.1";
	const client = await redisUtils.getClient(redis, host, port);

	const userCount = new Number(await prompt("Enter number of users in simulation: "));

	let logins =  [];
	
	for (let i = 0; i < userCount; i++) {
		logins.push("test_user_"+(i+1));
	}

	for (var i = 0; i < logins.length; i++) {
		let userKey = redisUtils.getUserKey(logins[i]);

		if(!(await redisUtils.keyExists(client, userKey))){
			await redisUtils.setHM(client, userKey, {
				"password": "",
				"isAdmin": "false"
			});

			await redisUtils.setString(
				client,
				redisUtils.getCurrentReceivedMessageIDIndexKey(logins[i]),
				0
			);

		}
	}

	terminalTitle("Simulation - user count = "+logins.length);

	logins.forEach(login => userLogin(client,login));

	while(true){
		const sendOrRead = Math.random() > 0.7;

		if(sendOrRead){
			const sender = getRandomArr(logins);
			let receiver = sender;

			while(sender === receiver) { receiver = getRandomArr(logins); await sleep(100); }

			const messageText = getRandomStr(5,15);

			console.log("User \""+sender+"\" sent \""+receiver+"\" message: "+messageText);
			await userSend(client, sender, receiver, messageText);
		}else{
			const reader = getRandomArr(logins);
			const message = await userRead(client, reader);

			if(message != undefined)
				console.log("User \""+reader+"\" received a message: "+message);
			else
				console.log("User \""+reader+"\" has no new messages");

		}

		await sleep(100*getRandomArbitrary(7, 35));
	}
})();