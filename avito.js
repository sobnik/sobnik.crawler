(function () {

    var sob = sobnikApi ();

    var board = {
	selector: "div.b-catalog-list div.item h3 a", 
	pattern: ".*kvartiry.*",
	urls: [
	    "http://www.avito.ru/[^/]+/kvartiry/sdam/na_dlitelnyy_srok"
	],
    }

    sob.start (board);

} ());
