# Ironclaw Second Edition system for Foundry VTT

This is a system for running the second edition version of Ironclaw (the corebook named Ironclaw Omnibus: Squaring the Circle) in Foundry VTT.  
The system has full sheets for characters and simpler sheets for 'mooks', ie. relatively unimportant / minor NPC's to be mass-copied onto the field, and beasts. The system also has multiple item types to represent gifts and the different gear characters can acquire, plus a general one with no mechanical systems to it.  
For arbitrary rolls and for people that prefer external sheets, there are two sets of ready-made macros included that can be used to roll arbitrary dice pools without creating an actor for them.  
While the system has compendiums, they **do not** contain characters, gifts, gear or other notable game content from the Ironclaw books. Instead, they include paraphrased basic system information for quick reference as well as the aforementioned macros.

This system was built from the Boilerplate system found here: https://gitlab.com/asacolips-projects/foundry-mods/boilerplate

NOTE: This system requires the Combat Utility Belt (https://github.com/death-save/combat-utility-belt) module and it's Enhanced Conditions to be installed and activated to fully function, as the Ironclaw combat system is based completely on status effects. Please remember to activate it and disable the default Foundry status conditions, if not already disabled.

## Usage

For rolling actor dice pools, actor sheets have a button to open a dice poll popup, which allows you to select what pools to use for the roll. The system has some support for specific rolls to automatically pre-select relevant dice pools and add modifiers through hard-coded logic. This does require any added gifts to have the same name as they do in the books to function, but allows easier rolling of dice.  
Weapons and gifts can be set up to automatically select certain dice pools, as well as giving extra dice for the roll automatically. The system also has internal logic to add relevant modifiers to the rolls. Armor and shields also work, but any added dice from gifts need to be added manually.  
Ironclaw's initiative system is supported by using 'marker' actor tokens to represent each side in combat and setting up the markers so that their initiatives are in the correct order to follow the order GM has set for the encounter. Sadly, this precludes adding the character tokens themselves to the combat encounter.  

The system has support for the Drag Ruler module (https://github.com/manuelVo/foundryvtt-drag-ruler). The distance colors represent Stride (blue), Stride+Dash (green), Run (yellow) and over max distance (red).

Still lots of WIP in this project: Initiatives are a bit of a mess, there's no support for the alternate, more traditional initiative, I'm certain I've forgotten to include one feature or another... 

### How to roll

To properly format and calculate the results from Ironclaw's dice system, the system has an internal 'dice roller' to parse the dice pools into the correct format for the FoundryVTT dice roller, accessible either through the actor sheets or by the included macros. Macros allow the dice to be set either by specifying how many of each die type is rolled, or though a 'one line' parser. Most popups also include an input for extra one line dice pools.  
The 'One Line' macros allow the dice pools to be inputted in standard dice notation: "*(number of dice)*d*(sides of the die)*, *(number)*d*(sides)*", for example "d12, 3d6,2d12". Each separate type of die must be separated with a comma, but the system automatically removes spaces between types. Multiple pools of the same type are automatically added together.

Setting up dice pools for items follows this format: "*(trait or skill name)*, *(another name)*;*(any bonus dice in one line format)*", eg. "Body, Melee Combat, dodge,weathersense;d12". The order of skills and traits are arbitrary and can include spaces in the name, but every name must be separated with a comma. The semicolon (;) separates the stat names from bonus dice, which are formatted the same way as one line rolls. If there is no bonus dice, the semicolon can be omitted.  
While currently not used in the programming, the *Effect* field in weapons should be formatted so that every attribute is separated with a comma, eg. "Damage +2, Slaying, Awkward", for future-proofing.  
Currently, the system does not allow dice pools to include items. Instead, the system tries to track common gifts and items that should be included in dice pools, eg. including worn armor in Soak rolls. This is completely hard-coded though, so I'm afraid it won't be perfect.

### Conditions

Step by step explanation to setting Combat Utility Belt's Enhanced Conditions up: There's a button in the right side menu under Game Settings (right-most tab) for "CUBPuter". It opens an 80's command line looking window. Click the  ":gear: Settings" and disable the "Use oldschool CRT styling" to get rid of that. Then click "Select gadget", choose Enhanced Conditions, enable it, and also enable "Remove Default Status Effects".  
Then next, under CUPButer should be "Condition Lab". Open it, and select "Import" from top right. It should open a file picker, navigate inside FoundryVTT's data folder to get the condition map from Ironclaw2E's *systems/ironclaw2e/condition-maps* directory. (Default in Windows: %localappdata%/FoundryVTT/Data/systems/ironclaw2e/condition-maps )

With Combat Utility Belt's Enhanced Conditions set up, the token status effect quick menu shows all of the standard Ironclaw conditions, as well as a few extras (the Miscs) purely for GM to differentiate between tokens if they want. Information on them is provided in the status effects compendium pack.  
Damage calculations have a separate pop-up function for simpler calculation. Just input the raw damage from the attack after soak, even if the value goes negative, NOT including any added by standard conditions. The system will automatically add the damage from Hurt and Injured if they apply.  

## License

Ironclaw © SanguineGames.com  
This is a fan project, we are not associated with Sanguine Productions.

This system and its contents are licensed under the MIT License located in the root directory, as "LICENSE.txt". Some content is excluded from the MIT License and is governed by their own licenses; these will be noted with an "EXCLUDED.txt" file located in the same directory.
