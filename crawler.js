/* 
   Latner is an automatic crawler for Sobnik.
   It's a browser plugin that opens the boards, scans them,
   and opens up tabs that are processed with Sobnik (parsed, etc).

 */
(function () {

    var pingTime = 30000; // 30 sec

    var opened = {};

    var urls = [
	"http://www.avito.ru/moskva/kvartiry/sdam/na_dlitelnyy_srok?user=1&view=list&p=2",
    ];

    var incognito = function (callback) 
    {
	chrome.windows.getAll ({}, function (windows) {

	    for (var i = 0; i < windows.length; i++)
	    {
		if (windows[i].incognito)
		{
		    console.log ("Found window "+windows[i].id)
		    callback (windows[i].id);
		    return;
		}
	    }

	    console.log ("Creating window")
	    chrome.windows.create ({
		incognito: true
	    }, function (window) {
		console.log ("Created window "+window.id)
		callback (window.id);
	    })
	})
    }

    var start = function () 
    {
	incognito (function () {
	    for (var i = 0; i < urls.length; i++)
		open (urls[i], {retry: true});

	    ping ();
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

    var check = function (tab) 
    {
	console.log (tab);
	console.log (opened[tab]);
	if (opened[tab].pings > 2)
	{
	    closeAndRetry (tab);
	}
	else
	{
	    opened[tab].pings++;

	    // ping
	    chrome.tabs.sendMessage (
		Number(tab), {type: "ping"}, function (reply) {
		    // mark as alive
		    if (reply && reply.type == "pong")
		    {
			console.log ("Pong from "+tab);
			if (opened[tab])
			{
			    opened[tab].pings = 0;
			    console.log("Alive "+tab);
			}
		    }
		}
	    );
	}
    }

    var ping = function () {
	later (pingTime, function () {

	    for (var tab in opened)
		check (tab);

	    ping ();

	});
    }

    var close = function (tab) 
    {
	chrome.tabs.remove (Number(tab), function () {
	    if (chrome.runtime.lastError)
		console.log (chrome.runtime.lastError);
	});

	var tabInfo = opened[tab];
	if (!tabInfo)
	    return null;

	delete opened[tab];
	if (tabInfo.to != null)
	    clearTimeout (tabInfo.to);
	tabInfo.to = null;

	return tabInfo;
    }

    var closeAndRetry = function (tab)
    {
	var tabInfo = close (tab);
	if (!tabInfo || !tabInfo.retry)
	    return;

	// 2-7 minutes
	var delay = (Math.random () * 5 + 2) * 60000;
	console.log ("Retry after "+delay+" "+tabInfo.url);

	later (delay, function () {
	    open (tabInfo.url, tabInfo);
	});
    }

    var done = function (sender)
    {
	if (opened[sender.tab.id])
	    closeAndRetry (sender.tab.id);
    }

    var open = function (url, settings)
    {	
	console.log (url);
	var retry = settings ? settings.retry : false;
	var ttl = settings ? settings.TTL : 0;
	var tabInfo = {url: url, retry: retry, pings: 0, to: null};

	var setTTL = function (tab, ttl) {
	    if (!ttl || ttl < 0)
		return null;

	    return later (ttl, function () {
		if (close (tab))
		    console.log ("Closed by TTL: "+tab);
	    })
	};

	var storeTab = function (tab) {
	    tabInfo.id = tab.id;
	    tabInfo.to = setTTL (tab.id, ttl);
	    opened[tab.id] = tabInfo;
	    console.log ("Created tab "+tab.id);
	};

	incognito (function (windowId) {
	    chrome.tabs.create({
		windowId: windowId,
		url: url,
		active: false,
		selected: false
	    }, storeTab);
	});
    }

    var onOpen = function (sender, message, opt) 
    {
	return open (message.url, opt);
    }

    chrome.runtime.onMessage.addListener (function (message, sender, reply) {
	if (!message.type)
	    return;

	console.log (message);

	var handlers = {
	    "done": done,
	    "open": onOpen,
	}

	var options = {
	    "open": {TTL: 60000} // 1 minute
	}

	var handler = handlers[message.type];
	var opt = options[message.type];
	if (handler)
	    return handler (sender, message, opt, reply);
    });

    start ();

} ());
