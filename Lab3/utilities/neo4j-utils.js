const neo4j = require('neo4j-driver');
const messageTags = require('./redis-utils').getMessageTags();

module.exports = {
	getNeo4jDriver: function(){
		const uri = "neo4j://localhost:7687";
		const user = "neo4j";
		const password = "1234";

		const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

		return driver;
	},

	createAction: async function(session, type, idOrLogin) {
		return session.run(
			'CREATE (action:Action { type: $type, id: $id })',
			{ type, id: idOrLogin }
		);
	},
	createSpamAlert: async function(session, messId) {
		return session.run(
			'CREATE (action:Action { type: \'spam\', id: $messId })',
			{ messId }
		);
	},
	createMessage: async function(session, sender, receiver, text, id, spam, tags) {
		return session.run(
			'MATCH (a:User),(b:User) WHERE a.login = $snd AND b.login = $rcv '+
			'CREATE (a)-[m:Message {text: $text, id: $id, spam: $spam, tags: $tags}]->(b)',
			{ text, id, spam, tags, rcv: receiver, snd: sender }
		);
	},
	createUser: async function(session, login, password) {
		if(password !== undefined){
			return session.run(
				'CREATE (user:User:Admin {login: $name, password: $pass})',
				{ name: login, pass: password }
			);
		}else{
			return session.run(
				'CREATE (user:User {login: $name})',
				{ name: login }
			);
		}
	},

	task1: async function(session){
		return session.run(
			'MATCH (a:User)-[mess:Message]-(:User) WHERE all(tag in mess.tags WHERE tag in $messageTags) RETURN a.login',
			{ messageTags }
		);
	},
	task2: async function(session,N){
		return session.run(
			'MATCH (a:User)-[:Message*'+N+']-(b:User) RETURN a.login,b.login'
		);
	},
	task3: async function(session,loginA,loginB){
		return session.run(
			'MATCH (a:User {login: $loginA}),(b:User {login: $loginB}),p = shortestPath((a)-[:Message*]-(b)) RETURN p',
			{ loginA, loginB }
		);
	},
	task4: async function(session){
		return session.run(
			'MATCH (a:User)-[mess:Message]-(b:User) WITH collect(mess) as rels WHERE all(rel in rels WHERE rel.spam = true) RETURN a.login,b.login'
		);
	},
	/*task5: async function(session,tags){
		return session.run(
			'MATCH (a:User {login: $loginA}),(b:User {login: $loginB}),p = shortestPath((a)-[:Message*]-(b)) RETURN p',
			{ loginA, loginB }
		);
	}*/
};