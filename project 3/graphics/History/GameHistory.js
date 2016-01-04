/**
 * Constructor of a Game History object. Saves info about selection, made moves and who's currently playing 
 *	
 * @constructor GameHistory
 *
 */

function GameHistory () {

	this.selectedSpaces = [];
	this.movesHistory = [];
	this.playing = 'black';
	this.botPlayed = false;
	this.swaps = 0;

	/* Replay vars */
	this.movesReplay = [];
	this.initialMatrix = [];
	this.replayIt = 0;

}