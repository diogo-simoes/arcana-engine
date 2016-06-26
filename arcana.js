var arcana;

/*
 * Next: Warbanner, warcry - first implement Spell & Charm card types. When a creature has warbanner or warcry means it has
 			either a charm or a spell respectively.
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
		} else if (result === 'defender-not-valid') {
			console.log('Not a valid opponent creature.');
		} else if (result === 'attack-guardians-first') {
			console.log('Attack guardian creatures first.');
		} else if (result === 'not-on-hand') {
			console.log('Card is not on your hand.');
		} else if (result === 'invalid-target') {
			console.log('Can\'t specificy that target.');
		} else if (result === 1) {
			console.log('\n\n' + board.getPlayer().name + ' has perished. ' + board.getEnemy().name + ' is VICTORIOUS!\n\n\n');
		} else if (result === 2) {
			console.log('\n\n' + board.getEnemy().name + ' has perished. ' + board.getPlayer().name + ' is VICTORIOUS!\n\n\n');
		} else if (result === 3) {
			console.log('\n\nThe players destroyed each other in the most amazing battle ever seen! It is a TIE.\n\n\n');
		} else {
			showGame(board.getPlayer(), board.getEnemy());
		}
	};

	arcana.tome = tome;

	function showGame (player, enemy) {
		console.log('\n\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t'+ enemy.name + ': ' + enemy.getHealth());
		var eStage = 'Enemy\'s stage: ';
		for (var i = 0; i < enemy.stage.length; i++) {
			eStage += ' |' + enemy.stage[i].name + ' ';
			if (enemy.stage[i].isSick()) {
				eStage += 'Zzz ';
			} else if (enemy.stage[i].exhausted) {
				eStage += '... ';
			} else {
				eStage += '^^^ ';
			}
			if (enemy.stage[i].isGuardian()) {
				eStage += '[G] ';
			}
			eStage += '(' + enemy.stage[i].getAttack() + '/' + enemy.stage[i].getDefense() + ') ';
			eStage += enemy.stage[i].cid + '| ';
		}
		console.log(eStage);

		console.log('\n\n\n' + player.name + ': ' + player.getHealth() + '    Mana: ' + player.mana.available() + '/' + player.mana.total());

		var stage = 'Stage: ';
		for (var i = 0; i < player.stage.length; i++) {
			stage += ' |' + player.stage[i].name + ' ';
			if (player.stage[i].isSick()) {
				stage += 'Zzz ';
			} else if (player.stage[i].exhausted) {
				stage += '... ';
			} else {
				stage += '^^^ ';
			}
			if (player.stage[i].isGuardian()) {
				stage += '[G] ';
			}
			stage += '(' + player.stage[i].getAttack() + '/' + player.stage[i].getDefense() + ') ';
			stage += player.stage[i].cid + '| ';
		}
		console.log(stage);

		var hand = 'Hand: ';
		for (var i = 0; i < player.hand.length; i++) {
			hand += ' |' + player.hand[i].name + ' ';
			hand += '[' + player.hand[i].mana + '] ';
			hand += '(' + player.hand[i].getAttack() + '/' + player.hand[i].getDefense() + ') ';
			hand += '[';
			hand += player.hand[i].isSick() ? '' : 'R';
			hand += player.hand[i].isGuardian() ? 'G' : '';
			hand += player.hand[i].hasWarcry() ? 'W' : '';
			hand += player.hand[i].hasWarbanner() ? 'B' : '';
			hand += '] ';
			hand += player.hand[i].cid + '| ';
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
			for (var i = 0; i < player.stage.length; i++) {
				if (!player.stage[i].isSick() && !player.stage[i].exhausted) {
					return true;
				}
			}
			return false;
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
			action: {'defense': 20},
			source: board,
			target: player
		});
		board.registerModifier(initialHealth);

		enemy = new Player(board, 'Player 2');
		var initialHealth = new Modifier({
			type: 'timeless',
			action: {'defense': 20},
			source: board,
			target: enemy
		});
		board.registerModifier(initialHealth);

		generateDeck(player);
		generateDeck(enemy);

		for (var i = 0; i < initialHandSize; i++) {
			player.draw();
			enemy.draw();
		}

		board.startTurn(true);
		
		return board.updateState();
	};

	this['cast'] = function (cid, targetId) {
		var cardFound = false;
		for (var i = 0; i < player.hand.length; i++) {
			if (player.hand[i].cid === cid) {
				var card = player.hand[i];
				if (!player.mana.hasMana(card.mana)) {
					return 'no-mana';
				}
				// FIXME: isTargetValid() could be on the Card prototype chain and avoid all this type checking -> transparent polymorphism.
				var spell; // FIXME: remove when players get referenced by Id.
				if (card instanceof Creature && card.hasWarcry()) {
					spell = card.warcry; // FIXME: remove when players get referenced by Id.
					if (!card.warcry.isTargetValid(targetId)) {
						return 'invalid-target';
					}
				}
				if (card instanceof Spell) {
					spell.card; // FIXME: remove when players get referenced by Id.
					if (!card.isTargetValid(targetId)) {
						return 'invalid-target';
					}
				}

				var target;
				if (targetId) {
					var allStaged = enemy.stage.concat(player.stage);
					for (var i = 0; i < allStaged.length; i++) {
						if (allStaged[i].cid === targetId) {
							target = allStaged[i];
							break;
						}
					}
				} else {
					target = (spell && spell.type === 'heal') ? player : enemy; // FIXME: remove when players get referenced by Id.
				}

				player.mana.use(card.mana);
				player.cast(card, target);
				cardFound = true;
				break;
			}
		}
		if (!cardFound) {
			return 'not-on-hand';
		}
		
		return board.updateState();
	};

	this['attack'] = function (attackerId, targetId) {
		var attacker;
		var defender;
		for (var i = 0; i < player.stage.length; i++) {
			if (player.stage[i].cid === attackerId) {
				attacker = player.stage[i];
				break;
			}
		}
		if (!attacker) {
			return 'not-staged';
		}

		var opponentHasGuardians = this.getEnemy().stage.map(creature => creature.isGuardian()).reduce(((prev, curr) => prev || curr), false);

		if (targetId) {
			for (var i = 0; i < enemy.stage.length; i++) {
				if (enemy.stage[i].cid === targetId) {
					defender = enemy.stage[i];
					break;
				}
			}
			if (!defender) {
				return 'defender-not-valid';
			}
			if (opponentHasGuardians && defender && !defender.isGuardian()) {
				return 'attack-guardians-first';
			}
			board.battle(attacker, defender);
		} else {
			if (opponentHasGuardians) {
				return 'attack-guardians-first';
			}
			board.battle(attacker);
		}

		return board.updateState();
	};

	this['end'] = function () {
		var switcher = player;
		player = enemy;
		enemy = switcher;

		board.startTurn();

		return board.updateState();
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

	this.startTurn = function (initialTurn) {
		player.mana.activate(1);
		player.mana.replenish();
		if (!initialTurn) {
			player.draw();
		}			
		while (player.eventsQ.length > 0) {
			var callback = player.eventsQ.pop();
			if (typeof callback !== 'function') {
				continue;
			}
			callback.call(player);
		}
	};

	this.updateState = function () {
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
	function generateDeck (owner) {
		for (var i = 0; i < 30; i++) {
			owner.deck.push(conjureCard(owner));
		}
	};

	function conjureCard (owner, serial) {
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
					player: owner,
					serial: recipe.serial,
					name: recipe.name,
					mana: recipe.mana,
					attack: recipe.attack,
					defense: recipe.defense
				});
				var attack = new Modifier({
					type: 'timeless',
					action: {'attack': recipe.attack},
					source: board,
					target: card
				});
				board.registerModifier(attack);
				var defense = new Modifier({
					type: 'timeless',
					action: {'defense': recipe.defense},
					source: board,
					target: card
				});
				board.registerModifier(defense);

				for (var i = 0; i < recipe.attributes.length; i++) {
					var attribute = recipe.attributes[i];
					switch (attribute.class) {
						case 'reckless':
							var attr = new Modifier({
								type: 'timeless',
								action: {'sick': false},
								source: board,
								target: card
							});
							board.registerModifier(attr);
							break;
						case 'guardian':
							var attr = new Modifier({
								type: 'timeless',
								action: {'guardian': true},
								source: board,
								target: card
							});
							board.registerModifier(attr);
							break;
						case 'warcry':
							card.warcry = new Spell({
								board: board,
								player: owner,
								serial: 'wc_' + card.serial,
								name: card.name + '_warcry',
								type: attribute.type,
								applicableTargets: attribute.applicableTargets,
								effect: attribute.effect
							});
							break;
						case 'warbanner':
							card.warbanner = new Charm({
								board: board,
								player: owner,
								serial: 'wb_' + card.serial,
								name: card.name + '_warbanner',
								type: attribute.type,
								applicableTargets: attribute.applicableTargets
							});
							break;
						default:
							break;
					}
				}

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
	var seed = "abcdefghijklmnopqrstuvwxyz1234567890";
	var code = "";
	while (code.length < 4) {
		code += seed[randomInRange(0, seed.length)];
	}
	return code;
};
Board.prototype.battle = function (attacker, target) {
	if (!target) {
		var damage = new Modifier({
			type: 'timeless',
			action: {'defense': -1 * attacker.getAttack()},
			source: attacker,
			target: this.getEnemy()
		});
		this.registerModifier(damage);
	} else {
		var attackerDmg = new Modifier({
			type: 'timeless',
			action: {'defense': -1 * attacker.getAttack()},
			source: attacker,
			target: target
		});
		this.registerModifier(attackerDmg);

		var defenderDmg = new Modifier({
			type: 'timeless',
			action: {'defense': -1 * target.getAttack()},
			source: target,
			target: attacker
		});
		this.registerModifier(defenderDmg);

		if (target.getDefense() <= 0) {
			target.player.stage.splice(target.player.stage.indexOf(target), 1);
			target.player.graveyard.push(target);
		}
	}

	if (attacker.getDefense() <= 0) {
		attacker.player.stage.splice(attacker.player.stage.indexOf(attacker), 1);
		attacker.player.graveyard.push(attacker);
	} else {
		attacker.exhausted = true;
		attacker.player.eventsQ.push(function () {
			attacker.exhausted = false;
		});
	}
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
		if (mod.action.defense) {
			health += mod.action.defense;
		}
	}
	return health;
};
Player.prototype.draw = function () {
	var card = this.deck.shift();
	this.hand.push(card);
	return card;
};
Player.prototype.cast = function (card, target) {
	if (this.hand.indexOf(card) == -1) {
		return false;
	}
	this.hand.splice(this.hand.indexOf(card), 1);
	this.stage.push(card);
	card.cast(target);
};




function Card (conf) {
	this.board = conf.board;
	this.player = conf.player;
	this.serial = conf.serial || '0000/dummy';
	this.cid = this.board.generateId();
	this.name = conf.name || '__dummy__';
	this.mana = conf.mana || 0;
	this.modifiers = [];
};

Creature.prototype = Object.create(Card.prototype);
Creature.prototype.constructor = Creature;
function Creature (conf) {
	Card.call(this, conf);
	var creature =  this;
	var sick = new Modifier({
		type: 'timeless',
		action: {'sick': true},
		source: creature.board,
		target: creature
	});
	this.board.registerModifier(sick);
	this.exhausted = false;
};
Creature.prototype.cast = function (target) {
	var creature = this;
	this.player.eventsQ.push(function () {
		var sick = new Modifier({
			type: 'timeless',
			action: {'sick': false},
			source: creature.board,
			target: creature
		});
		creature.board.registerModifier(sick);
	});
	if (this.hasWarcry()) {
		this.warcry.cast(target);
	}
};
Creature.prototype.getAttack = function () {
	var attack = 0;
	for (var m = 0; m < this.modifiers.length; m++) {
		var mod =  this.modifiers[m];
		if (mod.action.attack) {
			attack += mod.action.attack;
		}
	}
	return attack;
};
Creature.prototype.getDefense = function () {
	var defense = 0;
	for (var m = 0; m < this.modifiers.length; m++) {
		var mod =  this.modifiers[m];
		if (mod.action.defense) {
			defense += mod.action.defense;
		}
	}
	return defense;
};
Creature.prototype.isSick = function () {
	var reckless = false;
	for (var m = this.modifiers.length -1; m >= 0; m--) {
		var mod =  this.modifiers[m];
		if (mod.action.hasOwnProperty('sick')) {
			return mod.action['sick'];
		}
	}
};
Creature.prototype.isGuardian = function () {
	for (var m = this.modifiers.length -1; m >= 0; m--) {
		var mod =  this.modifiers[m];
		if (mod.action.hasOwnProperty('guardian')) {
			return mod.action['guardian'];
		}
	}
	return false;
};
Creature.prototype.hasWarcry = function () {
	return this.hasOwnProperty('warcry') && this.warcry instanceof Spell;
}
Creature.prototype.hasWarbanner = function () {
	return this.hasOwnProperty('warbanner') && this.warbanner instanceof Charm;
}



Spell.prototype = Object.create(Card.prototype);
Spell.prototype.constructor = Spell;
function Spell (conf) {
	Card.call(this, conf);
	this.type = conf.type;
	this.applicableTargets = conf.applicableTargets;
	this.effect = conf.effect;
};
Spell.prototype.cast = function (target) {
	switch (this.type) {
		case 'damage':
			var spellDmg = new Modifier({
				type: 'timeless',
				action: {'defense': -1 * this.effect},
				source: this,
				target: target
			});
			this.board.registerModifier(spellDmg);
			if (target instanceof Creature && target.getDefense() <= 0) {
				target.player.stage.splice(target.player.stage.indexOf(target), 1);
				target.player.graveyard.push(target);
			}
			break;

		case 'heal':
			// TODO: For now healing just gives more hp instead of recovering under the established defense cap.
			var spellHeal = new Modifier({
				type: 'timeless',
				action: {'defense': this.effect},
				source: this,
				target: target
			});
			this.board.registerModifier(spellHeal);
			break;

		default:
			break;
	}
};
Spell.prototype.isTargetValid = function (targetId) {
	var findInStage = function (player, cardId) {
		for (var i = 0; i < player.stage.length; i++) {
			if (player.stage[i].cid === cardId) {
				return player.stage[i];
			}
		}
	};
	switch (this.applicableTargets) {
		case 'enemy':
			if (targetId) {
				return (findInStage(this.board.getEnemy(), targetId) !== undefined);
			} else {
				return true; // targetting the enemy player
			}

		case 'enemyCreature':
			if (targetId) {
				return (findInStage(this.board.getEnemy(), targetId) !== undefined);
			} else {
				return false;
			}

		case 'friendly':
			if (targetId) {
				return (findInStage(this.player, targetId) !== undefined);
			} else {
				return true; // targetting the player himself
			}

		case 'friendlyCreature': 
			if (targetId) {
				return (findInStage(this.player, targetId) !== undefined);
			} else {
				return false;
			}

		case 'any': 
			if (targetId) {
				// TODO: Players must be referenced by IDs as well, like any game entity.
				if (targetId === 'self' || targetId === 'enemy') {
					return true;
				}
				return (findInStage(this.player, targetId) !== undefined) || (findInStage(this.board.getEnemy(), targetId) !== undefined);
			} else {
				return false;
			}

		case 'anyCreature': 
			if (targetId) {
				return (findInStage(this.player, targetId) !== undefined) || (findInStage(this.board.getEnemy(), targetId) !== undefined);
			} else {
				return false;
			}

		default:
			return false;
	}
}




Charm.prototype = Object.create(Card.prototype);
Charm.prototype.constructor = Charm;
function Charm (conf) {
	Card.call(this, conf);
	this.type = conf.type;
	this.applicableTargets = conf.applicableTargets;
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