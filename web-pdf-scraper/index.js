//TODO: make it so that a user can display titles and content by sentenceID.
//TODO: dont prompt link if server is closed;


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
var hasDefConfig = false;
var webConfig;

exports.runServer = true;
exports.useWeb = true;
exports.featMap = null;
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
	if(exports.runServer){
		startServer();
	}
	lastURL = input;
	return new Promise(
			function(res,rej){
				var lastSlash = input.lastIndexOf("/");
				var urlDIR = input.substring(0,lastSlash)+"/";

				// needle.post('http://108.167.189.29/~saternius/WebScraper/getConfig.php', {"urlDir":urlDIR}, 
				//     function(err, resp, body){
				//     	if(err!=null){
				//     		rej(err);
				//     	}
				      	configs = [] //JSON.parse(body)["data"];
				      	if(configs.length>0 && exports.useWeb){
				      		hasDefConfig = true;
				      		webConfig = configs[0];
				      	}

				      	console.log("input: "+input);

			       		var execStr = 'cd '+__dirname+' && ./wkhtmltox/bin/wkhtmltopdf --zoom .5 --no-images --disable-smart-shrinking '+input+' in/temp.pdf';
					 	console.log("executing: "+execStr);
					 	var cp = child_process.exec(execStr,
						  function (error, stdout, stderr) {
						  	if(error!=null){
						  		rej(error);
						  	}
						  	console.log("pdf generated..")
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

				// });
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
	var cp = child_process.exec(execStr,
	  function (error, stdout, stderr) {
	  	if(error!=null){
	  		rej(error);
	  	}
	    readFileAndMap(res,rej, smart, web);

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

	if(hasDefConfig){
		useWebConf(clusters,res);
	}else{
		smartSel(clusters,res,smart,web);
	}
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
	exports.featMap = sizeMap;
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
	if(smart && web){
		promptConfigLink();
	}
}

function useWebConf(clusters,res){
	var retMap = {};
	var titles = [];
	var content = [];
	var config = webConfig.config;
	var sizeMap = {};
	for(var i=0; i<clusters.length;i++){
		var cSize = clusters[i].size;
		if(sizeMap[cSize]==null){
			sizeMap[cSize] = [clusters[i].content];
		}else{
			sizeMap[cSize].push(clusters[i].content);
		}

		if(config[cSize]!=null){
			var type = config[clusters[i].size];
			if(type === "title"){
				titles.push(clusters[i].content);
			}else if(type === "content"){
				content.push(clusters[i].content);
			}
		}
	}
	retMap["titles"] = titles;
	retMap["content"] = content;
	exports.featMap = sizeMap;
	res(retMap);
	promptConfigLink();
}

function promptConfigLink(){
	if(exports.runServer && !noConfigLink){
		console.log("Was the smart parse wrong? If so manually config it to suite this page.( Also kindly save your config so others wont have to ): http://localhost:8081");
	}
}



function startServer(){
	//WEBSERVER FOR CONFIGING
	var express = require('express');
	var stringy = require('stringy');
	var bodyParser = require('body-parser');
	var app = express();
	app.set("view engine", "ejs");
	app.use(express.static(__dirname + "/public"));
	app.set('views', __dirname + '/views');

	app.use(bodyParser.urlencoded({
	  extended: true
	}));

	app.use(function (req, res, next) {
	  res.header("Access-Control-Allow-Origin", "*");
	  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Authorization");
	  next();
	});

	var router = express.Router();
	app.use('/', router);

	app.get('/', dispConfig);

	function dispConfig(req, res){
	  	var retJSON = {};
		retJSON.featMap = exports.featMap;
		retJSON.titSel = titleSize;
		retJSON.contSel = contentSize;
		retJSON.clusters = exports.clusters;
		retJSON.configs = exports.getConfigs();
		retJSON.reqURL = lastURL;
	  	res.render('config.ejs',retJSON);
	}

	var server = app.listen(process.env.PORT || '8081', '0.0.0.0', function() {
		//server is running.
	});
}


exports.closeServer =function(){
	server.close();
}
