var arcana = {};
arcana.tome = tome;

/*
 * Next: **Implement the STATE MACHINE -> event queues for all transitions** Summoning sickness & battleager, 1 attack per turn
 */

(function () {

	var board, player1, player2, turn, enemy;

	this.newGame = function () {
		board = new Board();
		player1 = board.player1;
		player2 = board.player2;

		this.board = board;
		this.player1 = player1;
		this.player2 = player2;

		turn  = player1;
		enemy = player2;

		player1.showGame = showGame;
		player2.showGame = showGame;

		player1.deck = generateDeck();
		player2.deck = generateDeck();
		player1.draw();
		player1.draw();
		player1.draw();
		player2.draw();
		player2.draw();
		player2.draw();

		player1.mana.activate(1);
		turn.showGame();
	};

	function showGame () {
		console.log('\n\n' + this.name + ': ' + this.getHealth() + '    Mana: ' + this.mana.available() + '/' + this.mana.total());

		var stage = 'Stage: ';
		for (var i = 0; i < this.stage.length; i++) {
			stage += ' |' + this.stage[i].name + ' [' + this.stage[i].mana + '] (' + this.stage[i].attack + '/' + this.stage[i].defense + ') ' + this.stage[i].cid + '| ';
		}
		console.log(stage);

		var hand = 'Hand: ';
		for (var i = 0; i < this.hand.length; i++) {
			hand += ' |' + this.hand[i].name + ' [' + this.hand[i].mana + '] (' + this.hand[i].attack + '/' + this.hand[i].defense + ') ' + this.hand[i].cid + '| ';
		}
		console.log(hand + '\n\n\n');
	};
	this.endTurn = function () {
		if (!board) {
			console.log('\n\nNo game going on. Start a new game by typing "arcana.newGame()"\n\n');
			return;
		}
		//need to check winning conditions after closing queue is processed
		if (turn === player1) {
			turn = player2;
			enemy = player1;
		} else {
			turn = player1;
			enemy = player2;
		}
		//need to check winning conditions after opening queue is processed
		turn.mana.activate(1);
		turn.mana.replenish();
		turn.draw();
		turn.showGame();
	};
	this.cast = function (cid) {
		if (!board) {
			console.log('\n\nNo game going on. Start a new game by typing "arcana.newGame()"\n\n');
			return;
		}
		for (var i = 0; i < turn.hand.length; i++) {
			if (turn.hand[i].cid === cid) {
				var card = turn.hand[i];
				if (!turn.mana.hasMana(card.mana)) {
					console.log('\n\nNot enough mana!\n\n');
					return false;
				}
				turn.mana.use(card.mana);
				turn.cast(card);
				turn.showGame();
				winning();
				return true;
			}
		}
		console.log('Card \'' + cid + '\' is not on your hand.');
	}
	this.attack = function (cid) {
		if (!board) {
			console.log('\n\nNo game going on. Start a new game by typing "arcana.newGame()"\n\n');
			return;
		}
		for (var i = 0; i < turn.stage.length; i++) {
			if (turn.stage[i].cid === cid) {
				var card = turn.stage[i];
				turn.attack(card, enemy);
				turn.showGame();
				winning();
				return true;
			}
		}
		console.log('Card \'' + cid + '\' is not staged.');
	}

	function generateDeck () {
		var deck = [];
		for (var i = 0; i < 30; i++) {
			deck.push(conjureCard());
		}
		return deck;
	};

	function conjureCard (serial) {
		function randomInRange(min, maxExcl) {
			return Math.floor(Math.random() * (maxExcl - min)) + min;
		}
		var recipe, card;
		if (serial) {
			for (var i = 0; i < arcana.tome.length; i++) {
				if (arcana.tome[i].serial === serial) {
					recipe = arcana.tome[i];
					break;
				}
			}
		} else {
			recipe = this.tome[randomInRange(0,this.tome.length)];
		}
		switch (recipe.type) {
			case 'creature':
				card = new Creature({
					board: board,
					serial: recipe.serial,
					name: recipe.name,
					mana: recipe.mana,
					attack: recipe.attack,
					defense: recipe.defense
				});
				break;
			default:
				card = new Card();
		}
		return card;
	};

	function winning () {
		if (player1.getHealth() < 1 && player2.getHealth() < 1) {
			console.log('\n\nThe players destroyed each other in the most amazing battle ever seen! It is a TIE.\n\n\n');
			board = null;
		} else if (player1.getHealth() < 1) {
			console.log('\n\n' + player1.name + ' has perished. ' + player2.name + ' is VICTORIOUS!\n\n\n');
			board = null;
		} else if (player2.getHealth() < 1) {
			console.log('\n\n' + player2.name + ' has perished. ' + player1.name + ' is VICTORIOUS!\n\n\n');
			board = null;
		}
	};


}).apply(arcana);


function Board () {
	this.registerModifier = function (modifier) {
		if (modifier.source && modifier.target) {
			modifier.target.modifiers.push(modifier);
			return true;
		}
		return false;
	};

	this.player1 = new Player(this, 'Player 1');
	var initialHealth = new Modifier({
		type: 'timeless',
		action: {'health': 20},
		source: this,
		target: this.player1
	});
	this.registerModifier(initialHealth);

	this.player2 = new Player(this, 'Player 2');
	var initialHealth = new Modifier({
		type: 'timeless',
		action: {'health': 20},
		source: this,
		target: this.player2
	});
	this.registerModifier(initialHealth);
};
Board.prototype.generateId = function () {
	function randomInRange(min, maxExcl) {
		return Math.floor(Math.random() * (maxExcl - min)) + min;
	}
	var seed = "abcdefghijklmnopqrstuvwxyz1234567890_*";
	var code = "";
	while (code.length < 4) {
		code += seed[randomInRange(0, seed.length)];
	}
	return code;
};



function Player (board, name) {
	this.board = board;
	this.name = name || 'john doe';
	this.modifiers = [];
	this.mana = new Managram();
	this.deck = [];
	this.hand = [];
	this.graveyard = [];
	this.stage = [];
};
Player.prototype.getHealth = function () {
	var health = 0;
	for (var m = 0; m < this.modifiers.length; m++) {
		var mod =  this.modifiers[m];
		if (mod.action.health) {
			health += mod.action.health;
		}
	}
	return health;
};
Player.prototype.draw = function () {
	var card = this.deck.shift();
	this.hand.push(card);
	return card;
};
Player.prototype.cast = function (card) {
	if (this.hand.indexOf(card) == -1) {
		return false;
	}
	// mana logic;
	this.hand.splice(this.hand.indexOf(card), 1);
	this.stage.push(card);
};
Player.prototype.attack = function (creature, target) {
	var damage = new Modifier({
		type: 'timeless',
		action: {'health': -1 * creature.attack},
		source: this,
		target: target
	});
	this.board.registerModifier(damage);
};



function Card (conf) {
	this.board = conf.board;
	this.serial = conf.serial || '0000/dummy';
	this.cid = this.board.generateId();
	this.name = conf.name || '__dummy__';
	this.mana = conf.mana || 0;
};

Creature.prototype = Object.create(Card.prototype);
Creature.prototype.constructor = Creature;
function Creature (conf) {
	Card.call(this, conf);
	this.attack = conf.attack || 0;
	this.defense = conf.defense || 0;
	this.sick = true;
	this.exhausted = false;
};



function Modifier (conf) {
	this.type = conf.type || 'timeless';
	this.action = conf.action || {};
	this.source = conf.source;
	this.target = conf.target;
};



function Managram (size) {
	var managramSize = size || 10;
	this.crystals = [];
	for (var i = 0; i < managramSize; i++) {
		this.crystals.push(new ManaCrystal());
	}
};
Managram.prototype.hasMana = function (ammount) {
	var requested = ammount || 1;
	var unusedMana = 0;
	this.crystals.forEach(function (crystal) {
		if (crystal.active && !crystal.exhausted) unusedMana++;
	});
	return unusedMana >= requested;
};
Managram.prototype.use = function (ammount) {
	if (!ammount || !this.hasMana(ammount)) {
		return;
	}
	this.crystals.forEach(function (crystal) {
		if (crystal.active && !crystal.exhausted && ammount > 0){
			crystal.exhausted = true;
			ammount--;
		}
	});
};
Managram.prototype.replenish = function (ammount) {
	this.crystals.forEach(function (crystal) {
		crystal.exhausted = false;
	});
};
Managram.prototype.hasInactives = function () {
	for (var i = 0; i < this.crystals.length; i++) {
		if (!this.crystals[i].active) {
			return true;
		}
	}
	return false;
};
Managram.prototype.activate = function (ammount) {
	if (!ammount || !this.hasInactives()) {
		return;
	}
	this.crystals.forEach(function (crystal) {
		if (!crystal.active && ammount > 0){
			crystal.active = true;
			ammount--;
		}
	});
};
Managram.prototype.available = function () {
	var available = 0;
	this.crystals.forEach(function (crystal) {
		if (crystal.active && !crystal.exhausted) available++;
	});
	return available;
};
Managram.prototype.total = function () {
	return this.crystals.length;
};

function ManaCrystal (crystal) {
	var crystal = crystal || {};
	this.color = crystal.color || 'colorless';
	this.active = crystal.active || false;
	this.exhausted = crystal.exhausted || false; //typeof crystal.exhausted === 'undefined';
};