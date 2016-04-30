
# Arcana™ // ArcanaEngine™ #
## Changelog ##

###0.0.1-alpha###

* Model base Entities: Board, Player, Card, Modifier
* Implemented queue-event-mechanism to model modifier<->attribute interaction
* Added turn marshalling and logging to the Board
* Reading cards from JSON format
* Modeled the board state machine.
* Added event queues to turn start.
* Redesigned the Board API (turns, actions, etc.)
* Implemented battle mechanics
* Implemented summoning sickness
* Implemented 'Reckless'
* Implemented 'Guardian'
* Implemented 'Warcry'
* Modeled Spell card type


### ToDo: ###
* Implement warbanner mechanics
* Model Charm card types (will require more event queues)
* Import/export game states from/to JSON

