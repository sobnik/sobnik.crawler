/*  
    avito.js - sobnik crawler avito module

    Copyright (c) 2014 Artur Brugeman <brugeman.artur@gmail.com>
    Copyright other contributors as noted in the AUTHORS file.

    This file is part of sobnik.chrome, Sobnik plugin for Chrome:
    http://sobnik.com.

    This is free software; you can redistribute it and/or modify it under
    the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation; either version 3 of the License, or (at
    your option) any later version.

    This software is distributed in the hope that it will be useful, but
    WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
    Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public
    License along with this program. If not, see
    <http://www.gnu.org/licenses/>.
*/

(function () {

    var sob = sobnikApi ();

    var board = {
	selector: "div.b-catalog-list div.item h3 a", 
	pattern: ".*kvartiry.*",
	urls: [
	    "http://www.avito.ru/[^/]+/kvartiry.*view\\=list"
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
