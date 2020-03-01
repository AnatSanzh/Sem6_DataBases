const xPathSelect = require('./xpath-select');
const rawXPathSelect = require('xpath.js');
const getHtml = require('./get-html');
const saveDom = require('./save-dom');
const { DOMParser } = require('xmldom');


async function getHtmls(url, number){
	const results = [ ];
	let currentUrl = url;

	while(number > 0){
		const htmlSource = await getHtml(currentUrl);
		const linkNodes = xPathSelect(htmlSource, "//a/@href");

		if(linkNodes.length == 0)
			return results;

		let indexToSelect = 0;

		while(linkNodes[indexToSelect].value.includes("://")){
			indexToSelect++;

			if(indexToSelect >= linkNodes.length)
				return results;
		}

		results.push({ url: currentUrl, html: htmlSource });
		currentUrl = url+linkNodes[indexToSelect].value;

		number--;
	}

	return results;
}


const addr1 = "https://www.w3schools.com", addr2 = "https://tennismag.com.ua";

(async function(){
	// part1
	const htmls = await getHtmls(addr1, 20);
	
	const part1Document = new DOMParser().parseFromString("<data></data>");

	htmls.forEach( ({url, html}) => {
		const pageElem = part1Document.createElement('page');
		pageElem.setAttribute("url", url);

		const imgUrlListString = xPathSelect(html, "//img/@src")
		.map( node => node.value ).join('\n');
		const textListString = xPathSelect(html, '//body/descendant-or-self::*/text()')
		.map( node => node.data ).join('\n');

		{
			const fragEl = part1Document.createElement("fragment");
			fragEl.setAttribute("type", "text");

			const fragElText = part1Document.createTextNode(textListString);
			fragEl.appendChild(fragElText);

			pageElem.appendChild(fragEl);
		}
		{
			const fragEl = part1Document.createElement("fragment");
			fragEl.setAttribute("type", "image");

			const fragElText = part1Document.createTextNode(imgUrlListString);
			fragEl.appendChild(fragElText);

			pageElem.appendChild(fragEl);
		}

		part1Document.documentElement.appendChild(pageElem);
	});

	saveDom(part1Document, "part1.xml");

	// part2
	htmls.forEach( ({url, html}) => {
		const textCount = xPathSelect(html, 'count(//body/descendant-or-self::*/text())').num;
		console.log(textCount);
	});

	// part3
	const html = await getHtml(addr2);

	const items = xPathSelect(html, "//div[contains(@class,'bxr-ecommerce-v1')]/div[contains(@class,'bxr-element-container')]").slice(0, 20);
	
	const part3Document = new DOMParser().parseFromString("<data></data>");

	items.forEach( itemNode => {
		const itemElem = part1Document.createElement('item');

		const imgUrl = rawXPathSelect(itemNode, "./div[contains(@class,'bxr-element-image')]//img/@src")[0].value;
		const costText = rawXPathSelect(itemNode, "(./div[contains(@class,'bxr-element-price')]//span[contains(@class,'bxr-market-current-price')])[1]/text()")[0].data;
		const nameText = rawXPathSelect(itemNode, "./div[contains(@class,'bxr-element-name')]//a/@title")[0].value;

		itemElem.setAttribute("cost", costText);
		itemElem.setAttribute("imageUrl", imgUrl);
		itemElem.setAttribute("description", nameText);

		part3Document.documentElement.appendChild(itemElem);
	});

	saveDom(part3Document, "part3.xml");

	// part4
	
})();