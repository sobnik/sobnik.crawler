(function () {

    var sob = sobnikApi ();

    var board = {
	selector: "div.b-catalog-list div.item h3 a", 
	pattern: ".*kvartiry.*",
	urls: [
	    "http://www.avito.ru/[^/]+/kvartiry/sdam/na_dlitelnyy_srok"
	],

	url2id: function (url) {
	    var id = url.match (/\d+$/);
	    if (!id)
		return "";
	    return "avito:"+id;
	},
    }

    sob.start (board);

} ());
