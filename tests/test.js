var scraper = require("..");
// scraper.scrapePDF("chest.pdf").then(
// 	function(clusters){
// 		console.log(clusters);
// 	}
// );

// scraper.smartPDF("chest.pdf").then(
// 	function(retMap){
// 		console.log(retMap);
// 	}
// )

scraper.smartWeb("https://en.wikipedia.org/wiki/Heart").then(
	function(clusters){
		//console.log(clusters);
	}
).catch(
    function(reason) {
        //console.log('Handle rejected promise ('+reason+') here.');
    }
);