# Ironclaw Second Edition system for FoundryVTT

This is a system for running the second edition version of Ironclaw (the corebook named Ironclaw Omnibus: Squaring the Circle). The system has (almost) complete sheets for both full characters and 'mooks', ie. relatively unimportant / minor NPC's to be mass-copied onto the field, with a slightly simpler sheet. The system also has multiple item types to represent the different gear characters can acquire, plus a general one with no mechanical systems to it.
For arbitrary rolls and for people that prefer external sheets, there are two sets of ready-made macros included that can be used to roll arbitrary dice pools without creating an actor for them.

This system was built from the Boilerplate system found here: https://gitlab.com/asacolips-projects/foundry-mods/boilerplate

## Usage

NOTE: This system requires the Combat Utility Belt module and it's Enhanced Conditions to be installed and activated to fully function, as the Ironclaw combat system is based completely on status effects. Please remember to activate it.

For rolling actor dice pools, actor sheets have a button to open a dice poll popup, which allows you to select what pools to use for the roll. The system has some support for specific rolls to automatically pre-select relevant dice pools and add modifiers through hard-coded logic. This does require any added gifts to have the same name as they do in the core book to function, but allows easy rolling of dice.
Weapons and gifts can be set up to automatically select certain dice pools, as well as giving extra dice for the roll automatically. The system also has internal logic to add relevant modifiers to the rolls. Armor and shields also work, but any added dice from gifts need to be added manually.
Ironclaw's initiative system is supported by using 'marker' actor tokens to represent each side in combat and setting up the markers so that their initiatives are in the correct order to follow the order GM has set for the encounter. Sadly, this precludes adding the character tokens themselves to the combat encounter.

Still lots of WIP in this project: Initiatives are a bit of a mess, there's no support for the alternate, more traditional initiative, I'm certain I've forgotten to include one feature or another... 

### How to roll

To properly format and calculate the results from Ironclaw's dice system, the system has an internal 'dice roller' to parse the dice pools into the correct format for the FoundryVTT dice roller, accessible either through the actor sheets or by the included macros. Macros allow the dice to be set either by specifying how many of each die type is rolled, or though a 'one line' parser. Most popups also include an input for extra one line dice pools.
The 'One Line' macros allow the dice pools to be inputted in standard dice notation: "<number of dice>d<sides of the die>, <and>d<so on>", for example "d12, 3d6,2d12". Each separate type of die must be separated with a comma, but the system automatically removes spaces between types. Multiple pools of the same type are automatically added together.

Setting up dice pools for items follows this format: "<trait or skill name>, <another name>;<any bonus dice in one line format>", eg. "Body, Melee Combat, dodge,weathersense;d12". The order of skills and traits are arbitrary and can include spaces in the name, but every name must be separated with a comma. The semicolon (;) separates the stat names from bonus dice, which are formatted the same way as one line rolls. If there is no bonus dice, the semicolon can be omitted.
Currently, the system does not allow dice pools to include items. Instead, the system tries to track common gifts and items that should be included in dice pools, eg. including worn armor in Soak rolls. This is completely hard-coded though, so I'm afraid it won't be perfect.

## License

Ironclaw © SanguineGames.com
This is a fan project, we are not associated with Sanguine Productions.

This system and its contents are licensed under the MIT License located in the root directory, as "LICENSE.txt". Some content is excluded from the MIT License and is governed by their own licenses; these will be noted with an "EXCLUDED.txt" file located in the same directory.
