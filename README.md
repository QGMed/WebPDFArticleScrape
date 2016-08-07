# WebPDFArticleScrape
####WebPDFArticleScrape is a npm module that allows you to scrape main content out of pdfs and webpage articles.

######Since this module is not yet officially published to npm (will be very soon) you will have to manually download it and place it in your node_modules directory. Afterwich just use require to fetch the module.
```javascript
	var scraper = require('name-of-directory-you-saved-it-as');	
```


**Input:** <br>URL or Directory<br><br>
**Returned DataStructures:**<br>
sizeMap:   Map\<key:fontSize, val:Array of all text chunks of said size><br>
output: {<br>
          title: [Array of all text chunks classified as titles]<br>
					content: [Array ofall text chunks classified as content]<br>
        }
<br><br>

###Basic Usage
#####Generating sizeMap of a PDF<br>
```javascript
		scraper.scrapePDF("pdfDir.pdf").then(
			function(sizeMap){
				console.log(sizeMap);
			}
		).catch(
		        function(reason) {
		            console.log('Handle rejected promise ('+reason+') here.');
		        }
        );
```

#####Generating output of a PDF<br>
```javascript
		scraper.smartPDF("pdfDir.pdf").then(
			function(output){
				console.log(output);
			}
		).catch(
		        function(reason) {
		            console.log('Handle rejected promise ('+reason+') here.');
		        }
        );
```

#####Generating sizeMap of a Web Article<br>
```javascript
		scraper.scrapeWeb("https://en.wikipedia.org/wiki/Heart").then(
			function(sizeMap){
				console.log(sizeMap);
			}
		).catch(
		        function(reason) {
		            console.log('Handle rejected promise ('+reason+') here.');
		        }
        );
```
#####Generating output of a Web Article<br>
```javascript
		scraper.smartWeb("https://en.wikipedia.org/wiki/Heart").then(
			function(output){
				console.log(output);
			}
		).catch(
		        function(reason) {
		            console.log('Handle rejected promise ('+reason+') here.');
		        }
        );
```

<br>
###Advanced Usage:
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

###Additional Useful Functions:<br>
```javascript
    scraper.makeVerbose()  //logs more information about the processing to console
	scraper.stopVerbose()
	
	scraper.ignoreTitles() //sometimes the regex for title classification causes HUGE lag, so ignoring them is sometimes useful
	scraper.markTitles()

	scraper.shutUp()	//stops logging the manual config link

	scraper.closeServer() //closes the server
```



