
function sobnikApi () 
{

    var api_url = "http://localhost:8081/api/";

    var call = function (method, type, data, callback, statbacks, errback)
    {
	$.ajax ({
	    url: api_url + method,
	    type: type,
	    data: JSON.stringify (data),
	    success: callback,
	    statusCode: statbacks,
	    error: function (xhr, status, error) {
		console.log ("API Error, method: "+method+", status: "+status);
		if (errback)
		    errback ();
	    }
	});
    }

    var later = function (millis, callback)
    {
	var to = setTimeout (function () {
	    clearTimeout (to);
	    callback ();
	}, millis);
	return to;
    }

    var open = function (ads)
    {
	var hostname = location.hostname;

	var next = function ()
	{
	    if (ads.length == 0)
	    {
		console.log("done");
		chrome.runtime.sendMessage ("", {type: "done"});
		return;
	    }
	    
	    var ad_index = Math.floor (Math.random () * ads.length);
	    var ad = ads[ad_index];
	    ads.splice (ad_index, 1);
	    var url = "http://" + hostname + ad;
	    console.log (url);

	    var delayNext = function () {
		// FIXME make distribution more stochastic
		var delays = [10, 40, 50];
		var dr = Math.floor (Math.random () * delays.length);
		var delay = (Math.random () * delays[dr] + 10) * 1000;
		console.log (delays[dr]);
		console.log (delay);
		console.log (ads.length);
		later (delay, next);
	    };

	    var urls = {Urls: [url]};
	    call ("sobnik", "POST", urls, function (data) {
		console.log (data);
		// FIXME check date
		if (data.length == 0)
		{
		    console.log ("expired");
		    chrome.runtime.sendMessage ("", {type: "open", url: url});
		    delayNext ();
		}
		else
		{
		    console.log ("exists");
		    next ();
		}
	    }, /* statbacks= */null, function () {
		// go to next on error
		console.log ("error");
		next ();
	    });
	};

	next ();
    }

    var gather = function (selector, pattern)
    {
	var elements = $(selector);
	var map = {};
	var regexp = pattern ? new RegExp(pattern) : null;
	elements.each (function() {
	    var url = $(this).attr("href");
	    if (regexp && !regexp.test(url))
		return;
	    map[url] = 0;
	});

	var result = [];
	for (var url in map)
	    result.push(url);
	return result;
    }

    var start = function (board) {

	var scan = function () 
	{
	    var ads = gather (board.selector, board.pattern);
	    open (ads);
	}

	later ((Math.random () * 10 + 1) * 1000, function () {

	    // if current page matches pattern - start sobnik
	    var loc = location.href;
	    for (var i = 0; i < board.urls.length; i++)
	    {
		if (loc.match(board.urls[i]) != null)
		{
		    console.log ("Scanning "+loc);
		    scan ();
		    return;
		}
	    }
	    console.log ("No match "+loc);
	});
    }

    return {
	start: start
    }
}

(function () {
    chrome.runtime.onMessage.addListener(function (message, sender, reply) {
	console.log (message);
	if (message.type == "ping")
	    reply ({type: "pong"});
    });

    var checkDone = function () {
	var done = $("#sobnik-chrome-done-signal");
	if (done && done.length > 0)
	    chrome.runtime.sendMessage ("", {type: "done"});	    
	else
	{
	    var to = setTimeout (function () {
		clearTimeout (to);
		checkDone ();
	    }, 1000);
	}
    }

    checkDone ();

} ());
