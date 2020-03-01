const fs = require('fs');
const { XMLSerializer } = require('xmldom');

module.exports = (dom, filename) => {
	fs.writeFile(filename, new XMLSerializer().serializeToString(dom), () => 0);
};