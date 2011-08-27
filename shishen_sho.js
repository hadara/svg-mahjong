/* Shishen Sho mahjong game
 * Copyright Sven Petai <hadara@bsd.ee> 2011
 * Licence: GPLv3
 * Artwork is taken from the KDE project and is under respective copyrights & licences
 */

var SVGNS = "http://www.w3.org/2000/svg";

var DEBUG = false;

var svgdoc = null;
var svgwin = null;

var global_id = 0;

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

Tile.prototype.set_board_pos = function(self, x, y) {
    self.x = x;
    self.y = y;
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

Tile.prototype.create_g = function() {
    g = document.createElementNS(SVGNS, "g");
    return g;
}

Tile.prototype.create_dom_elem = function() {
    my_log('create elem '+this.name);
    var g = this.create_g();
    var bg = this.create_background();
    this.bg = bg;

    var u = document.createElementNS(SVGNS, "use");
    var t = svgdoc.getElementById(this.name);
    var bb = t.getBBox();
    if (this.name === 'CHARACTER_1') {
        // FIXME: analyze that element and understand why it can't be handled
        // like others.
        bb.x = 0;
    }
    u.setAttribute('x', -bb.x);
    u.setAttribute('y', -bb.y);
    u.setAttributeNS("http://www.w3.org/1999/xlink", "href", 'traditional.svg#'+this.name);
    g.appendChild(bg);
    g.appendChild(u);
    var self = this;
    g.onclick = function () { b.tile_selected(self); };
    g.onmousedown = function (e) { if (e.which != 1) { b.remove_tile(self); return true;} };
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

Board.prototype.get_random_free_position = function() {
    while (1) {
        var rand_x = Math.floor(Math.random()*this.width);
        var rand_y = Math.floor(Math.random()*this.height);
        // FIXME: do it more intelligently
        if (this.board[rand_y][rand_x] === null) {
            return Array(rand_x, rand_y);
        }
    }
}

Board.prototype.translate_to_position = function(elem, x, y) {
    elem.setAttribute('transform', 'translate('+x+', '+y+')');
}

Board.prototype.position_tile = function(t) {
    var coords = this.get_random_free_position();
    this.board[coords[1]][coords[0]] = t;
    this.translate_to_position(t.dom_ref, coords[0]*t.width, this.Y_PADDING+(coords[1]*t.height));
    this.dom_board.appendChild(t.dom_ref);
    t.set_board_pos(t, coords[0], coords[1]);
}

Board.prototype.init = function() {
    var i, tlen;
    var x=0, y=0;

    for (var i=0; i<this.height; i++) {
        var tmp_ar = Array();
        for (var j=0; j<this.width; j++) {
            tmp_ar.push(null);
        }
        this.board.push(tmp_ar);
    }

    this.dom_board = document.getElementById('hgameboard');

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
}

Board.prototype.get_all_possible_moves = function() {
    var moves = Array();
    for (var i=0; i<this.width; i++) {
        for (var j=0; j<this.height; j++) {
            if (this.board[j][i] !== null) {
                this.get_moves_from_tile(this.board[j][i], Array(), moves);
            }
        }
    }
    return moves;
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
    console.log(pstr);
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

Board.prototype.get_moves_from_tile = function (e1, path, paths) {
    /* append all the possible moves from the tile e1 into the paths array
     * each path element will be an object that has at least x and y keys
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
        } else if (lastelem.name === e1.name) {
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
xA        } else if (lastelem.name !== undefined) {
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
        this.get_moves_from_tile(e1, path, paths);
        path.pop();
    }
}

Board.prototype.is_ok_to_pair = function (e1, e2) {
    if (e1.name !== e2.name) {
        return false;
    }

    var paths = Array();
    b.get_moves_from_tile(e1, Array(), paths);
    for (var i=0; i<paths.length; i++) {
        var plast = paths[i][paths[i].length-1];
        // this should actually be the board element so
        // maybe we can just compare pointers... does something
        // like that exist in the JS
        if (plast.x === e2.x && plast.y === e2.y) {
            return true;
        }
    }

    return false;
}

Board.prototype.remove_tile = function (tile) {
    /* remove element from visual and internal boards
     */
    b.remove_element_from_board(tile.dom_ref);
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
            var paths = b.get_all_possible_moves();
            if (paths.length === 0) {
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

function init() {
    /* this hack gets access to the SVG artwork file through the embed element in the
     * XHTML document
     */
    // see http://w3.org/TR/SVG11/struct.html#InterfaceGetSVGDocument
    var embed = document.getElementById('tileset');
    try {
        svgdoc = embed.getSVGDocument();
    } catch(exception) {
        alert('getSVGDocument interface not available. Try some other browser.');
    }
    
    if (svgdoc && svgdoc.defaultView) {
        svgwin = svgdoc.defaultView; 
    }
  
    b = new Board();
    b.init();
}