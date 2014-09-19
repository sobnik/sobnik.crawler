
function sobnikApi () 
{

    var api_url = "http://sobnik.com/api/";
    var crossDomain = false;
//    var api_url = "http://localhost:8081/api/";
//    var crossDomain = true;

    var call = function (method, type, data, callback, statbacks, errback)
    {
	$.ajax ({
	    url: api_url + method,
	    type: type,
	    data: JSON.stringify (data),
	    crossDomain: crossDomain,
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

    var open = function (board, ads)
    {
	var opened = 0;
	var processed = 0;
	var next = function ()
	{
	    if (processed > 10 || ads.length == 0)
	    {
		console.log("done");
		chrome.runtime.sendMessage ("", {type: "done"});
		return;
	    }
	    
	    var ad_index = Math.floor (Math.random () * ads.length);
	    var ad = ads[ad_index];
	    ads.splice (ad_index, 1);
	    var url = ad;
	    if (ad.indexOf (location.hostname) < 0)
		url = location.origin + ad;
	    var id = board.url2id (url);
	    console.assert (id, "Bad ad id "+url)
	    console.log (id + " " + url);

	    var delayNext = function () {
		// FIXME make distribution more stochastic
		var delays = [10, 40, 50];
		var dr = Math.floor (Math.random () * delays.length);
		var delay = (Math.random () * delays[dr] + 10) * 1000;
//		var delay = (Math.random () * 2 + 2) * 1000;
		if (opened > 2)
		    delay *= opened / 2;
//		console.log (delays[dr]);
		console.log (delay);
		console.log (ads.length);
		later (delay, next);
	    };

	    var errback = function ()
	    {
		// go to next on error
		console.log ("error");
		// FIXME add delay here too to lower the load on sobnik
		next ();
	    }

	    var ids = {AdIds: [id], Async: true};
	    call ("sobnik", "POST", ids, function (data) {
		console.log (data);
		var success = function (data)
		{
		    // FIXME check date
		    if (data.length == 0)
		    {
			console.log ("expired");
			processed++;
			chrome.runtime.sendMessage ("", {type: "open", url: url}, {}, function (reply) {
			    opened = reply.opened;
			    console.log ("Opened "+opened);
			});
			delayNext ();
		    }
		    else
		    {
			console.log ("exists");
			next ();
		    }
		}

		var retry = function ()
		{
		    var req = {TaskId: data.Id};
		    later (1000, function () {
			call ("result", "POST", req, /* callback= */null, {
			    200: success,
			    204: retry,
			    400: errback,
			}, retry);
		    });
		}

		retry ();

	    }, /* statbacks= */null, errback);
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
	console.log ("Gathered");
	console.log (result);
	return result;
    }

    var start = function (board) {

	var scan = function () 
	{
	    var ads = gather (board.selector, board.pattern);
	    open (board, ads);
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
