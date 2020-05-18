const { getResult } = require('spam-detection');

module.exports = {
	detectSpam : (text) => getResult(text).reduce((total, currEl) => Math.min(total, currEl.value), 0)
};