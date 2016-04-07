var arcana;

/*
 * Next: Summoning sickness & battleager, 1 attack per turn
 */

(function () {

	var board = new Board();

	arcana = function () {
		var result = board.stimula.apply(board, Array.prototype.slice.call(arguments));
		if (result === 'no-action') {
			var message = '\nCommand not available!\nAvailable commands:\n';
			board.getActions().forEach(action => message += '\tarcana(\''+action+'\')\n');
			message += '\n';
			console.log(message);
		} else if (result === 'no-mana') {
			console.log('Not enough mana!');
		} else if (result === 'not-staged') {
			console.log('Card is not staged.');
		} else if (result === 'not-on-hand') {
			console.log('Card is not on your hand.');
		} else if (result === 1) {
			console.log('\n\n' + board.getPlayer().name + ' has perished. ' + board.getEnemy().name + ' is VICTORIOUS!\n\n\n');
		} else if (result === 2) {
			console.log('\n\n' + board.getEnemy().name + ' has perished. ' + board.getPlayer().name + ' is VICTORIOUS!\n\n\n');
		} else if (result === 3) {
			console.log('\n\nThe players destroyed each other in the most amazing battle ever seen! It is a TIE.\n\n\n');
		} else {
			showGame(result);
		}
	};

	arcana.tome = tome;

	function showGame (player) {
		console.log('\n\n' + player.name + ': ' + player.getHealth() + '    Mana: ' + player.mana.available() + '/' + player.mana.total());

		var stage = 'Stage: ';
		for (var i = 0; i < player.stage.length; i++) {
			stage += ' |' + player.stage[i].name + ' [' + player.stage[i].mana + '] (' + player.stage[i].attack + '/' + player.stage[i].defense + ') ' + player.stage[i].cid + '| ';
		}
		console.log(stage);

		var hand = 'Hand: ';
		for (var i = 0; i < player.hand.length; i++) {
			hand += ' |' + player.hand[i].name + ' [' + player.hand[i].mana + '] (' + player.hand[i].attack + '/' + player.hand[i].defense + ') ' + player.hand[i].cid + '| ';
		}
		console.log(hand + '\n\n\n');
	};

})();


function Board () {
	var board, player, enemy, state;
	board = this;
	var initialHandSize = 3;
	var maxHandSize = 7;
	this.machina = {
		'start': {
			actions: ['new-game']
		},
		'full-turn': {
			actions: ['cast', 'attack', 'end', 'forfeit']
		},
		'cast-turn': {
			actions: ['cast', 'end', 'forfeit']
		},
		'attack-turn': {
			actions: ['attack', 'end', 'forfeit']
		},
		'end-turn': {
			actions: ['end', 'forfeit']
		},
		'finish': {
			actions: ['new-game']
		},
		'winning': function (player1, player2) {
			if (player1.getHealth() < 1 && player2.getHealth() < 1) {
				return 3;
			} else if (player1.getHealth() < 1) {
				return 1;
			} else if (player2.getHealth() < 1) {
				return 2;
			} else {
				return 0;
			}
		},
		'canCast': function (player) {
			for (var i = 0; i < player.hand.length; i++) {
				if (player.mana.hasMana(player.hand[i].mana)) {
					return true;
				}
			}
			return false;
		},
		'canAttack': function (player) {
			return player.stage.length > 0;

		}
	};
	state = this.machina['start'];
	this.stimula = function (command) {
		if (state.actions.indexOf(command) < 0) {
			return 'no-action';
		}
		var args = Array.prototype.slice.call(arguments);
		args.splice(0,1);
		return board[command].apply(board, args);
	};

	this['new-game'] = function () {
		player = new Player(board, 'Player 1');
		var initialHealth = new Modifier({
			type: 'timeless',
			action: {'health': 20},
			source: board,
			target: player
		});
		board.registerModifier(initialHealth);

		enemy = new Player(board, 'Player 2');
		var initialHealth = new Modifier({
			type: 'timeless',
			action: {'health': 20},
			source: board,
			target: enemy
		});
		board.registerModifier(initialHealth);

		player.deck = generateDeck();
		enemy.deck = generateDeck();

		for (var i = 0; i < initialHandSize; i++) {
			player.draw();
			enemy.draw();
		}

		board.startTurn();
		
		if (board.machina.canCast(player) && board.machina.canAttack(player)) {
			state = board.machina['full-turn'];
		} else if (board.machina.canCast(player)) {
			state = board.machina['cast-turn'];
		} else if (board.machina.canAttack(player)) {
			state = board.machina['attack-turn'];
		} else  {
			state = board.machina['end-turn'];
		}

		return player;
	};

	this['cast'] = function (cid) {
		var cardFound = false;
		for (var i = 0; i < player.hand.length; i++) {
			if (player.hand[i].cid === cid) {
				var card = player.hand[i];
				if (!player.mana.hasMana(card.mana)) {
					return 'no-mana';
				}
				player.mana.use(card.mana);
				player.cast(card);
				cardFound = true;
				break;
			}
		}
		if (!cardFound) {
			return 'not-on-hand';
		}
		if (board.machina.winning(player, enemy) > 0) {
			state = board.machina['finish'];
			return board.machina.winning(player, enemy);
		} else if (board.machina.canCast(player) && board.machina.canAttack(player)) {
			state = board.machina['full-turn'];
		} else if (board.machina.canCast(player)) {
			state = board.machina['cast-turn'];
		} else if (board.machina.canAttack(player)) {
			state = board.machina['attack-turn'];
		} else  {
			state = board.machina['end-turn'];
		}

		return player;
	};

	this['attack'] = function (cid) {
		var cardFound = false;
		for (var i = 0; i < player.stage.length; i++) {
			if (player.stage[i].cid === cid) {
				var card = player.stage[i];
				player.attack(card, enemy);
				cardFound = true;
				break;
			}
		}
		if (!cardFound) {
			return 'not-staged';
		}
		if (board.machina.winning(player, enemy) > 0) {
			state = board.machina['finish'];
			return board.machina.winning(player, enemy);
		} else if (board.machina.canCast(player) && board.machina.canAttack(player)) {
			state = board.machina['full-turn'];
		} else if (board.machina.canCast(player)) {
			state = board.machina['cast-turn'];
		} else if (board.machina.canAttack(player)) {
			state = board.machina['attack-turn'];
		} else  {
			state = board.machina['end-turn'];
		}

		return player;
	};

	this['end'] = function () {
		var switcher = player;
		player = enemy;
		enemy = switcher;

		board.startTurn();

		if (board.machina.winning(player, enemy) > 0) {
			state = board.machina['finish'];
			return board.machina.winning(player, enemy);
		} else if (board.machina.canCast(player) && board.machina.canAttack(player)) {
			state = board.machina['full-turn'];
		} else if (board.machina.canCast(player)) {
			state = board.machina['cast-turn'];
		} else if (board.machina.canAttack(player)) {
			state = board.machina['attack-turn'];
		} else  {
			state = board.machina['end-turn'];
		}

		return player;
	};

	this['forfeit'] = function () {
		state = board.machina['start'];
		return 1;
	};


	// Util methods
	this.registerModifier = function (modifier) {
		if (modifier.source && modifier.target) {
			modifier.target.modifiers.push(modifier);
			return true;
		}
		return false;
	};

	this.startTurn = function () {
		player.mana.activate(1);
		player.mana.replenish();
		player.draw();
		for (var i = 0; i < player.eventsQ.length; i++) {
			var callback = player.eventsQ[i];
			if (typeof callback !== 'function') {
				continue;
			}
			callback.call(player);
		}
	};

	this.getPlayer = function () {
		return player;
	};

	this.getEnemy = function () {
		return enemy;
	};

	this.getActions = function () {
		return state.actions;
	}

	// Helper functions
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
	this.eventsQ = [];
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
	this.exhausted = crystal.exhausted || false; // otherwise, typeof crystal.exhausted === 'undefined';
};