const prompt = require('./utilities/prompt');
const redis = require('redis');
const redisUtils = require('./utilities/redis-utils');
const uuid = require('uuid');
const terminalTitle = require('./utilities/terminal-title');

/*
2.1. Звичайний користувач:
1) переглядати повідомлення
2) отримувати дані про кількість своїх повідомлень
3) згрупованих за статусом: “Створено”, “У черзі”, “Перевіряється на спам”,
“Заблоковано через спам”, “Відправлено адресату”, “Доставлено адресату”.

2.2. Адміністратор:
1) переглядати журнал подій
2) переглядати список kористувачів, які знаходяться online
3) переглядати статистику (N найбільш активних відправників повідомлень із відповідною кількістю,
N найактивніших “спамерів” із відповідною кількістю).
*/

const userMenu = [
	{
		title: "Exit",
		response:async function(context){
			context.client.publish(redisUtils.getRawActionChannel(), JSON.stringify({
				type: "logout",
				from: context.login
			}));

			process.exit();
		}
	},
	{
		title: "Send Message",
		response:async function(context){
			const receiver = await prompt("Receiver of message: ");

			if(!(await redisUtils.keyExists(
				context.client,
				redisUtils.getUserKey(receiver)
			))){
				await prompt("Invalid user name: "+receiver);
				return;
			}

			const messageText = await prompt("Message: ");

			const newMessageKey = redisUtils.getMessageKey(
				context.login,
				receiver,
				uuid.v4()
			);

			await redisUtils.setHM(context.client,
				newMessageKey,
				{
					from: context.login,
					to: receiver,
					text: messageText,
					status: redisUtils.getMessageStatuses()[0]
				}
			);

			context.client.publish(redisUtils.getRawActionChannel(), JSON.stringify({
				type: "message",
				id: newMessageKey
			}));

			await redisUtils.incrValueSortedList(context.client, redisUtils.getActiveUserListKey(), context.login, 1);
			await redisUtils.addList(context.client, redisUtils.getSentMessageIDListKey(context.login), newMessageKey);
		}
	},
	{
		title: "Read Message",
		response:async function(context){
			const indexHolderKey = redisUtils.getCurrentReceivedMessageIDIndexKey(context.login);
			let listIndex = await redisUtils.getString(context.client, indexHolderKey);
			let message, messageKey;

			while(true){
				messageKey = (await redisUtils.getList(
					context.client,
					redisUtils.getReceivedMessageIDListKey(context.login),
					listIndex,listIndex
				))[0];

				if(messageKey === undefined){
					console.log("No new messages");
					return;
				}

				message = await redisUtils.getHM(context.client, messageKey);
				
				if(message.status === redisUtils.getMessageStatuses()[4]){
					break;
				}

				listIndex=new String(1+ new Number(listIndex));
				await redisUtils.incrNumAsString(context.client, indexHolderKey, 1);
			}

			console.log("Message: "+message.text);

			await redisUtils.setHM(context.client, messageKey, {
				status: redisUtils.getMessageStatuses()[5]
			});
			await redisUtils.incrNumAsString(context.client, indexHolderKey, 1);		
		}
	},
	{
		title: "View Message Count",
		response:async function(context){
			const statusCounts = redisUtils.getMessageStatuses()
			.reduce((obj, statusName)=>({...obj, [statusName]: 0}),{});

			const messageKeys = await redisUtils.getList(
				context.client,
				redisUtils.getSentMessageIDListKey(context.login),
				0,-1
			);

			for (var i = 0; i < messageKeys.length; i++) {
				statusCounts[
					(await redisUtils.getHM(context.client, messageKeys[i])).status
				]++;
			}

			console.log("Message count: ");

			for (const status in statusCounts) {
				console.log('"'+status+'": '+statusCounts[status]);	
			}
		}
	}
];

const adminAdditMenu = [
	{
		title: "Read Event Journal",
		response:async function(context){
			const journal = await redisUtils.getList(
				context.client,
				redisUtils.getEventJournalKey(),
				0,-1
			);

			journal.forEach((record,index) => {
				let output = (index+1)+") ";
				record = JSON.parse(record);

				if(record.type === "spam"){
					output +="Action:spam  Date:"+record.date+"  Sender:"+
					record.from+"  Receiver:"+record.to+"  Message_ID:"+record.id;
				}else if(record.type === "login"){
					output +="Action:login  Date:"+record.date+"  User:"+record.from;
				}else if(record.type === "logout"){
					output +="Action:logout  Date:"+record.date+"  User:"+record.from;
				}

				console.log(output);
			});
		}
	},
	{
		title: "Read Active User List",
		response:async function(context){
			const onlineUserList = await redisUtils.readSet(
				context.client,
				redisUtils.getOnlineUsersKey()
			);

			onlineUserList.forEach((userLogin, index) => {
				console.log((index+1)+") '"+userLogin+"'");
			});
		}
	},
	{
		title: "View User Statistics",
		response:async function(context){
			const count = new Number(await prompt("Enter count: "));

			console.log("Top "+count+" active users:");
			(await redisUtils.readRevSortedList(context.client,redisUtils.getActiveUserListKey(),0,count-1))
			.forEach( (userLogin, index) => console.log((index+1)+") "+userLogin));

			console.log("Top "+count+" spammers:");
			(await redisUtils.readRevSortedList(context.client,redisUtils.getSpammerListKey(),0,count-1))
			.forEach( (userLogin, index) => console.log((index+1)+") "+userLogin));
		}
	}
];


(async function(){
	const port="6379", host="127.0.0.1";
	const client = await redisUtils.getClient(redis, host, port);


	let login = await prompt("\nEnter login: "), 
		userKey = redisUtils.getUserKey(login),
		menu = userMenu;

	let userData = await redisUtils.getHM(client, userKey);

	if(userData === null){
		if(await prompt("Do you want to register as \""+login+"\"?[Y/N]: ") === "Y"){
			let isAdmin = await prompt("Do you want to register as ADMIN ?[Y/N]: ") === "Y",
				password = "";

			if(isAdmin){
				password = await prompt("\nEnter password: ");
				Array.prototype.push.apply(menu, adminAdditMenu);
			}

			await redisUtils.setHM(client, userKey, {
				"password": password,
				"isAdmin": isAdmin
			});

			await redisUtils.setString(
				client,
				redisUtils.getCurrentReceivedMessageIDIndexKey(login),
				0
			);
		}else{
			process.exit();
		}
	}else{
		if(userData.isAdmin === "true"){
			let	password = await prompt("\nEnter password: ");

			if(password != userData.password)
			{
				console.log("Error: Password is incorrect");
				process.exit();
			}

			Array.prototype.push.apply(menu, adminAdditMenu);
		}
	}

	terminalTitle("User: "+login);

	client.publish(redisUtils.getRawActionChannel(), JSON.stringify({
		type: "login",
		from: login
	}));

	const context = { client, login };


	while(true){
		console.clear();

		console.log("User: "+login);
		console.log("Options:");

		menu.forEach( ({title},idx) => console.log((idx+1) + ") " + title) );

		const selectedOptionIdx = new Number(await prompt("\n> ")) - 1;

		if(selectedOptionIdx == undefined || selectedOptionIdx < 0 || selectedOptionIdx >= menu.length){
			await prompt("Selected invalid option!");
			continue;
		}

		try{
			await menu[selectedOptionIdx].response(context);
		}catch(err){
			console.log(err);
		}

		await prompt("Enter to continue");
	}
})();