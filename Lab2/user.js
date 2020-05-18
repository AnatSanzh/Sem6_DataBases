const prompt = require('./utilities/prompt');
const redis = require('redis');
const redisUtils = require('./utilities/redis-utils');

/*
2.1. Звичайний користувач має змогу виконувати вхід за ім’ям (без
паролю), відправляти та отримувати (переглядати) повідомлення, отримувати
дані про кількість своїх повідомлень, згрупованих за статусом: “Створено”, “У черзі”,
“Перевіряється на спам”, “Заблоковано через спам”, “Відправлено адресату”, “Доставлено адресату”.

2.2. Адміністратор має змогу переглядати журнал подій, що відбулись
(див. Список активностей для журналювання), переглядати список
користувачів, які знаходяться online, переглядати статистику (N найбільш
активних відправників повідомлень із відповідною кількістю, N найактивніших
“спамерів” із відповідною кількістю).
*/

/* login/exit action
{
	type: "login"/"exit",
	from: userName
}*/
/* message action
{
	type: "message",
	from: userName,
	to: userName,
	text: messageText
}*/

const userMenu = [
	{
		title: "Exit",
		response: function(context){
			context.client.publish(redisUtils.getRawActionChannel(), JSON.stringify({
				type: "logout",
				from: context.login
			}));

			process.exit();
		}
	},
	{
		title: "Send Message",
		response: function(context){
			const receiver = await prompt("Receiver of message: ");
			const message = await prompt("Message: ");

			context.client.publish(redisUtils.getRawActionChannel(), JSON.stringify({
				type: "message",
				from: context.login,
				to: receiver,
				text: message
			}));
		}
	},
	{
		title: "Read Message From Queue",
		response: function(context){
			
		}
	},
	{
		title: "View Message Count",
		response: function(context){
			
		}
	}
];

const adminAdditMenu = [
	{
		title: "Read Event Journal",
		response: function(context){

		}
	},
	{
		title: "Read Active User List",
		response: function(context){
			
		}
	},
	{
		title: "View User Statistics",
		response: function(context){
			
		}
	},
];


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
		}else{
			process.exit();
		}
	}else{
		if(userData.isAdmin){
			let	password = await prompt("\nEnter password: ");

			if(password != userData.password)
			{
				console.log("Error: Password is incorrect");
				process.exit();
			}

			Array.prototype.push.apply(menu, adminAdditMenu);
		}
	}

	client.publish(redisUtils.getRawActionChannel(), JSON.stringify({
		type: "login",
		from: login
	}));

	const context = { client, login };


	while(true){
		console.clear();

		console.log("Options:");

		menu.forEach( ({title},idx) => console.log((idx+1) + ") " + title) );

		const selectedOptionIdx = new Integer(await prompt("\n> ")) - 1;

		if(selectedOptionIdx == undefined || selectedOptionIdx < 0 || selectedOptionIdx >= menu.length){
			await prompt("Selected invalid option!");
			continue;
		}

		menu[selectedOptionIdx].response(context);
	}
})();