var status = "Uninitialized";
var child_process = require('child_process');

var path = require('path');
var fs = require('fs');
var http = require('http');
var needle = require('needle');
var appDir = path.dirname(require.main.filename)+"/";
var verbose = false;
var ignoreTitles = false;
var noConfigLink = false;
var lastURL = "null";
var titleSize = 0;
var contentSize = 0;
var configs = [];

exports.getStatus = function(){
	console.log(status);
}

exports.makeVerbose = function(){
	verbose = true;
}

exports.stopVerbose = function(){
	verbose = false;
}

exports.ignoreTitles = function(){
	ignoreTitles = true;
}

exports.markTitles = function(){
	ignoreTitles = false;
}

exports.shutUp = function(){
	noConfigLink = true;
}

exports.getTitleSize = function(){
	return titleSize;
}

exports.getContentSize = function(){
	return contentSize;
}


exports.scrapeWeb = function(input){
	return scrapeWebArticle(input,false);
}

exports.smartWeb = function(input){
	return scrapeWebArticle(input,true);
}

exports.getConfigs = function(){
	return configs;
}

function scrapeWebArticle(input,smart){
	lastURL = input;
	return new Promise(
			function(res,rej){
				var lastSlash = input.lastIndexOf("/");
				var urlDIR = input.substring(0,lastSlash)+"/";

				needle.post('http://108.167.189.29/~saternius/WebScraper/getConfig.php', {"urlDir":urlDIR}, 
				    function(err, resp, body){
				      	configs = JSON.parse(body)["data"];
			       		var execStr = 'cd '+__dirname+' && ./wkhtmltox/bin/wkhtmltopdf --zoom .5 --no-images --disable-smart-shrinking '+input+' in/temp.pdf';
					 	//console.log("executing: "+execStr);
					 	var cp = child_process.exec(execStr,
						  function (error, stdout, stderr) {
						   	performPDFScrape(false,res,rej,smart,true);
						});

						cp.stderr.on('data',function(data){
							status = data;
							if(verbose)
								console.log(data);
						})

						cp.stdout.on('data',function(data){
							status = data;
							if(verbose)
								console.log(data);
						})

				});


			}
		);
}

exports.scrapePDF = function(input){
	return new Promise(function(res,rej){
		copyFile(input,__dirname+'/in/temp.pdf',performPDFScrape,res,rej,false,false);
	});
}

exports.smartPDF = function(input){
	return new Promise(function(res,rej){
		copyFile(input,__dirname+'/in/temp.pdf',performPDFScrape,res,rej,true,false);
	});
}


function copyFile(source, target, cb, res, rej,smart) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
  	rej(err);
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
  	rej(err);
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err, res, rej,smart);
      cbCalled = true;
    }
  }
}



function performPDFScrape(err, res, rej, smart, web){
	if(err){
		rej(err);
		return;
	}

	var execStr = 'cd '+__dirname+' && java -cp WebArtScrape.jar MainActivity in/temp.pdf out/output.txt';
	//console.log(execStr);
	//console.log("cur dir: "+__dirname);
	var cp = child_process.exec(execStr,
	  function (error, stdout, stderr) {
	    if (error !== null) {
	      //console.log('exec error: ' + error);
	    }
	    readFileAndMap(res,rej, smart, web);

	});

	cp.stderr.on('data',function(data){
		status = data;
		if(verbose)
			console.log(data);
		//console.log(data);
	})

	cp.stdout.on('data',function(data){
		status = data;
		if(verbose)
			console.log(data);
		//console.log(data);
	})
}

function readFileAndMap(res,rej, smart, web){
	fs.readFile(__dirname+'/out/output.txt', 'utf8', function (err,data) {
	  if (err) {
	    return rej(err);
	  }
	  genFontMap(data,res,smart, web);
	});
}

function genFontMap(out,res,smart, web){
	var clusters = [];
	var i = 0;
	while(out.indexOf("\n",i)>-1){
		var endI = out.indexOf("\n",i);
		clusters.push(new Cluster(out.substring(i,endI)));
		i=endI+1;
	}
	exports.clusters = clusters;
	smartSel(clusters,res,smart,web);
}


var numClusts = 0;
function Cluster(source) {
  var closedI = source.indexOf(">");
  this.source = source;
  this.size = source.substring(6,closedI);
  this.content = source.substring(closedI+2,source.length);
  this.id = numClusts;
  numClusts++;
}


function smartSel(clusters,res,smart,web){
	if(verbose){
		console.log("Analysing clusters..");
		console.log("Num clusts: "+clusters.length);
	}

	var freqMap = {};
	var titMap = {};
	var sizeMap = {};
	var re = new RegExp("^(\n*[\s* and a but or the is of in vs.]*([A-Z][a-z]*)*\s*\n*)*$");


	for(var i=0; i<clusters.length;i++){
		var cSize = clusters[i].size;
		// //Hard coded: Removes wiki references.
		// if(cSize==6.12 || cSize==5.91){
		// 	continue;
		// }
		if(sizeMap[cSize]==null){
			sizeMap[cSize] = [clusters[i].content];
		}else{
			sizeMap[cSize].push(clusters[i].content);
		}

		if(freqMap[cSize] == null){
			freqMap[cSize] = clusters[i].content.length;
			if(!ignoreTitles){
				if(clusters[i].content.length<50 && re.test(clusters[i].content)){
					titMap[cSize] = 1;
				}else{
					titMap[cSize] = 0;
				}
			}
		}else{
			freqMap[cSize]+= clusters[i].content.length;
			if(!ignoreTitles){
				if(clusters[i].content.length<50 && re.test(clusters[i].content)){
					titMap[cSize]++;
				}
			}
		}
	}


	var maxFreq = -1;
	var maxTit = -1;
	var cSize = -1;
	var tSize = -1;

	for (var key in freqMap) {
	  if (freqMap.hasOwnProperty(key)) {
	  	if(freqMap[key]>maxFreq){
	  		maxFreq = freqMap[key];
	  		cSize = key;
	  	}
	  	if(!ignoreTitles){
		  	if(titMap[key]>maxTit){
		  		maxTit = titMap[key];
		  		tSize = key;
		  	}
	  	}
	  }
	}

	titleSize = tSize;
	contentSize = cSize;


	if(!smart){
		res(sizeMap);
	}else{
		var retMap = {};
		if(!ignoreTitles){
			retMap["titles"] = sizeMap[tSize];
		}
		retMap["content"] = sizeMap[cSize];
		res(retMap);
	}

	if(smart && web && !noConfigLink){
		console.log("Was the smart parse wrong? If so manually config it to suite this page.( Also kindly save your config so others wont have to ): http://localhost:8080?url="+lastURL);
	}
}