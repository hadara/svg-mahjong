/* Shishen Sho mahjong game
 * Copyright Sven Petai <hadara@bsd.ee> 2011
 * Licence: GPLv3
 * Artwork is taken from the KDE project and is under respective copyrights & licences
 */

var SVGNS = "http://www.w3.org/2000/svg";
var XLINKNS = "http://www.w3.org/1999/xlink";

var TILESETS = {
    "traditional": "artwork/traditional.svg",
    "default": "artwork/default.svg"
};

var TILESET = "default";

var DEBUG = false;

var global_id = 0;
var have_imported_tileset = false;

function my_log(s) {
    if (DEBUG === true && console !== undefined) {
        console.log(s);
    }
}

function ExternalSVG () {
    /* class that deals with getting access to the elements
     * in some external SVG file
     */
}

ExternalSVG.prototype.init = function(filename, cb) {
    this.filename = filename;
    // will hold reference to the container of our tileset
    this.domref = null;

    // detect out container type
    var t = document.getElementsByTagName("html");
    if (t && t.length > 0) {
        this.xhtml_init(cb)
    } else {
        this.svg_init(cb);
    }
}

ExternalSVG.prototype.get_use_for_elem = function(element_id) {
    /* return a USE DOM object that references the element specified with element_id
     */
    var origtile = this.domref.getElementById(element_id);
    var pos = getScreenBBox(origtile);
    var bg = document.createElementNS(SVGNS, "use");
    bg.setAttribute('x', -pos.x);
    bg.setAttribute('y', -pos.y);
    bg.setAttributeNS(XLINKNS, "href", this.filename+"#"+element_id);
    return bg;
}

ExternalSVG.prototype.xhtml_init = function (cb) {
    /* if our container is an XHTML file then create a new embed element in the DOM
     * that we can use to get access to the DOM of the external SVG file
     */
    // see http://w3.org/TR/SVG11/struct.html#InterfaceGetSVGDocument
    // <embed id="tileset" onload="alert('embed');" src="artwork/default.svgz" width="0" height="0" type="image/svg+xml"></embed>
    var e = document.createElement("embed");
    // FIXME: generate dynamic name for this
    e.setAttribute("id", "tileset");
    e.setAttribute("src", TILESETS[TILESET]);
    e.setAttribute("width", "0");
    e.setAttribute("height", "0");
    e.setAttribute("type", "image/svg+xml");
    var self = this;
    e.onload = function () { self.xhtml_embed_callback(cb) };
    document.getElementsByTagName('body')[0].appendChild(e);
}

ExternalSVG.prototype.xhtml_embed_callback = function (cb) {
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

ExternalSVG.prototype.svg_init = function (cb) {
    this.import_tileset(cb);
}

ExternalSVG.prototype.import_tileset = function(cb) {
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
    fetchXML(TILESETS[TILESET],function(newSVGDoc){
        //import it into the current DOM
        var n = document.importNode(newSVGDoc.documentElement, true);
        //n.setAttribute('x', -10000);
        //n.setAttribute('y', 0);
        //n.setAttribute('viewBox', "0 0 900 900");
        n.setAttribute('id', 'orig_tileset');
        //n.setAttribute('visibility', 'hidden');
        // everything will be in our tree so just use DOM
        self.domref = document;
        have_imported_tileset = true;
        self.copy_defs(newSVGDoc, document.documentElement);
        //n.addEventListener('load', function() { alert('called') }, false);
        //var tgt = document.documentElement;
        var tgt = document.getElementById('tileset_internal');
        self.copy_element_to_our_defs(newSVGDoc, tgt);
        svgroot = document.documentElement;
        //document.documentElement.appendChild(n);
        //self.reposition_elements();
        //document.documentElement.appendChild(n);
        //setTimeout(function () { cb() }, 2000);
        cb();
    }) 
}

ExternalSVG.prototype.reposition_elements = function () {
    for (var i=0; i<Board.prototype.tiles.length; i++) {
        var element_id = Board.prototype.tiles[i];
        var e = document.getElementById(element_id);
        var bx = e.getBBox();
        //var bx = getScreenBBox(e);
        e.setAttribute('transform', 'translate('+(-bx.x)+', '+(-bx.y)+')');
        //e.setAttribute('transform', 'scale(-0.3)');
    }
}

ExternalSVG.prototype.copy_defs = function (origdom, targetdom) {
    var defs = origdom.getElementsByTagName('defs');
    for (i=0; i<defs.length; i++) {
        targetdom.appendChild(defs[i]);
    }
}

ExternalSVG.prototype.copy_element_to_our_defs = function (origdom, targetdom) {
    for (var i=0; i<Board.prototype.tiles.length; i++) {
        var element_id = Board.prototype.tiles[i];
        this.copy_element_to_dom(origdom, targetdom, element_id);
    }

    this.copy_element_to_dom(origdom, targetdom, "TILE_2");
}

ExternalSVG.prototype.copy_element_to_dom = function (origdom, targetdom, element_id) {
    var e = origdom.getElementById(element_id);
    if (!e) {
        return null;
    }
    targetdom.appendChild(e);
    //var bx = getScreenBBox(e);
    //e.setAttribute('transform', 'translate('+(-bx.x)+', '+(-bx.y)+')');
}

function Tile(name) {
    this.name = name;
    this.id = global_id++;
    this.create_dom_elem();
}

Tile.prototype.dom_ref = null;
Tile.prototype.bg = null;
Tile.prototype.name = null;
Tile.prototype.height = 89;
Tile.prototype.width = 69;
Tile.prototype.x = null;
Tile.prototype.y = null;

Tile.prototype.set_board_pos = function(x, y) {
    this.x = x;
    this.y = y;
}

Tile.prototype.create_background = function() {
    /* creates fully transparent rect that is as wide as the tile so we have
     * something that covers 100% of the area and will be able to catch 
     * all the clicks because of that
     */
    r = document.createElementNS(SVGNS, "rect");
    r.setAttribute("x", 0);
    r.setAttribute("y", 0);
    r.setAttribute("height", this.height);
    r.setAttribute("width", this.width);
    r.setAttribute("fill", "yellow");
    r.setAttribute("opacity", "0");
    return r;
}

Tile.prototype.create_g = function() {
    g = document.createElementNS(SVGNS, "g");
    return g;
}

Tile.prototype.get_bg = function() {
    var t = game.tileset.get_use_for_elem("TILE_2");
    // FIXME: investigate why bg tiles are offset to the left in Ekioh
    if (navigator.userAgent.indexOf('Ekioh') != -1) {
        t.setAttribute('x', -192); // t.getAttribute('x'));
    }
    return t;
}

Tile.prototype.create_dom_elem = function() {
    my_log('create elem '+this.name);
    var g = this.create_g();
    var bg = this.create_background();
    this.bg = bg;

    var u = game.tileset.get_use_for_elem(this.name);

    g.appendChild(this.get_bg());
    g.appendChild(bg);
    g.appendChild(u);
    g.setAttribute('id', 'tile_'+global_id);
    global_id += 1;

    var self = this;
    g.onclick = function () { b.tile_selected(self); };
    if (DEBUG) {
        g.onmousedown = function (e) { 
            if (e.which != 1) { 
                b.remove_tile(self); return true;
            } 
        };
    }
    this.dom_ref = g;
    return g;
}

Tile.prototype.highlight = function() {
    this.bg.setAttribute('opacity', 0.4);
}

Tile.prototype.unhighlight = function() {
    this.bg.setAttribute('opacity', 0);
}

function Board() {
};

Board.prototype.defs = new Array(
    'TILE_1',
    'TILE_1_SEL',
    'TILE_2',
    'TILE_2_SEL',
    'TILE_3',
    'TILE_3_SEL',
    'TILE_4',
    'TILE_4_SEL'
);

Board.prototype.tiles = new Array(
        'CHARACTER_1', 
        'CHARACTER_2', 
        'CHARACTER_3', 
        'CHARACTER_4', 
        'CHARACTER_5',
        'CHARACTER_6',
        'CHARACTER_7',
        'CHARACTER_8',
        'CHARACTER_9',
        'ROD_1',
        'ROD_2',
        'ROD_3',
        'ROD_4',
        'ROD_5',
        'ROD_6',
        'ROD_7',
        'ROD_8',
        'ROD_9',
        'BAMBOO_1',
        'BAMBOO_2',
        'BAMBOO_3',
        'BAMBOO_4',
        'BAMBOO_5',
        'BAMBOO_6',
        'BAMBOO_7',
        'BAMBOO_8',
        'BAMBOO_9',
        'SEASON_1',
        'SEASON_2',
        'SEASON_3',
        'SEASON_4',
        'DRAGON_1',
        'DRAGON_2',
        'DRAGON_3',
        'FLOWER_1',
        'FLOWER_2',
        'FLOWER_3',
        'FLOWER_4',
        'WIND_1',
        'WIND_2',
        'WIND_3',
        'WIND_4'
    );

Board.prototype.dom_board = null;
Board.prototype.board = Array();
Board.prototype._free_positions = Array();

Board.prototype.previous_selection = null;

Board.prototype.height = 8;
Board.prototype.width = 18;

Board.prototype.PADDING_TOP = 100;
Board.prototype.PADDING_LEFT = 100;

Board.prototype.get_tile_by_name = function(name) {
    return new Tile(name);
}

Board.prototype.get_tile_pair = function(tile_name) {
    return Array(this.get_tile_by_name(tile_name), this.get_tile_by_name(tile_name));
}

Board.prototype.get_random_tile_name = function() {
    var randpos = Math.floor(Math.random()*this.tiles.length);
    return this.tiles[randpos];
}

Board.prototype.positon_is_free = function() {
    return true;
}

Board.prototype.draw_path = function(path) {
    var path_str = "";
    var path_elem = document.createElementNS(SVGNS, "path");
    var h = Tile.prototype.height;
    var w = Tile.prototype.width;

    // draw the line through tile centres all along the path
    for (var i=0; i<path.length; i++) {
        if (i === 0) {
            var cmd = 'M';
        } else {
            var cmd = 'L';
        }
        var x = this.PADDING_TOP+(((path[i].x)*w)+w/2);
        var y = ((path[i].y+1)*h)+h/2;
        path_str += cmd+" "+x+" "+y;
    }

    // FIXME: create template for the path element in the container file
    // and add class too so CSS could be used for styling 
    path_elem.setAttribute("d", path_str);
    path_elem.setAttribute("fill", "none");
    path_elem.setAttribute("stroke", "red");
    path_elem.setAttribute("stroke-width", "3");
    svgroot.appendChild(path_elem);
    setTimeout(function() { svgroot.removeChild(path_elem) }, 400);
}

Board.prototype.get_random_free_position = function() {
    var freelist = this._free_positions;
    var fpos = Math.floor(Math.random()*this._free_positions.length);
    return this._free_positions.splice(fpos, 1)[0];
}

Board.prototype.translate_to_position = function(elem, x, y) {
    my_log('translate to:'+x+';'+y);
    elem.setAttribute('transform', 'translate('+x+', '+y+')');
}

Board.prototype.position_tile = function(t) {
    var coords = this.get_random_free_position();
    this.board[coords[1]][coords[0]] = t;
    var x = this.PADDING_LEFT + (coords[0] * t.width);
    var y = this.PADDING_TOP + (coords[1] * t.height);
    this.translate_to_position(t.dom_ref, x, y);
    t.set_board_pos(coords[0], coords[1]);
}

Board.prototype.construct_board = function() {
    var poslist = Array();

    for (var i=0; i<this.height; i++) {
        var tmp_ar = Array();
        for (var j=0; j<this.width; j++) {
            poslist.push(Array(j, i));
        }
        this.board.push(tmp_ar);
    }
    this._free_positions = poslist;
}

Board.prototype.lay_out_board = function() {
    /* injects tiles into the DOM tree in  correct order. 
     * We have to do it as a separate step since SVG follows 
     * painters model so the order in which tiles appear in the DOM matters
     */
    for (var i=0; i<this.height; i++) {
        for (var j=0; j<this.width; j++) {
            this.dom_board.appendChild(this.board[i][j].dom_ref);
        }
    }
}

Board.prototype.init = function() {
    var i, tlen;
    var x=0, y=0;

    this.construct_board();
    this.dom_board = document.getElementById('hgameboard');
    svgroot = this.dom_board;

    var element_pairs = (this.height*this.width)/2;
    for (i=0; i<element_pairs; i++) {
        var rtile = this.get_random_tile_name();
        my_log('random tile '+rtile);
        var tp = this.get_tile_pair(rtile);
        my_log('positioning '+tp);
        this.position_tile(tp[0]);
        this.position_tile(tp[1]);
        my_log('positioning done');
    }
    this.lay_out_board();

}

Board.prototype.get_all_possible_moves = function(limit) {
    /* get all the possible move paths or up to the specified limit
     */
    var moves = Array();

    for (var i=0; i<this.width; i++) {
        for (var j=0; j<this.height; j++) {
            if (this.board[j][i] !== null) {
                this.get_moves_from_tile(this.board[j][i], Array(), moves, limit);
            }
        }
    }

    return moves;
}

Board.prototype.have_moves_left = function() {
    if (this.get_all_possible_moves(1).length > 0) {
        return true;
    }
    return false;
}

Board.prototype.remove_element_from_board = function (e) {
    b.translate_to_position(e, -200, -200);
}

Board.prototype.print_path = function (path) {
    var pstr = 'path:';
    for (var i=0; i<path.length; i++) {
        pstr += path[i].x+';'+path[i].y;
        pstr += ' ';
    }
    my_log(pstr);
}

Board.prototype.get_path_corner_count = function (path) {
    var DIRECTION_X = 0;
    var DIRECTION_Y = 1;

    if (path.length < 2) {
        return 0;
    }

    var corners = 0;
    
    var cur_direction = null;
    var lastelem = path[0];

    for (var i=1; i<path.length; i++) {
        var e = path[i];

        if (lastelem.x === e.x && cur_direction !== DIRECTION_X) {
            cur_direction = DIRECTION_X;
            corners += 1;
        } else if (lastelem.y === e.y && cur_direction !== DIRECTION_Y) {
            cur_direction = DIRECTION_Y;
            corners += 1;
        }
        lastelem = e;
    }
    //this.print_path(path);
    return corners;
}

Board.prototype.get_moves_from_tile = function (e1, path, paths, limit, end_elem) {
    /* append all the possible moves from the tile e1 into the paths array
     * each path element will be an object that has at least x and y keys
     *
     * @arg limit: can be used to specify how many paths at the most do you want to get
     *    If undefined then all the possible paths are returned.
     * @arg end_elem: can be used to specify that you only want paths that end with certain
     *    element. Has to be Tile object if defined.  
     */
    my_log('recurse');
    var SIDEMAP = Array(
        [-1, 0], // left
        [0, -1], // upper
        [1, 0], // right
        [0, 1] // below
    );
    var MAX_ALLOWED_CORNERS = 3;

    if (path.length === 0) {
        path.push(e1);
    }

    if (limit !== undefined && limit <= paths.length) {
        // if caller did want all possible paths and we already have enough
        // then just return right away
        return;
    }

    var corner_count = this.get_path_corner_count(path);
    my_log('conerts'+corner_count);

    if (corner_count > MAX_ALLOWED_CORNERS) {
        // push selection to paths if we have success
        // no need to check for match if 
        my_log('path count too large');
        return;
    } 

    if (path.length > 1) {
        var lastelem = path[path.length-1];
        my_log('lastelem '+lastelem);

        if (lastelem.name === undefined) {
            // is outside the board or is empty
            my_log('last pathelem is empty');
        } else if (lastelem.name === e1.name && 
            (end_elem === undefined || 
                (lastelem.x === end_elem.x && lastelem.y === end_elem.y)
            )) {
            // found a good path!
            // construct a copy and store in the paths array
            var a = Array();

            for (var i=0; i<path.length; i++) {
                var tmp = path[i];
                my_log('push new path'+tmp.x+' '+tmp.y);
                a.push({'x': tmp.x, 'y': tmp.y});
            }

            paths.push(a);
            this.print_path(a);
            my_log('identity match succeeded');
            return;
        } else if (lastelem.name !== undefined) {
            // we have encountered taken position that did not match
            // out identitiy. no need to investigate this path any further
            return;
        }
    }

    var this_tile = path[path.length-1];
    var last_elem = null;
    if (path.length > 1) {
        var last_elem = path[path.length-2];
    }

    for (i=0; i<4; i++) {
        // check all the sides of the tile
        var tile_pos = Array(this_tile.x+SIDEMAP[i][0], this_tile.y+SIDEMAP[i][1]);

        if (last_elem !== null) {
            my_log('check lastelem'+last_elem.x+' '+last_elem.y+'   '+tile_pos[0]+' '+tile_pos[1]);
            if (tile_pos[0] === last_elem.x && tile_pos[1] === last_elem.y) {
                // do not go back the same way we came from
                continue;
            }
        }

        my_log('investigate sidepos:'+tile_pos);

        if ((tile_pos[0] >= 0 && tile_pos[0] < this.width) && 
            (tile_pos[1] >= 0 && tile_pos[1] < this.height)) {
            // is within the board
            var tmp = b.board[tile_pos[1]][tile_pos[0]];

            if (tmp === null) {
                // empty position
                tmp = {'x':tile_pos[0], 'y': tile_pos[1]};
                my_log('recurse on empty position '+tmp);
            } else {
                // position is filled, if it's not a match then there's no need to continue
                if (e1.name !== tmp.name) {
                    continue;
                }
            }
        } else {
            // not within the board, recurse if less than 1 step away
            if ((tile_pos[0] >= -1 && tile_pos[0] <= this.width) &&
                (tile_pos[1] >= -1 && tile_pos[1] <= this.height)) {
                my_log('not on board tile pos: '+tile_pos[0]+' '+tile_pos[1]);
                //var tmp = b.board[tile_pos[1]][tile_pos[0]];
                var tmp = {'x': tile_pos[0], 'y': tile_pos[1]}
            } else {
                // more than 1 step away from the board
                my_log('continue:'+tile_pos);
                continue;
            }
        }

        path.push(tmp);
        this.get_moves_from_tile(e1, path, paths, limit, end_elem);
        path.pop();
    }
}

Board.prototype.is_ok_to_pair = function (e1, e2) {
    if (e1.name !== e2.name) {
        return false;
    }

    var paths = Array();
    b.get_moves_from_tile(e1, Array(), paths, 1, e2);
    for (var i=0; i<paths.length; i++) {
        var plast = paths[i][paths[i].length-1];
        // this should actually be the board element so
        // maybe we can just compare pointers... does something
        // like that exist in the JS
        if (plast.x === e2.x && plast.y === e2.y) {
            this.draw_path(paths[i]);
            return true;
        }
    }

    return false;
}

Board.prototype.cleanup_tile_animation = function (tile) {
    /* remove the tile and animation after the hide animation is finished
     */
    b.remove_element_from_board(tile.dom_ref);
    svgroot.removeChild(tile.anim);
    delete tile.anim;
}

Board.prototype.remove_tile = function (tile) {
    /* remove element from visual and internal boards
     */
    var master_anim = document.getElementById('tile_hide_effect');
    var anim = master_anim.cloneNode(false);
    if (!anim) {
        // probably no SMIL support, just hide the tile right away
        b.remove_element_from_board(tile.dom_ref);
        return;
    }

    anim.setAttributeNS(XLINKNS, 'href', '#'+tile.dom_ref.getAttribute('id'));
    svgroot.appendChild(anim);
    tile.anim = anim;
    anim.beginElement();
    var self = this;
    // it would be far nicer to connect the animation cleanup with
    // animation onend event but that doesn't seem to be widely implemented
    setTimeout(function() { self.cleanup_tile_animation(tile) }, 1000);
    b.board[tile.y][tile.x] = null;
}

Board.prototype.tile_selected = function (tile) {
    if (tile === b.previous_selection) {
        b.previous_selection.unhighlight();
        b.previous_selection = null;
        return;
    }

    if (b.previous_selection !== null) {
        /* we already have a tile selected */
        if (tile.name === b.previous_selection.name && b.is_ok_to_pair(tile, b.previous_selection)) {
            /* same tile type */
            b.remove_tile(tile);
            b.remove_tile(b.previous_selection);
            b.previous_selection = null;
            if (b.have_moves_left() === false) {
                alert("No more moves!");
                b.init();
            }
        } else {
            b.previous_selection.unhighlight();
            b.previous_selection = null;
        }
    } else {
        tile.highlight();
        b.previous_selection = tile;
    }
}

Board.prototype.get_def = function () {
    return d;
}

Board.prototype.create_use = function () {
    use = document.createElementNS(SVGNS, "use");
    return use;
}

function Clock() {
    // clock that measures how long you have played
}

Clock.prototype.init = function () {
    this.clock_dom_ref = document.getElementById('clock');
    this.reset();
}

Clock.prototype.reset = function () {
    this.start_time = new Date();
}

Clock.prototype.timer_callback = function () {
    var timediff_ms = new Date() - this.start_time;
    var seconds = parseInt(timediff_ms/1000, 10);
    var minutes = parseInt(seconds/60, 10);
    seconds = parseInt(seconds%60, 10)
    if (seconds < 10) {
        seconds = '0'+seconds;
    }
    if (minutes < 10) {
        minutes = '0'+minutes;
    }
    var timestr = minutes+":"+seconds;
    this.clock_dom_ref.textContent = timestr;
    var self = this;
    setTimeout(function() { self.timer_callback() }, 1000);
}

Clock.prototype.start = function () {
    this.timer_callback();
}



function Game() {
}

// has hints function been used?
Game.prototype.cheat_mode = false;
Game.prototype.started_at = null;
Game.prototype.curfocus = null;
Game.prototype.gravity = true;
Game.prototype.KEY_HINT = 72;
Game.prototype.KEY_NEW = 78;
Game.prototype.KEY_SETTINGS = 83;
Game.prototype.KEY_RIGHT = 39;
Game.prototype.KEY_UP = 38;
Game.prototype.KEY_LEFT = 37;
Game.prototype.KEY_DOWN = 40;
Game.prototype.KEY_OK = 13;

Game.prototype.keyhandler = function (evt) {
    key = evt.which;
    if (key === game.KEY_HINT) {
        this.show_hint();
    } else if (key === game.KEY_NEW) {
        this.new_game();
    } else if (key === game.KEY_SETTINGS) {
        this.show_settings();
    } else if (key === game.KEY_RIGHT) {
        this.focus(1, 0);
    } else if (key === game.KEY_UP) {
        this.focus(0, -1);
    } else if (key === game.KEY_LEFT) {
        this.focus(-1, 0);
    } else if (key === game.KEY_DOWN) {
        this.focus(0, 1);
    } else if (key === game.KEY_OK) {
        this.select_focused();
    } else {
        my_log('unknown key pressed:'+key);
    }
}

Game.prototype.select_focused = function () {
    if (this.curfocus === null) {
        return false;
    }
    this.b.tile_selected(this.b.board[this.curfocus[1]][this.curfocus[0]]);
}

Game.prototype.focus = function (x, y) {
    if (this.curfocus === null) {
        this.curfocus = Array(0, 0);
        this.init_focusbox();
        this.draw_focus();
        return;
    }

    this.curfocus[0] += x;
    this.curfocus[1] += y;

    if (this.curfocus[0] > this.b.width) {
        this.curfocus[0] = 0;
    } else if (this.curfocus[0] < 0) {
        this.curfocus[0] = this.b.width;
    }

    if (this.curfocus[1] > this.b.height) {
        this.curfocus[1] = 0;
    } else if (this.curfocus[1] < 0) {
        this.curfocus[1] = this.b.height;
    }

    this.draw_focus();
}

Game.prototype.draw_focus = function () {
    if (this.curfocus === null) {
        return;
    }

    var fb = document.getElementById('focusbox');
    var bbox = getScreenBBox(fb);
    var x = this.b.PADDING_LEFT + (this.curfocus[0] * bbox.width);
    var y = this.b.PADDING_TOP + (this.curfocus[1] * bbox.height);
    this.b.translate_to_position(fb, x, y);
}

Game.prototype.init_focusbox = function () {
    var fb = document.getElementById('focusbox_template');
    fb.setAttribute('id', 'focusbox');
    svgroot.appendChild(fb);
}

Game.prototype.show_hint = function () {
    this.cheat_mode = true;
    var p = b.get_all_possible_moves(1);

    if (p.length === 0) {
        alert('no more moves!');
    } else {
        b.draw_path(p[0]);
    }
}

Game.prototype.show_settings = function () {
    /* move dialog to the end of the DOM tree
     * so it would actually be visible
     */
    var setting_dialog = document.getElementById('settings_dialog');
    svgroot.removeChild(setting_dialog);
    svgroot.appendChild(setting_dialog);
}

Game.prototype.board_init = function () {
    /* called after the tileset has been loaded
     */
    my_log('board init');
    this.b = new Board();
    b = this.b; // FIXME: get rid of it
    this.b.init();

    this.clock.start();
}

Game.prototype.new_game = function () {
    this.reset();
    this.b.init();
}

Game.prototype.reset = function () {
    this.cheat_mode = false;
    this.started_at = null;
    this.clock.reset();
    // clear board & DOM
}

Game.prototype.init = function () {
    var self = this;

    this.clock = new Clock();
    this.clock.init();

    this.reset();
    document.onkeydown = function (e) { return self.keyhandler(e) };

    this.tileset = new ExternalSVG();
    this.tileset.init(TILESETS[TILESET], function () { self.board_init(); });
}

function init() {
    game = new Game();
    game.init();
}
