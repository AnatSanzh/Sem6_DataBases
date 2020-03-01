const { DOMParser } = require('xmldom');
const select = require('xpath.js');

module.exports = (xmlSource, query) => select(
	new DOMParser({
	    locator: {},
	    errorHandler: {
			warning: function (w) { }, 
			error: function (e) { }, 
			fatalError: function (e) { console.error(e) }
		}
	}).parseFromString(xmlSource),
	query
);