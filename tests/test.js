'use strict';
//WebPDFScrapper is a npm module that allows you to scrape main articles out of pdfs and webpage articles.
var scraper = require("..");

/*
	Returned DataStructures
		sizeMap: A hashmap <key: fontSize, val: Array of all text chunks of said size>
		output: {
					title: Array of all texts classified as titles
					content: Array ofall texts classified as content
				}
*/

//Basic Usage

	//Scrapping from a PDF
		
		//Generating sizeMap of a PDF
		// scraper.scrapePDF("chest.pdf").then(
		// 	function(sizeMap){
		// 		console.log(sizeMap);
		// 	}
		// )

		//Generating output of a PDF
		// scraper.smartPDF("chest.pdf").then(
		// 	function(output){
		// 		console.log(output);
		// 	}
		// )


	//Scrapping from a Web Article

		//Generating sizeMap of a web article.
		// scraper.scrapeWeb("https://en.wikipedia.org/wiki/Heart").then(
		// 	function(sizeMap){
		// 		console.log(sizeMap);
		// 	}
		// )

		//Generating output of a web article.
		// scraper.smartWeb("https://en.wikipedia.org/wiki/Heart").then(
		// 	function(sizeMap){
		// 		console.log(sizeMap);
		// 	}
		// )


/*
	Advanced Usage:

		By default the module runs a local web sever on port 8081 to help manually configure parsing in case
		messes up.
		After every web parse it will log to the console a link to the web page.
		To help make our system better we encourage using it.

		HOW TO USE MANUAL CONFIG SITE:
			manually toggle which font sizes correspond to the useful text
			 ->Yellow : the text is a title
			 ->Green : the text is content
			 ->Red : ignore these texts

			 once you fix the page, give your configuration a name and publish it.

			 A more in depth visual explaination will be provided in the near future.

		ADDITIONAL USEFUL FUNCTIONS:
*/

/*
			scraper.makeVerbose()  //logs more information about the processing to console
			scraper.stopVerbose()

			scraper.ignoreTitles() //sometimes the regex for title classification causes HUGE lag, so ignoring them is sometimes useful
			scraper.markTitles()

			scraper.shutUp()	//stops logging the manual config link

			scraper.closeServer() //closes the server

		
*/




