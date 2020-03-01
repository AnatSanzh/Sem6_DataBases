const fs = require('fs');
const { XMLSerializer } = require('xmldom');

module.exports = (dom, filename) => {
	const str = new XMLSerializer().serializeToString(dom);
	fs.writeFile(filename, str, () => 0);
	return str;
};