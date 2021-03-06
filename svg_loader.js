/* Shishen Sho mahjong game
 * Copyright Sven Petai <hadara@bsd.ee> 2011
 * Licence: GPLv3
 * Artwork is taken from the KDE project and is under respective copyrights & licences
 */
"use strict";

var SVGNS = "http://www.w3.org/2000/svg";
var XLINKNS = "http://www.w3.org/1999/xlink";

/*
 * currently we have following methods for getting access to the tileset that
 * is stored in a separate SVG file:
 * *) if inside XHTML container then we can just use <object> and use external 
 *    <use> references
 * *) fetch the svg file with XHR req. and place resulting <svg> directly into
 *    our <svg> 
 * *) fetch the svg file with XHR and copy elements that interest us directly into
 *    our <svg>
 */

function ExternalSVG () {
    /* class that deals with getting access to the elements
     * in some external SVG file
     */
}

ExternalSVG.prototype.init = function(filename, cb) {
    this.filename = filename;

    // will hold reference to the container of our tileset
    this.domref = null;
}

ExternalSVG.prototype.get_orig_domref_by_id = function(element_id) {
    /* return reference to the element idenfitied by element_id in the original
     * tileset DOM
     */
    return this.domref.getElementById(element_id);
}

ExternalSVG.prototype.get_element_ref = function(element_id) {
    return this.filename+"#"+element_id;
}

ExternalSVG.prototype.get_use_for_elem = function(element_id) {
    /* return a USE DOM object that references the element specified with element_id
     */
    var origtile = this.get_orig_domref_by_id(element_id);
    var pos = getScreenBBox(origtile);
    var bg = document.createElementNS(SVGNS, "use");
    bg.setAttribute('x', -pos.x);
    bg.setAttribute('y', -pos.y);
    bg.setAttributeNS(XLINKNS, "href", this.get_element_ref(element_id));
    return bg;
}

ExternalSVG.prototype.hide_elements = function(root) {
    // NOOP
    ; 
}

function EmbedTagExternalTileset() {}
EmbedTagExternalTileset.prototype = new ExternalSVG;
EmbedTagExternalTileset.prototype.constructor = EmbedTagExternalTileset;

EmbedTagExternalTileset.prototype.init = function (filename, cb) {
    /* if our container is an XHTML file then create a new embed element in the DOM
     * that we can use to get access to the DOM of the external SVG file
     */
    ExternalSVG.prototype.init.call(this, filename, cb);
    // see http://w3.org/TR/SVG11/struct.html#InterfaceGetSVGDocument
    // <embed id="tileset" onload="alert('embed');" src="artwork/default.svgz" width="0" height="0" type="image/svg+xml"></embed>
    var e = document.createElement("embed");
    // FIXME: generate dynamic name for this
    e.setAttribute("id", "tileset");
    e.setAttribute("src", filename);
    e.setAttribute("width", "0");
    e.setAttribute("height", "0");
    e.setAttribute("type", "image/svg+xml");
    var self = this;
    e.onload = function () { self.xhtml_embed_callback(cb) };
    document.getElementsByTagName('body')[0].appendChild(e);
}

EmbedTagExternalTileset.prototype.xhtml_embed_callback = function (cb) {
    /* called when the external SVG has been loaded
     */
    var embed = document.getElementById('tileset');

    try {
        this.domref = embed.getSVGDocument();
    } catch(exception) {
        alert('getSVGDocument interface not available. Try some other browser.');
    }
    
    my_log('start board init');
    if (cb !== undefined) {
        cb();
    }
}


function XHRExternalSVG() {};
XHRExternalSVG.prototype = new ExternalSVG;
XHRExternalSVG.prototype.constructor = XHRExternalSVG;

XHRExternalSVG.prototype.init = function (filename, cb) {
    ExternalSVG.prototype.init.call(this, filename, cb);
    this.import_tileset(cb);
}

XHRExternalSVG.prototype.get_element_ref = function(element_id) {
    return '#'+element_id;
}

XHRExternalSVG.prototype.import_tileset = function(cb) {
    // we really shouldn't have to import anything from the tileset
    // but there are different bugs & missing functionality in current SVG 
    // implementations in the browsers
    // which make it impossible to get access to the original elements
    // dom tree just by using USE tag with external reference.
    // webkit doesn't implement external references in the use tags
    // firefox & opera do not seem to implement instanceRoot attribute for the USE elements
    function fetchXML  (url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function (evt) {
            //Do not explicitly handle errors, those should be
            //visible via console output in the browser.
            if (xhr.readyState === 4) {
                callback(xhr.responseXML);
            }
        };
        xhr.send(null);
    };

    var self = this;
    //fetch the document
    try {
        fetchXML(self.filename, function(newSVGDoc) { self.xml_parse_cb(newSVGDoc, cb) });
    } catch(e) {
        alert('Failed to load tileset: '+e+'typeof'+typeof(e));
    }
}

XHRExternalSVG.prototype.reposition_elements = function () {
    /* translate all the tiles to 0;0
     */
    for (var i=0; i<Board.prototype.tiles.length; i++) {
        var element_id = Board.prototype.tiles[i];
        var e = document.getElementById(element_id);
        var bx = e.getBBox();
        //var bx = getScreenBBox(e);
        e.setAttribute('transform', 'translate('+(-bx.x)+', '+(-bx.y)+')');
        //e.setAttribute('transform', 'scale(-0.3)');
    }
}

XHRExternalSVG.prototype.hide_elements = function (root) {
    /* recursivelly hide all the elements in the given tree
     * useful for in the case when some of subelements in the original
     * tileset have exclicit visibility=visible style rule
     */
    if (root === undefined) {
        root = this.origdom;
    }

    if (root.hasChildNodes !== undefined && root.hasChildNodes()) {
        var children = root.childNodes;

        for (var i=0; i<children.length; i++) {
            this.hide_elements(children[i]);
        }
    }
    //if (root.children === undefined) {
    //    return;
    //}
    if (root.style) {
        root.style.visibility = "hidden";
    } else if (root.setAttribute !== undefined) {
        root.setAttribute('visibility', 'hidden');
        root.setAttribute('display', 'none');
    }
}

function XHRExternalDirectSVG() {};
XHRExternalDirectSVG.prototype = new XHRExternalSVG;
XHRExternalDirectSVG.prototype.constructor = XHRExternalDirectSVG;
/* place the tileset at this position on the canvas after loading
 * usually it's not desirable to see the original tileset so this
 * should probably be somewhere outside of the visisble
 */
XHRExternalDirectSVG.prototype.TILESET_POSITION = Array(-10000, -10000);

XHRExternalDirectSVG.prototype.get_use_for_elem = function(element_id) {
    var use = XHRExternalSVG.prototype.get_use_for_elem.call(this, element_id);
    use.setAttribute('x', use.x.baseVal.value+this.TILESET_POSITION[0]);
    use.setAttribute('y', use.y.baseVal.value+this.TILESET_POSITION[1]);
    return use;
}

XHRExternalDirectSVG.prototype.xml_parse_cb = function(newSVGDoc, cb) {
    /* just insert the whole guest svg tree into ours 
     */
    //import it into the current DOM
    var n = document.importNode(newSVGDoc.documentElement, true);
    n.setAttribute('id', 'orig_tileset');
    n.setAttribute('x', this.TILESET_POSITION[0]);
    n.setAttribute('y', this.TILESET_POSITION[1]);

    // everything will be in our tree so just use DOM
    this.domref = document;
    this.origdom = n;
    var wrapped_cb = function () { cb() };

    document.documentElement.appendChild(n);
    // XXX: neither nice or reliable but I have not yet
    // thought of a better method
    setTimeout(wrapped_cb, 1000);
}

function XHRExternalCopySVG() {};
XHRExternalCopySVG.prototype = new XHRExternalSVG;
XHRExternalCopySVG.prototype.constructor = XHRExternalCopySVG;

XHRExternalCopySVG.prototype.xml_parse_cb = function(newSVGDoc, cb){
    /* copy interesting elements from the quest svg tree to ours
     */
    //import it into the current DOM
    this.copied_elements = {};
    this.tileset_svg = newSVGDoc;
    this.tgt = document.getElementById('tileset_internal');

    var n = document.importNode(newSVGDoc.documentElement, true);
    n.setAttribute('id', 'orig_tileset');
    // everything will be in our tree so just use DOM
    this.domref = document;
    this.origdom = n;
    this.copy_defs(newSVGDoc, document.documentElement);
    cb();
}

XHRExternalCopySVG.prototype.get_use_for_elem = function (element_id) {
    /* we copy elements to parent dom lazily, only once they are requested
     */
    if (!this.copied_elements[element_id]) {
        this.copy_element_to_dom(this.tileset_svg, this.tgt, element_id);
    }
    // call parent
    return ExternalSVG.prototype.get_use_for_elem.call(this, element_id);
}

XHRExternalCopySVG.prototype.copy_defs = function (origdom, targetdom) {
    var defs = origdom.getElementsByTagName('defs');
    for (var i=0; i<defs.length; i++) {
        targetdom.appendChild(defs[i]);
    }
}

XHRExternalCopySVG.prototype.copy_element_to_our_defs = function (origdom, targetdom) {
    for (var i=0; i<Board.prototype.tiles.length; i++) {
        var element_id = Board.prototype.tiles[i];
        this.copy_element_to_dom(origdom, targetdom, element_id);
    }

    this.copy_element_to_dom(origdom, targetdom, "TILE_2");
}

XHRExternalCopySVG.prototype.copy_element_to_dom = function (origdom, targetdom, element_id) {
    var e = origdom.getElementById(element_id);
    if (!e) {
        return null;
    }
    targetdom.appendChild(e);
    this.copied_elements[element_id] = true;
}

