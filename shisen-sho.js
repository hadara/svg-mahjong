/* Shishen Sho mahjong game
 * Copyright Sven Petai <hadara@bsd.ee> 2011
 * Licence: GPLv3
 * Artwork is taken from the KDE project and is under respective copyrights & licences
 */
"use strict";

var SVGNS = "http://www.w3.org/2000/svg";
var XLINKNS = "http://www.w3.org/1999/xlink";

var TILESETS = {
    "traditional": "artwork/traditional.svg",
    "default": "artwork/default.svg"
};

var BG_ELEMENT = "TILE_2";

var TILESET = "default";

var DEBUG = false;

var WANT_VIEWBOX = true;

var global_id = 0;

function get_monotonic_increment_id() {
    return global_id++;
}

var game = null;

function Tile(name) {
    this.name = name;
    this.id = "mj_tile_"+get_monotonic_increment_id();
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
    var r = document.createElementNS(SVGNS, "rect");
    r.setAttribute("x", 0);
    r.setAttribute("y", 0);
    r.setAttribute("height", this.height);
    r.setAttribute("width", this.width);
    r.setAttribute("fill", "yellow");
    r.setAttribute("opacity", "0");
    return r;
}

Tile.prototype.create_g = function() {
    var g = document.createElementNS(SVGNS, "g");
    return g;
}

Tile.prototype.get_bg = function() {
    var t = game.tileset.get_use_for_elem(BG_ELEMENT);
    // FIXME: investigate why bg tiles are offset to the left in Ekioh
    if (navigator.userAgent.indexOf('Ekioh') != -1) {
        t.setAttribute('x', -192); // t.getAttribute('x'));
    }
    return t;
}

Tile.prototype.create_dom_elem = function() {
    var g = this.create_g();
    var bg = this.create_background();
    this.bg = bg;

    var u = game.tileset.get_use_for_elem(this.name);

    g.appendChild(this.get_bg());
    g.appendChild(bg);
    g.appendChild(u);
    g.setAttribute('id', this.id);

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
Board.prototype._tiles = Array();
Board.prototype._free_positions = Array();

Board.prototype.previous_selection = null;

Board.prototype.height = 8;
Board.prototype.width = 18;

Board.prototype.PADDING_TOP = 60;
Board.prototype.PADDING_LEFT = 60;

Board.prototype.get_tile_by_name = function(name) {
    var t = new Tile(name);
    this._tiles.push(t);
    return t;
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
        var x = this.PADDING_LEFT+(((path[i].x)*w)+w/2);
        var y = this.PADDING_TOP+((path[i].y)*h)+h/2;
        path_str += cmd+" "+x+" "+y;
    }
    //console.log(path_str);

    // FIXME: create template for the path element in the container file
    // and add class too so CSS could be used for styling 
    path_elem.setAttribute("d", path_str);
    path_elem.setAttribute("fill", "none");
    path_elem.setAttribute("stroke", "red");
    path_elem.setAttribute("stroke-width", "3");
    document.svgroot.appendChild(path_elem);
    setTimeout(function() { document.svgroot.removeChild(path_elem) }, 400);
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

    // connect event handlers
    // FIXME: this function isn't the logical sounding place
    // for doing this but I have no better ideas ATM
    var self = this;
    t.dom_ref.onclick = function () { self.tile_selected(t); };
    if (DEBUG) {
        t.dom_ref.onmousedown = function (e) {
            if (e.which != 1) {
                self.remove_tile(t); return true;
            }
        };
    }

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
    for (var i=0; i<this.width; i++) {
        for (var j=0; j<this.height; j++) {
            this.dom_board.appendChild(this.board[j][i].dom_ref);
        }
    }
}

Board.prototype.set_viewbox = function() {
    /* dynamically set viewBox to the size of out board
     */
    var ih = (Tile.prototype.height * this.height) + (this.PADDING_LEFT*2);
    var iw = (Tile.prototype.width * this.width) + (this.PADDING_TOP*2);
    var tgt_size = "0 0 "+iw+" "+ih;
    this.dom_board.setAttribute('viewBox', tgt_size);
}

Board.prototype.clear_board = function() {
    var len = this._tiles.length;
    for (var i=0; i<len; i++) {
        var e = this._tiles.pop()
	if (e.dom_ref !== null) {
            this.dom_board.removeChild(e.dom_ref);
        }
    }
    this.clean_fall_animation_cache();
}

Board.prototype.init = function() {
    var i, tlen;
    var x=0, y=0;

    this.fall_animations = {};

    if (this.dom_board !== null) {
        // XXX: hack for the case where new_game() is called
        // in that case the viewBox is already present and we want
        // to get rid of it
        this.dom_board.setAttribute('viewBox', '');
    }
        
    this.construct_board();
    this.dom_board = document.getElementById('hgameboard');
    document.svgroot = this.dom_board;

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

    if (WANT_VIEWBOX) {
        var self = this;
        setTimeout(function() { self.set_viewbox() }, 500);
    }
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

Board.prototype.remove_dom_tile = function (e) {
    document.svgroot.removeChild(e.dom_ref);
    e.dom_ref = null;
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
            var tmp = this.board[tile_pos[1]][tile_pos[0]];

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
    this.get_moves_from_tile(e1, Array(), paths, 1, e2);
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
    this.remove_dom_tile(tile);
    this.drop_from_fall_animation_cache(tile.id);
    document.svgroot.removeChild(tile.anim);
    delete tile.anim;
}

Board.prototype.remove_tile = function (tile) {
    /* remove element from visual and internal boards
     */
    this.board[tile.y][tile.x] = null;

    /* we can't run the hide animation in parallel on different tiles so we have to make
     * copies of the original one to do that
     */
    var master_anim = document.getElementById('tile_hide_effect');
    if (!master_anim) {
        // probably no SMIL support, just hide the tile right away
        this.remove_dom_tile(tile);
        this.drop_from_fall_animation_cache(tile.id);
        return;
    }
    var anim = master_anim.cloneNode(false);

    anim.setAttributeNS(XLINKNS, 'href', '#'+tile.dom_ref.getAttribute('id'));
    document.svgroot.appendChild(anim);
    tile.anim = anim;
    // FIXME
    // it would be far nicer to connect the animation cleanup with
    // animation end event but that doesn't seem to work in Chrome
    var self = this;
    //anim.addEventListener('end', function() { self.cleanup_tile_animation(tile) },  false);
    setTimeout(function() { self.cleanup_tile_animation(tile) }, 1000);
    anim.beginElement();

    if (game.gravity === true) {
        this.collapse_column(tile.x);
    }
}

Board.prototype.drop_from_fall_animation_cache = function (element_id) {
    if (element_id in this.fall_animations) {
        document.svgroot.removeChild(this.fall_animations[element_id]);
        delete this.fall_animations[element_id];
    }
}

Board.prototype.clean_fall_animation_cache = function () {
    for (var k in this.fall_animations) {
        document.svgroot.removeChild(this.fall_animations[k]);
    }
    this.fall_animations = {};
}

Board.prototype.create_fall_animation = function (column, y_start, y_end, e, trigger_anim) {
    /* creates falling animation when gravity is enabled
     */
    

    /* falling animation is achieved by creating clones of the template
     * animation for all the elements in the column that we are collapsing.
     * Animation begin events are tied to the first one so calling of the
     * begin on the first one will cause others to start in parallel
     */
    // XXX: it might be necessary to find a way in the future to clean
    // up animations that are done afterwards since otherwise we will
    // end up with huge amount of these in out DOM. It might not be easy since in the
    // current way of going things animations are cumulative and removing an
    // old one will probably cause change in the tiles position unless we modify
    // tiles own transformation matrix at the same time. Some flicker might still
    // be visible though.
    var xpos = (column*Tile.prototype.width)+this.PADDING_LEFT;
    var cur_y = (y_start*Tile.prototype.height)+this.PADDING_TOP;
    var end_y = (y_end*Tile.prototype.height)+this.PADDING_TOP;

    var prev_val = 0;
    if (e.getAttribute('id') in this.fall_animations) {
        anim = this.fall_animations[e.getAttribute('id')];
    } else {
        var master_anim = document.getElementById('tile_fall_effect');
        var anim = master_anim.cloneNode(false);
        this.fall_animations[e.getAttribute('id')] = anim;
    }

    anim.setAttribute('from', xpos+","+cur_y);
    anim.setAttribute('to', xpos+','+(end_y));

    anim.setAttributeNS(XLINKNS, 'href', '#'+e.getAttribute('id'));
    anim.setAttribute('id', 'mj_anim_'+get_monotonic_increment_id());

    if (trigger_anim) {
        // if we have a trigger then connect our begin event with trigger begin event
        anim.setAttribute('begin', trigger_anim.getAttribute('id')+'.begin');
    }

    document.svgroot.appendChild(anim);
    return anim;
}

Board.prototype.collapse_column = function (column) {
    /* attempt to collect column of tiles when the gravity is enabled
     */
    var last_free_pos = null;
    var last_anim = null;
    var first_anim = null;

    for (var i=this.height-1; i>=0; i--) {
        if (this.board[i][column] === null) {
            last_free_pos = i;
        } else if (last_free_pos !== null) {
            // can fall
            var e = this.board[i][column];
            var y_start = i; 
            var y_end = last_free_pos; 
            var anim = this.create_fall_animation(column, y_start, y_end, e.dom_ref, first_anim);

            if (first_anim === null) {
                // have to keep the first animation around since it will be used
                // as a trigger for others
                first_anim = anim;
            }
            this.board[last_free_pos][column] = this.board[i][column];
            this.board[i][column] = null;
            e.set_board_pos(column, last_free_pos);
            last_free_pos -= 1;
        }
    }
    
    if (first_anim) {
        first_anim.beginElement();
    }
}

Board.prototype.show_text = function (text) {
    var t = document.createElementNS(SVGNS, "text");
    t.textContent = text;
    t.setAttribute('x', 600);
    t.setAttribute('y', 350);
    t.setAttribute('font-size', 40);
    t.setAttribute('font-weight', 'bold');
    document.svgroot.appendChild(t);
    return t;
}

Board.prototype.tile_selected = function (tile) {
    if (tile === this.previous_selection) {
        this.previous_selection.unhighlight();
        this.previous_selection = null;
        return;
    }

    if (this.previous_selection !== null) {
        /* we already have a tile selected */
        if (tile.name === this.previous_selection.name && this.is_ok_to_pair(tile, this.previous_selection)) {
            /* same tile type */
            this.remove_tile(tile);
            this.remove_tile(this.previous_selection);
            this.previous_selection = null;
            if (this.have_moves_left() === false) {
                var t = this.show_text('No more moves!');
                setTimeout(function () { document.svgroot.removeChild(t); game.new_game(); }, 5000);
                return false;
            }
        } else {
            this.previous_selection.unhighlight();
            this.previous_selection = null;
        }
    } else {
        tile.highlight();
        this.previous_selection = tile;
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

function Highscores () {

}

Highscores.prototype.KEY = 'svgshishen.highscores';

Highscores.prototype.load = function () {
    this._storage = window.localStorage;

    var hs = this._storage[this.KEY];

    if (hs !== null) {
        this.hs = JSON.parse(hs);
    } else {
        this.hs = [];
    }
}

Highscores.prototype.save = function () {
    var s = JSON.stringify(this.hs)
    this._storage[this.KEY] = s;
}

Highscores.prototype.set_highscore = function (time, name) {
    this.hs.push({'time': time, 'name': name});
    // keep it sorted
    this.hs.sort(function(x, y) { y['time'] - x['time'] });
    this.save();
}

function Game() {
}

// has hints function been used?
Game.prototype.cheat_mode = false;
Game.prototype._autoplay_mode = false;
Game.prototype.started_at = null;
Game.prototype.curfocus = null;
Game.prototype.gravity = true;
Game.prototype.KEY_HINT = 72; // 'h'
Game.prototype.KEY_AUTOPLAY = 65; // 'a'
Game.prototype.KEY_NEW = 78; // 'n'
Game.prototype.KEY_SETTINGS = 83;
Game.prototype.KEY_RIGHT = 39;
Game.prototype.KEY_UP = 38;
Game.prototype.KEY_LEFT = 37;
Game.prototype.KEY_DOWN = 40;
Game.prototype.KEY_OK = 13; // enter

Game.prototype.keyhandler = function (evt) {
    var key = evt.which;
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
    } else if (key === game.KEY_AUTOPLAY) {
        this.toggle_autoplay();
    } else {
        my_log('unknown key pressed:'+key);
    }
}

Game.prototype.toggle_autoplay = function () {
    if (this._autoplay_mode) {
        this._autoplay_mode = false;
    } else {
        this._autoplay_mode = true;
        this.cheat_mode = true;
        this.autoplay();
    }
}

Game.prototype.autoplay = function () {
    /* play game automatically, mainly useful as a screensaver and/or performance test
     */
    if (this._autoplay_mode === false) {
        return;
    }

    var p = this.b.get_all_possible_moves(1);
    if (p.length == 0) {
        // no more moves
        return;
    }
    p = p[0];

    var first_elem = p[0];
    var last_elem = p[p.length-1];
    var first_elem = this.b.board[first_elem.y][first_elem.x];
    var last_elem = this.b.board[last_elem.y][last_elem.x];

    this.b.tile_selected(first_elem);
    this.b.tile_selected(last_elem);
    var self = this;
    setTimeout(function () { self.autoplay() }, 1000);
}

Game.prototype.select_focused = function () {
    if (this.curfocus === null) {
        return false;
    }
    this.b.tile_selected(this.b.board[this.curfocus[1]][this.curfocus[0]]);
}

Game.prototype.focus = function (x, y) {
    /* change focusbox position by offset 
     */
    if (this.curfocus === null) {
        this.curfocus = Array(0, 0);
        this.init_focusbox();
        this.draw_focus();
        return;
    }

    this.curfocus[0] += x;
    this.curfocus[1] += y;

    if (this.curfocus[0] > this.b.width-1) {
        this.curfocus[0] = 0;
    } else if (this.curfocus[0] < 0) {
        this.curfocus[0] = this.b.width-1;
    }

    if (this.curfocus[1] > this.b.height-1) {
        this.curfocus[1] = 0;
    } else if (this.curfocus[1] < 0) {
        this.curfocus[1] = this.b.height-1;
    }

    this.draw_focus();
}

Game.prototype.draw_focus = function () {
    if (this.curfocus === null) {
        return;
    }

    var fb = document.getElementById('focusbox');
    var bbox = getScreenBBox(fb);
    var x = this.b.PADDING_LEFT + (this.curfocus[0] * Tile.prototype.width);
    var y = this.b.PADDING_TOP + (this.curfocus[1] * Tile.prototype.height);
    this.b.translate_to_position(fb, x, y);
}

Game.prototype.init_focusbox = function () {
    var fb = document.getElementById('focusbox_template').cloneNode(false);
    fb.setAttribute('id', 'focusbox');
    fb.setAttribute('height', Tile.prototype.height);
    fb.setAttribute('width', Tile.prototype.width);
    document.svgroot.appendChild(fb);
}

Game.prototype.show_hint = function () {
    this.cheat_mode = true;
    var p = this.b.get_all_possible_moves(1);

    if (p.length === 0) {
        alert('no more moves!');
    } else {
        this.b.draw_path(p[0]);
    }
}

Game.prototype.show_settings = function () {
    /* move dialog to the end of the DOM tree
     * so it would actually be visible since it's drawn in the
     * same order that it appears in the DOM
     */
    var setting_dialog = document.getElementById('settings_dialog');
    document.svgroot.removeChild(setting_dialog);
    document.svgroot.appendChild(setting_dialog);
}

Game.prototype.board_init = function () {
    /* called after the tileset has been loaded
     */
    my_log('board init');
    this.b = new Board();
    this.b.init();

    this.clock.start();
    if (!document.getElementById('tile_fall_effect')) {
        // no SMIL support or animation not defined
        this.gravity = false;
    }
}

Game.prototype.new_game = function () {
    this.reset();
    this.b.clear_board();
    this.b.init();
}

Game.prototype.reset = function () {
    var fb = document.getElementById('focusbox');
    if (fb) {
        document.svgroot.removeChild(fb);
        this.curfocus = null;
    }

    if (this._autoplay_mode !== true) {
        this.cheat_mode = false;
    }
    
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

    var t = document.getElementsByTagName("html");
    if (t && t.length > 0) {
        this.tileset = new EmbedTagExternalTileset();
    } else {
        this.tileset = new XHRExternalDirectSVG();
        //this.tileset = new XHRExternalCopySVG();
    }

    this.tileset.init(TILESETS[TILESET], function () { self.board_init(); });
}

function init() {
    game = new Game();
    game.init();
}
