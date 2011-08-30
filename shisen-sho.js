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

var svgdoc = null;

var global_id = 0;
var have_imported_tileset = false;

function my_log(s) {
    if (DEBUG === true && console !== undefined) {
        console.log(s);
    }
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
    /* creates full transparent rect that is as wide as the tile so we have
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

//Tile.prototype.initial_positioning = function(self) {
//    var pos = getScreenBBox(self.dom_ref);
//    console.log(pos.x+" "+pos.y);
//    //self.dom_ref.setAttribute('x', -pos.x);
//    //self.dom_ref.setAttribute('y', -pos.y);
//}

Tile.prototype.create_g = function() {
    g = document.createElementNS(SVGNS, "g");
    return g;
}

Tile.prototype.get_bg = function() {
    var origtile = svgdoc.getElementById("TILE_2");
    var pos = getScreenBBox(origtile);
    var bg = document.createElementNS(SVGNS, "use");
    bg.setAttribute('x', -pos.x);
    bg.setAttribute('y', -pos.y);
    bg.setAttributeNS(XLINKNS, "href", TILESETS[TILESET]+"#TILE_2");
    return bg;
}

Tile.prototype.create_dom_elem = function() {
    my_log('create elem '+this.name);
    var g = this.create_g();
    var bg = this.create_background();
    this.bg = bg;

    var u = document.createElementNS(SVGNS, "use");
    var t = svgdoc.getElementById(this.name);
    if (t === undefined || t === null) {
        alert("couldn't find element "+this.name);
        return undefined;
    }

    var bb = getScreenBBox(t);
    u.setAttribute('x', -bb.x);
    u.setAttribute('y', -bb.y);
    my_log("orig tile coords: "+bb.x+" "+bb.y);
    u.setAttribute('id', 'use_'+global_id);
    global_id += 1;

    if (have_imported_tileset) {
        // our tileset is imported into our DOM
        var tile_href = '#'+this.name;
    } else {
        // use external <use> reference
        var tile_href =  TILESETS[TILESET]+'#'+this.name;
    }

    u.setAttributeNS(XLINKNS, "href", tile_href);
    g.appendChild(this.get_bg());
    g.appendChild(bg);
    g.appendChild(u);
    g.setAttribute('id', 'tile_'+global_id);
    global_id += 1;

    var self = this;
    g.onclick = function () { b.tile_selected(self); };
    if (DEBUG) {
        g.onmousedown = function (e) { if (e.which != 1) { b.remove_tile(self); return true;} };
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

Board.prototype.Y_PADDING = 100;

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
    path_str = "M "+(((path[0].x)*w)+w/2)+" "+(((path[0].y+1)*h)+h/2);
    for (var i=1; i<path.length; i++) {
        path_str += " L "+(((path[i].x)*w)+w/2)+" "+(((path[i].y+1)*h)+h/2);
    }
    path_elem.setAttribute("d", path_str);
    path_elem.setAttribute("fill", "none");
    path_elem.setAttribute("stroke", "red");
    path_elem.setAttribute("stroke-width", "3");
    svgroot.appendChild(path_elem);
    setTimeout(function() { svgroot.removeChild(path_elem) }, 500);
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
    this.translate_to_position(t.dom_ref, coords[0]*t.width, this.Y_PADDING+(coords[1]*t.height));
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

function Game() {
}

// has hints function been used?
Game.prototype.cheat_mode = false;
Game.prototype.started_at = null;
Game.prototype.KEY_HINT = 72;
Game.prototype.KEY_NEW = 78;

Game.prototype.keyhandler = function (evt) {
    key = evt.which;
    if (key === game.KEY_HINT) {
        this.show_hint();
    } else if (key === game.KEY_NEW) {
        this.new_game();
    } else {
        my_log('unknown key pressed:'+key);
    }
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

Game.prototype.xhtml_embed_callback = function () {
    var embed = document.getElementById('tileset');

    try {
        svgdoc = embed.getSVGDocument();
    } catch(exception) {
        alert('getSVGDocument interface not available. Try some other browser.');
    }
    
    my_log('start board init');
    this.board_init();
}

Game.prototype.xhtml_init = function () {
    /* this hack gets access to the SVG artwork file through the embed element in the
     * XHTML document
     */
    // see http://w3.org/TR/SVG11/struct.html#InterfaceGetSVGDocument
    // <embed id="tileset" onload="alert('embed');" src="artwork/default.svgz" width="0" height="0" type="image/svg+xml"></embed>
    var e = document.createElement("embed");
    e.setAttribute("id", "tileset");
    e.setAttribute("src", TILESETS[TILESET]);
    e.setAttribute("width", "0");
    e.setAttribute("height", "0");
    e.setAttribute("type", "image/svg+xml");
    var self = this;
    e.onload = function () { self.xhtml_embed_callback() };
    document.getElementsByTagName('body')[0].appendChild(e);
}

Game.prototype.svg_init = function () {
    // not much to do in the SVG case
    this.import_tileset(this.board_init);
}

Game.prototype.import_tileset = function (cb) {
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

    //fetch the document
    fetchXML(TILESETS[TILESET],function(newSVGDoc){
        //import it into the current DOM
        var n = document.importNode(newSVGDoc.documentElement, true);
        n.setAttribute('x', -1000);
        //n.setAttribute('y', 0);
        //n.setAttribute('viewBox', "0 0 900 900");
        n.setAttribute('id', 'orig_tileset');
        // everything will be in our tree so just use DOM
        svgdoc = document;
        document.documentElement.appendChild(n);
        have_imported_tileset = true;
        cb();
    }) 
}

Game.prototype.board_init = function () {
    my_log('board init');
    this.b = new Board();
    b = this.b; // FIXME: get rid of it
    this.b.init();
}

Game.prototype.new_game = function () {
    this.reset();
    this.b.init();
}

Game.prototype.reset = function () {
    this.cheat_mode = false;
    this.started_at = null;
    // clear board & DOM
}

Game.prototype.init = function () {
    var self = this;
    document.onkeydown = function (e) { return self.keyhandler(e) };

    this.reset();

    var t = document.getElementsByTagName("html");
    if (t && t.length > 0) {
        this.xhtml_init()
    } else {
        this.svg_init();
    }
}

function init() {
    game = new Game();
    game.init();
}
