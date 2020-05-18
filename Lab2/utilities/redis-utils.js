module.exports = {
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
			client.sismember (key, item, function(err, contains) {
			    if(err)
			    	rej(err);
			    else
			    	res(contains === 1);
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
	
	getMessageListKey: (from,to) => "MESSAGE_LIST_FROM_"+from+"_TO_"+to,
	getUserKey: (login) => "USER_"+login,
	getEventJournalKey: () => "EVENT_JOURNAL"
};

