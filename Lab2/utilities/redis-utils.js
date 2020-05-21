module.exports = {
	incrNumAsString: async function(client, key, value){
		return new Promise((res, rej) => {
			client.incrby(key, value, function(err, newValue) {
			    if(err)
			    	rej(err);
			    else
			    	res(newValue);
			});
		});
	},

	getString: async function(client, key){
		return new Promise((res, rej) => {
			client.get(key, function(err, value) {
			    if(err)
			    	rej(err);
			    else
			    	res(value);
			});
		});
	},
	setString: async function(client, key, value){
		return new Promise((res, rej) => {
			client.set(key, value, function(err, reply) {
				if(err)
			    	rej(err);
			    else
			    	res();
			});
		});
	},


	getHM: async function(client, key){
		return new Promise((res, rej) => {
			client.hgetall(key, function(err, object) {
			    if(err)
			    	rej(err);
			    else
			    	res(object);
			});
		});
	},
	setHM: async function(client, key, object){
		return new Promise((res, rej) => {
			client.hmset(key, object, function(err) {
			    if(err)
			    	rej(err);
			    else
			    	res();
			});
		});
	},


	addList: async function(client, key, item){
		return new Promise((res, rej) => {
			client.rpush(key, item, function(err, object) {
			    if(err)
			    	rej(err);
			    else
			    	res();
			});
		});
	},
	getList: async function(client, key, indexStart, indexEnd){
		return new Promise((res, rej) => {
			client.lrange(key, indexStart, indexEnd, function(err, arr) {
			    if(err)
			    	rej(err);
			    else
			    	res(arr);
			});
		});
	},
	removeList: async function(client, key){
		return new Promise((res, rej) => {
			client.lpop(key, function(err, arr) {
			    if(err)
			    	rej(err);
			    else
			    	res();
			});
		});
	},


	addSortedList: async function(client, key, item, itemValue){
		return new Promise((res, rej) => {
			client.zadd(key, itemValue, item, function(err, object) {
			    if(err)
			    	rej(err);
			    else
			    	res();
			});
		});
	},
	getSortedList: async function(client, key, indexStart, indexEnd){
		return new Promise((res, rej) => {
			client.zrange(key, indexStart, indexEnd, function(err, arr) {
			    if(err)
			    	rej(err);
			    else
			    	res(arr);
			});
		});
	},
	readRevSortedList: async function(client, key, indexStart, indexEnd){
		return new Promise((res, rej) => {
			client.zrevrange(key, indexStart, indexEnd, function(err, arr) {
			    if(err)
			    	rej(err);
			    else
			    	res(arr);
			});
		});
	},
	removeMinSortedList: async function(client, key){
		return new Promise((res, rej) => {
			client.zpopmin(key, function(err, elem) {
			    if(err)
			    	rej(err);
			    else
			    	res(elem);
			});
		});
	},
	countSortedList: async function(client, key){
		return new Promise((res, rej) => {
			client.zcard(key, function(err, count) {
			    if(err)
			    	rej(err);
			    else
			    	res(count);
			});
		});
	},
	incrValueSortedList: async function(client, key, item, valueDiff){
		return new Promise((res, rej) => {
			client.zincrby(key, valueDiff, item, function(err, newVal) {
			    if(err)
			    	rej(err);
			    else
			    	res(newVal);
			});
		});
	},


	addSet: async function(client, key, item){
		return new Promise((res, rej) => {
			client.sadd(key, item, function(err, object) {
			    if(err)
			    	rej(err);
			    else
			    	res();
			});
		});
	},
	containsSet: async function(client, key, item){
		return new Promise((res, rej) => {
			client.sismember(key, item, function(err, contains) {
			    if(err)
			    	rej(err);
			    else
			    	res(contains === 1);
			});
		});
	},
	readSet: async function(client, key){
		return new Promise((res, rej) => {
			client.smembers(key, function(err, list) {
			    if(err)
			    	rej(err);
			    else
			    	res(list);
			});
		});
	},
	removeSet: async function(client, key, item){
		return new Promise((res, rej) => {
			client.srem(key, item, function(err, arr) {
			    if(err)
			    	rej(err);
			    else
			    	res();
			});
		});
	},

	
	keyExists: async function(client, key){
		return new Promise((res, rej) => {
			client.exists(key, function(err, reply) {
			    if(err)
			    	rej(err);
			    else
			    	res(reply === 1);
			});
		});
	},

	getRawActionChannel: () => "RAW_ACTION",
	getUnprocessedMessageChannel: () => "UNPROCESSED_MESSAGE",
	getProcessedMessageChannel: () => "PROCESSED_MESSAGE",
	
	getReceivedMessageIDListKey: (login) => "MESSAGE_ID_LIST_RECEIVED_BY_"+login,
	getSentMessageIDListKey: (login) => "MESSAGE_ID_LIST_SENT_BY_"+login,
	// add message when sent by server

	getCurrentReceivedMessageIDIndexKey: (login) => "CURRENT_MESSAGE_ID_OF_"+login,
	// increase when message is read

	getMessageKey: (fromLogin,toLogin,id) => "MESSAGE_FROM_"+fromLogin+"_TO_"+toLogin+"_N"+id,
	// create message when sent by user
	// change status during sending

	getUserKey: (login) => "USER_"+login,
	getEventJournalKey: () => "EVENT_JOURNAL",
	getOnlineUsersKey: () => "ONLINE_USERS",

	// add list for spammers/active users
	getActiveUserListKey: () => "ACTIVE_USERS",
	getSpammerListKey: () => "SPAMMERS",

	getMessageStatuses: () => ["created","queued","spam_checking",
	"spam_blocked","sent_to_receiver","received"]
};

