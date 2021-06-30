# Ironclaw Second Edition system for Foundry VTT

This is a system for running the second edition version of Ironclaw (the corebook named Ironclaw Omnibus: Squaring the Circle) in Foundry VTT.  
The system has full sheets for characters and simpler sheets for 'mooks', ie. relatively unimportant / minor NPC's to be mass-copied onto the field, and beasts. The system also has multiple item types to represent gifts and the different gear characters can acquire, plus a general one with no mechanical systems to it.  

For arbitrary rolls and for people that prefer external sheets, there are two sets of ready-made macros included that can be used to roll arbitrary dice pools without creating an actor for them. In addition, there is a ready macro to popup the damage dialog for the currently selected actor.  

While the system has compendiums, they **do not** contain characters, gifts, gear or other notable game content from the Ironclaw books. Instead, they include paraphrased basic system information for quick reference as well as the aforementioned macros.

This system was built from the Boilerplate system found here: https://gitlab.com/asacolips-projects/foundry-mods/boilerplate

## Usage

For rolling actor dice pools, actor sheets have a button to open a dice poll popup, which allows you to select what pools to use for the roll. The system has some support for specific rolls to automatically pre-select relevant dice pools and add modifiers through hard-coded logic. This does require any added gifts to have the same name as they do in the books to function, but allows easier rolling of dice.  
Weapons and gifts can be set up to automatically select certain dice pools, as well as giving extra dice for the roll automatically. The system also has internal logic to add relevant modifiers to the rolls. Armor and shields also work, but any added dice from gifts (eg. Armored Fighter) need to be added manually. Extra Career gift is a special case and has its own item type, instead of being a normal gift. The system can handle an arbitrary number of them, but will only show the two top ones as dice pools.  
The system has support for dragging items to the hotbar to create usable macros for their quick use. The specifics vary by item type, as weapons would ask how it is used (Attack, Spark, Parry, Counter) from its set pools or just pop up a dice pool selection with the only pool set, gifts would pop up either a dice pool, refresh or exhaust dialog, simpler used items would switch whether they are worn/held/lit, and simple gear will just output their info to chat.  

In sheets, things with red outlines signify a clickable function, while blue signifies a double-clickable. Single-clicks are usually some function, like opening the dice pool dialog, whereas double-clickable is usually for outputting info to the chat about the thing.  

Ironclaw's initiative system is supported, both the normal side-based and the alternate classic style. Configuring the specifics is done through the combat tracker settings as normal, the system supporting a few different ways to classify sides in a battle. The system also auto-rolls the initiative check for battle participants when 'rolling' initiative.  
The Combat Tracker will show the result of the initiative check before the initiative itself, either as the number of successes, or as Tie (T), Failure (F), or Botch (B).  

The system has support for the Drag Ruler module (https://github.com/manuelVo/foundryvtt-drag-ruler). The distance colors represent Stride (blue), Stride+Dash (green), Run (yellow) and over max distance (red).  
The system has support for the Chat Commands module (https://github.com/League-of-Foundry-Developers/Chat-Commands-Lib). If present and active, the system will register "/iroll", "/actorroll" and "/itemuse" commands.  
The system has support for the Combat Utility Belt module (https://github.com/League-of-Foundry-Developers/Chat-Commands-Lib), specifically for its Enhanced Conditions system. If present and active, the system will try to use the EC for conditions. Proper setup explained below.  

Some aspects are still almost certainly WIP.  

#### Options

By default, certain automation options are turned off, in case they conflict with the way a GM wants to run the system. These can be turned on in the system configuration at their leisure.  
 - **Automated encumbrance system:** Based on carried weight and worn armors, the system will give the actors encumbrance conditions as appropriate. The system is tested and should work fine, but it is potentially slightly unstable due to its implementation.  
 - **Auto-calculate attack damage:** When attacking with a weapon, the system will attempt to check what the potential damage with the weapon would be, based on the successes and effects, then create a chat message with that information. Rolls representing counter-attacks and resisted attacks can be right-clicked to resolve them, triggering a popup to input the needed data to figure out how much damage the attack ultimately causes, or in case of turning a resisted attack into a normal one (for, say, when the enemy tries and fails to counter) it just does it based on the original roll.  

### How to roll

To properly format and calculate the results from Ironclaw's dice system, the system has an internal 'dice roller' to parse the dice pools into the correct format for the FoundryVTT dice roller, accessible either through the actor sheets or by the included macros. Macros allow the dice to be set either by specifying how many of each die type is rolled, or though a 'one line' parser. Most popups also include an input for extra one line dice pools.  
The 'One Line' macros allow the dice pools to be inputted in standard dice notation: "*(number of dice)*d*(sides of the die)*, *(number)*d*(sides)*", for example "d12, 3d6,2d12". Each separate type of die must be separated with a comma, but the system automatically removes spaces between types. Multiple pools of the same type are automatically added together.  
Right-clicking on a roll that has already been rolled will allow you to change the type of roll to another or change the TN of a roll. The copied roll will be shown as a new roll, but tagged as a copy and with static result numbers replacing the dice pools.  

Setting up dice pools for items follows this format: "*(trait or skill name)*, *(another name)*;*(any bonus dice in one line format)*", eg. "Body, Melee Combat, dodge,weathersense;d12". The order of skills and traits are arbitrary and can include spaces in the name, but every name must be separated with a comma. The semicolon (;) separates the stat names from bonus dice, which are formatted the same way as one line rolls. If there is no bonus dice, the semicolon can be omitted.  
For gifts that only grant situational bonuses to certain things without any related skills, like Strength or Veteran, the gift dice pool should be set without any stat names, eg. ";d12". The gift dice are used in some places within the system gift tracking.  

The *Effect* field in weapons should be formatted so that every attribute is separated with a comma, eg. "Damage +2, Slaying, Awkward", for the damage auto-calculation system. Weapons with special resist effects should not add it to the effects field and instead add the resisting stats into the "Resist with" field.  
Currently, the system does not allow dice pools to include items. Instead, the system tries to track common gifts and items that should be included in dice pools, eg. including worn armor in Soak rolls. This is completely hard-coded though, so I'm afraid it won't be perfect.  

For Chat Commands: The /iroll command will take a one line format input after the command to roll dice as a highest roll type, with a semicolon followed by a number at the end changing it to a TN roll. Eg. "/iroll 3d6,d8" or "/iroll 3d6,d8;5"  
The /actorroll command takes a dice pool format input, again with an additional semicolon and number changing the default roll type from highest to TN. Eg. "/actorroll dodge,speed;d12" or "/actorroll will,presence;;3"  
In addition, /actorroll can take a simple "soak" or "defense" as input. In the former case, it will open a standard soak roll popup, while the latter opens a dodge defense popup, since "dodge" would normally refer to a roll of pure dodge skill, rather than the defense.  
The /itemuse command takes an item name and uses that to activate a normal item use, as if the item was used through a hotbar macro. The *item* in this case refers to all things FoundryVTT considers items (armor, gifts, weapons, illumination...), not just the gear type. The name must be an **exact** match.  

### Conditions

The system has a full set of standard Ironclaw status effect conditions set up and supported, as well as a few extras (the Miscs) purely for GM to differentiate between tokens if they want. Information on them is provided in the status effects compendium pack.  
Damage calculations have a separate pop-up function for simpler calculation. Just input the raw damage from the attack and the soak successes, even if the value goes negative. Do NOT including any added by standard conditions. The system will automatically add the damage from Hurt and Injured if they apply, as noted in the "Condition Damage" part.  

With Combat Utility Belt's Enhanced Conditions set up, the system has somewhat better support for multiple defeat conditions and built-in chat linking for the Compendium information entries. The CUB is not necessary, but can make some things smoother.  
<details>
<summary>Step by step explanation of setup</summary>

Step by step explanation to setting Combat Utility Belt's Enhanced Conditions up: There's a button in the right side menu under Game Settings (right-most tab) for "CUBPuter". It opens an 80's command line looking window. Click the  ":gear: Settings" and disable the "Use oldschool CRT styling" to get rid of that. Then click "Select gadget", choose Enhanced Conditions, enable it, and also enable "Remove Default Status Effects".  

Then next, under CUPButer should be "Condition Lab". If you open it, it should have all the appropriate conditions already, as CUB should recognize the Ironclaw2E system and use its appropriate condition map. But in case there are any issues, here's how you use the condition map provided with the system: Open the Condition Lab and select "Import" from top right. It should open a file picker, navigate inside FoundryVTT's data folder, and get the *ironclaw2e.json* condition map from Ironclaw2E's *systems/ironclaw2e/condition-maps* directory. (Default in Windows: %localappdata%/FoundryVTT/Data/systems/ironclaw2e/condition-maps )
</details>

## License

Ironclaw © SanguineGames.com  
This is a fan project, we are not associated with Sanguine Productions.

This system and its contents are licensed under the MIT License located in the root directory, as "LICENSE.txt". Some content is excluded from the MIT License and is governed by their own licenses; these will be noted with an "EXCLUDED.txt" file located in the same directory.
