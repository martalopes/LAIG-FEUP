/**
 * Constructor of a Board object. This object is used to save all the required info to display a board space or a piece. 
 *	
 * @constructor Board
 * @param  {CGFScene}	scene	current scene
 *
 */

function Board(scene) {
	CGFobject.call(this,scene);

	this.scene = scene;
	this.initialized = false;
	this.history = new GameHistory();

	this.initPrimitives();

	this.initBoardMatrix();

	this.orfanPieces = [];

}

Board.prototype = Object.create(CGFobject.prototype);
Board.prototype.constructor= Board;


/**
 * Displays board elements (pieces, orfan pieces and board spaces). 
 *	
 * @method display
 *
 */

Board.prototype.display = function () {

	this.scene.pushMatrix();

	for (var y = 0; y < this.matrix.length; y++)
		for (var x = 0; x < this.matrix[y].length; x++) {
			if (this.initialized) this.scene.registerForPick(y * 13 + x + 1, this.matrix[y][x]);
			this.matrix[y][x].display();
		}

	for (var i = 0; i < this.orfanPieces.length; i++)
		this.orfanPieces[i].display();

	this.scene.popMatrix();
}


/**
 * Saves primitives that are used to display pieces and board spaces in order to don't create them everytime that an object 
 * is initialized.
 *	
 * @method initPrimitives
 *
 */

Board.prototype.initPrimitives = function () {

	this.space = new Cube(this.scene, 2, 0.3, 2);
	
	this.cylinder = new Cylinder(this.scene, 0.1, 0.8, 0.8, 1, 20);
	this.top = new MyCircle(this.scene, 0.8, 20);

}


/**
 * Initializes a default morelli game with black pieces on the borders of the board, registring pieces to picking
 *	
 * @method initBoardMatrix
 *
 */

Board.prototype.initBoardMatrix = function () {

	this.matrix = [];

	for (var y = 0; y < 13; y++) {

		this.matrix.push([]);

		for (var x = 0; x < 13; x++) {

			this.matrix[y].push( new BoardSpace(this.scene, x, y, this.space) );

			if (y == 0 || x == 0 || y == 12 || x == 12) 
				this.matrix[y][x].piece = new Piece(this.scene, this.cylinder, this.top);

		}

	}

}



/**
 * Interprets a board string from ProLog and converts it to JavaScript arrays by regular expressions.
 *	
 * @method intrepertPlBoard
 * @param 	{string} 		plBoard  	a string containing a ProLog formated board 
 * @return 	{array}			board   	represents a game state
 *
 */


 Board.prototype.intrepertPlBoard = function (plBoard) {

 	plBoard = plBoard.substring(plBoard.indexOf("[")+1, plBoard.lastIndexOf("]"));
 	plBoard = plBoard.replace(/\]\,/g, "\|\]\,").replace(/\]$/, "\|\]");
 	var lines = plBoard.match(/\[(.*?)\|/g);
 	var board = [];

 	for (var i = 0; i < lines.length; i++) 
 		board.push(lines[i].match(/(\d|-\d+)/g));


 	this.initialized = true;

 	return board;

 }


 /**
 * Displays new game state.
 *	
 * @method intrepertPlBoard
 * @param	{array}		newMatrix	matrix to be displayed
 *
 */


 Board.prototype.replaceMatrix = function (newMatrix, starting) {
 	
 	for (var y = 0; y < this.matrix.length; y++)
		for (var x = 0; x < this.matrix[y].length; x++) {

			if (this.matrix[y][x].piece != null) {
				if ( (newMatrix[y][x] == '2' && this.matrix[y][x].piece.color == 'black' ) || 
					(newMatrix[y][x] == '1' && this.matrix[y][x].piece.color == 'white') ) {

					var color = this.matrix[y][x].piece.color;
					var obj = new Piece(this.scene, this.cylinder, this.top);
					obj.color = color;
					this.orfanPieces.push(new OrfanPiece(this.scene, obj, x, y));
					this.matrix[y][x].piece = null;
					this.matrix[y][x].animation = new SpringAnimation(-30);

				}  else if (newMatrix[y][x] == '0' && !starting) {

					this.matrix[y][x].piece = null;
					this.matrix[y][x].animation = new SpringAnimation(-40);

				} else if ((newMatrix[y][x] == '0') && starting) {

					this.matrix[y][x].animation = new RotationAnimation('', 'remove');

				}

			} else {

				if ((newMatrix[y][x] == '1' || newMatrix[y][x] == '2')  && starting) {
					var color = newMatrix[y][x] == '1' ? 'black' : 'white';
					this.matrix[y][x].animation = new RotationAnimation(color, 'insert');
				}

			}

		}

	if (starting) this.clearHistory();

 }


/**
 * Updates the whole board, reponsible for animations.
 *	
 * @method update
 * @param	{int}	currTime	system time
 *
 */

Board.prototype.update = function (currTime) {

	for (var y = 0; y < this.matrix.length; y++)
		for (var x = 0; x < this.matrix[y].length; x++)
			this.matrix[y][x].update(currTime);

	for (var i = 0; i < this.orfanPieces.length; i++) {
		
		if (this.orfanPieces[i] != null)
			if (this.orfanPieces[i].animation == null) {
				this.orfanPieces.splice(i, 1);
			} else {
				this.orfanPieces[i].update(currTime);
			}

	}

}


/**
 * Gets the pick history, animates space, and sends move command to prolog
 *	
 * @method pick
 * @param 	{int}		id 		object custom id
 * @param	{Object}	obj	  	picked object
 *
 */

 Board.prototype.pick = function (id, obj) {

 	obj.animation = new SpringAnimation(-50);

 	if (obj.piece != null) { 
 		this.history.selectedSpaces[0] = obj;
 	} else if (obj.piece == null) {
 		if (this.history.selectedSpaces.length) {
 			this.history.selectedSpaces[1] = obj;
 			var piece = this.history.selectedSpaces;
 			var boardPlList = this.boardToPlList();

 			var request = 'movePiece(' + boardPlList + ',' + piece[0].y + ',' +
 			 piece[0].x + ',' + piece[1].y + ',' + piece[1].x + ','
 			  + this.history.playing + 'Player)';

			var obj = new Piece(this.scene, this.cylinder, this.top);
			if (this.history.playing == 'white') obj.color = 'white';

			this.orfanPieces.push(new OrfanPiece(this.scene, obj, piece[0].x, piece[0].y, piece[1].x, piece[1].y));

 			this.requestToPl(request);
 		}
 		this.history.selectedSpaces = [];
 	}

 }



 /**
 * Undoes previous moves by accessing moves history
 *	
 * @method undo
 *
 */


 Board.prototype.undo = function () {

 	var size = this.history.movesHistory.length;
 	if (!size) return;

 	var lastMove = size - 1;
 	var move = this.history.movesHistory[lastMove];

 	if (move.constructor == MoveHistory)  {

 		var moveX0 = move.x0;
 		var moveY0 = move.y0;
 		var moveXf = move.xf;
 		var moveYf = move.yf;

 		for (var y = 0; y < this.matrix.length; y++)
		for (var x = 0; x < this.matrix[y].length; x++)
			if (moveXf == x && moveYf == y) {
				var color = this.matrix[y][x].piece.color;
				var piece =	new Piece(this.scene, this.cylinder, this.top);
				piece.color = color;

				var orfanPiece = new OrfanPiece(this.scene, piece, moveXf, moveYf, moveX0, moveY0);
				orfanPiece.visible = true;
				this.orfanPieces.push(orfanPiece);
				var size = this.orfanPieces.length - 1;
				this.orfanPieces[size].undo = true;
				this.matrix[y][x].piece = null;
				this.matrix[y][x].animation = new SpringAnimation(-40);

				var last = this.history.movesHistory.length - 1;
				this.history.movesHistory.splice(last, 1);
				this.history.playing = this.history.playing == 'black' ? 'white' : 'black';
				return;
			}

 	} else if (move.constructor == ReplaceColorHistory) {

 		var tilex = move.x;
 		var tiley = move.y;

 		for (var y = 0; y < this.matrix.length; y++)
		for (var x = 0; x < this.matrix[y].length; x++)
			if (tilex == x && tiley == y) {

				var color = this.matrix[y][x].piece.color;
				var obj = new Piece(this.scene, this.cylinder, this.top);
				obj.color = color;
				var orfanPiece = new OrfanPiece(this.scene, obj, x, y);
				this.orfanPieces.push(orfanPiece);
				this.matrix[y][x].piece = null;
				this.matrix[y][x].animation = new SpringAnimation(-30);

				var last = this.history.movesHistory.length - 1;
				this.history.movesHistory.splice(last, 1);
				this.history.movesHistory.splice(last - 1, 1);

				this.undo();
			}

 	}

 }



 /**
 * Clears History, sets all to default
 *	
 * @method undo
 *
 */


 Board.prototype.clearHistory = function () {

 	this.history = new GameHistory();

 }