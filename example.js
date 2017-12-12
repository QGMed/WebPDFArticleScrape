var scraper = require('./web-pdf-scraper');	
scraper.smartWeb("https://en.wikipedia.org/wiki/Heart").then(
        function(output){
            console.log(output);
        }
    ).catch(
            function(reason) {
                console.log('Handle rejected promise ('+reason+') here.');
            }
    );