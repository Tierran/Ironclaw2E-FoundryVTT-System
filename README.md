# Ironclaw Second Edition system for Foundry VTT

This is a system for running the second edition version of Ironclaw (the corebook named Ironclaw Omnibus: Squaring the Circle) in Foundry VTT.  
The system has full sheets for characters and simpler sheets for 'mooks', ie. relatively unimportant / minor NPC's to be mass-copied onto the field, and beasts. The system also has multiple item types to represent gifts and the different gear characters can acquire, plus a general one with no mechanical systems to it.  

For arbitrary rolls and for people that prefer external sheets, there are two sets of ready-made macros included that can be used to roll arbitrary dice pools without creating an actor for them. In addition, there is a ready macro to popup the damage dialog for the currently selected actor.  

While the system has compendiums, they **do not** contain characters, gifts, gear or other notable game content from the Ironclaw books. Instead, they include paraphrased basic system information for quick reference as well as the aforementioned macros.

This system was built from the Boilerplate system found here: https://gitlab.com/asacolips-projects/foundry-mods/boilerplate

## Usage

For rolling actor dice pools, actor sheets have a button to open a dice poll popup, which allows you to select what pools to use for the roll. Weapons and gifts can also be rolled directly, as well as Soak and Dodge defense from the actor's sheet. The system supports setting up gifts to grant a variety of bonuses to most of the roll types through the gift sheet, which can be set to trigger with specific conditions or when used with weapons that match its configured attributes.  
Weapons and gifts can be set up to automatically select certain dice pools, as well as giving extra dice for the roll automatically. The system will also use the above-mentioned system to add relevant modifiers to the rolls. Armor and shields also work, and gifts that add dice (eg. Armored Fighter) can be set up through the special bonus system. Extra Career gift is a special case and has its own item type, instead of being a normal gift. The system can handle an arbitrary number of them, but will only show the two top ones as dice pools.  
The system has support for dragging items to the hotbar to create usable macros for their quick use. The specifics vary by item type, as weapons would ask how it is used (Attack, Spark, Parry, Counter) from its set pools or just pop up a dice pool selection with the only pool set, gifts would pop up either a dice pool, refresh or exhaust dialog, simpler used items would switch whether they are worn/held/lit, and simple gear will just output their info to chat.  

In sheets, things with red outlines signify a clickable function, while blue signifies a double-clickable. Single-clicks are usually some function, like opening the dice pool dialog, whereas double-clickable is usually for outputting info to the chat about the thing.  

Ironclaw's initiative system is supported, both the normal side-based and the alternate classic style. Configuring the specifics is done through the combat tracker settings as normal, the system supporting a few different ways to classify sides in a battle. The system also auto-rolls the initiative check for battle participants when 'rolling' initiative.  
The Combat Tracker will show the result of the initiative check before the initiative itself for the GM, either as the number of successes, or as Tie (T), Failure (F), or Botch (B).  

The system has support for the Drag Ruler module (https://github.com/manuelVo/foundryvtt-drag-ruler). The distance colors represent Stride (blue), Stride+Dash (green), Run (yellow) and over max distance (red).  
The system has support for the Chat Commands module (https://github.com/League-of-Foundry-Developers/Chat-Commands-Lib). If present and active, the system will register "/iroll", "/actorroll" and "/itemuse" commands.  
The system has support for the Combat Utility Belt module (https://github.com/League-of-Foundry-Developers/Chat-Commands-Lib), specifically for its Enhanced Conditions system. If present and active, the system will try to use the EC for conditions. Proper setup explained below.  

#### Options

By default, certain automation options are turned off, in case they conflict with the way a GM wants to run the system. These can be turned on in the system configuration at their leisure.  
 - **Automated encumbrance system:** Based on carried weight and worn armors, the system will give the actors encumbrance conditions as appropriate. The system is tested and should work fine, but it is potentially slightly unstable due to its implementation.  
 - **Auto-calculate attack damage:** When attacking with a weapon, the system will attempt to check what the potential damage with the weapon would be, based on the successes and effects, then create a chat message with that information. Rolls representing counter-attacks and resisted attacks can be right-clicked to resolve them, triggering a popup to input the needed data to figure out how much damage the attack ultimately causes, or in case of turning a resisted attack into a normal one (for, say, when the enemy tries and fails to counter) it just does it based on the original roll. The auto-calculation system has some further options to also display failed attacks by default, or to never send the effect calculations to chat by default, only when asked through the context menu.  

### How to roll

To properly format and calculate the results from Ironclaw's dice system, the system has an internal 'dice roller' to parse the dice pools into the correct format for the FoundryVTT dice roller, accessible either through the actor sheets or by the included macros. Macros allow the dice to be set either by specifying how many of each die type is rolled, or though a 'one line' parser. Most popups also include an input for extra one line dice pools.  
The 'One Line' macros allow the dice pools to be inputted in standard dice notation: "*(number of dice)*d*(sides of the die)*, *(number)*d*(sides)*", for example "d12, 3d6,2d12". Each separate type of die must be separated with a comma, but the system automatically removes spaces between types. Multiple pools of the same type are automatically added together.  
Right-clicking on a roll that has already been rolled will allow you to change the type of roll to another or change the TN of a roll. The copied roll will be shown as a new roll, but tagged as a copy and with static result numbers replacing the dice pools. For Favored Use, there's also a quick button to reroll a single die showing "1", which will copy the roll otherwise but reroll that one die. It will automatically pick the highest die showing a "1". Note that rerolling can't be used on copied rolls.  

Setting up dice pools for items follows this format: "*(trait or skill name)*, *(another name)*;*(any bonus dice in one line format)*", eg. "Body, Melee Combat, dodge,weathersense;d12". The order of skills and traits are arbitrary and can include spaces in the name, but every name must be separated with a comma. The semicolon (;) separates the stat names from bonus dice, which are formatted the same way as one line rolls. If there is no bonus dice, the semicolon can be omitted.  
For gifts that only grant situational bonuses to certain things without any related skills, like Strength or Veteran, the gift dice pool can be set as either a one line roll "d12" or as a dice pool without stats ";d12". Both work, though if the system doesn't seem to recognize the dice, use the latter.  
Gifts that grant situational bonuses can be configured from the "Advanced Settings" tab. More on that below.  

The *Effect* field in weapons should be formatted so that every attribute is separated with a comma, eg. "Damage +2, Slaying, Awkward", for the damage auto-calculation system. Weapons with special resist effects should not add it to the effects field and instead add the resisting stats into the "Resist with" field.  
Currently, the system does not allow dice pools to include items. Instead, the system tries to track what items should be included in which dice pools, eg. including worn armor in Soak rolls, as well as adding the gift special bonuses. Where these bonuses go is hard-coded though, so I'm afraid it won't be perfect.  

For Chat Commands: The /iroll command will take a one line format input after the command to roll dice as a highest roll type, with a semicolon followed by a number at the end changing it to a TN roll. Eg. "/iroll 3d6,d8" or "/iroll 3d6,d8;5"  
The /actorroll command takes a dice pool format input, again with an additional semicolon and number changing the default roll type from highest to TN. Eg. "/actorroll dodge,speed;d12" or "/actorroll will,presence;;3"  
In addition, /actorroll can take a simple "soak" or "defense" as input. In the former case, it will open a standard soak roll popup, while the latter opens a dodge defense popup, since "dodge" would normally refer to a roll of pure dodge skill, rather than the defense.  
The /itemuse command takes an item name and uses that to activate a normal item use, as if the item was used through a hotbar macro. The *item* in this case refers to all things FoundryVTT considers items (armor, gifts, weapons, illumination...), not just the gear type. The name must be an **exact** match.  

#### Advanced Gift Settings

For gifts that should interact with the system by giving situational bonuses, the advanced settings can be used to add special bonuses to gifts. When added, the system will automatically see if a given bonus will be applicable given its configuration and add it in the relevant place.  
<details>
<summary>List of possible Advanced Gift Settings</summary>

 - **Attack Bonus**: A bonus applied when a weapon is used to attack.  
 - **Defense Bonus**: A bonus applied when defending, either as a parry with a weapon or when dodging.  
 - **Counter Bonus**: A bonus applies when counter-attacking with a weapon.  
 - **Soak Bonus**: A bonus applied when rolling for Soak.  
 - **Guard Bonus**: Either a replacement or a bonus to what the Guarding condition gives. No need to check whether the actor is Guarding when configuring this bonus, it's implicit in its type.  
 - **Spring Bonus**: A bonus applied to the sprint roll.  
 - **Initiative Bonus**: A bonus applied to the initiative roll.  
 - **Movement Bonus**: A bonus that changes the normal movement speed of an actor.  
 - **Flying Move Bonus**: A bonus that changes the flying speed of an actor.  
 - **Encumbrance Limit Bonus**: A bonus to the carrying capacity of an actor.  
 - **Stat Change**: An automated way to change the stats for an item when it is dragged to the actor from the Items Directory.  
 - **Dice Upgrade**: An automated way to change the dice for an item when it is dragged to the actor from the Items Directory.  
 
</details>
The system works by first checking whether the special bonus is applicable. This is done by comparing the configuration settings of the special to the actor and/or the item and seeing if they match the configured requirements. Any fields that are empty are ignored, but all fields that have something in them **must match**. If the field allows multiple values, match of *any* of them is enough.  
<details>
<summary>List of applicability configuration fields</summary>
Any of these fields that aren't just checkboxes can include multiple values, separated with commas.

 - **Type Field**: List of item types (gift, weapon, armor) that the special can apply to.
 - **Name Field**: List of partial names, one of which must match with the item's name.
 - **Tag Field**: List of tags, one of which must be present in the item's tags.
 - **Descriptor Field**: List of descriptors, one of which must be present in the item's descriptors.
 - **Effect Field**: List of effects, one of which must be present in the item's effects.
 - **Stat Field**: List of stats, one of which must be present in any of the item's dice roll stats.
 - **Equip Field**: List of weapon equip types, one of which must match the item's equip type.
 - **Range Field**: List of range bands, one of which must match the item's range band.
 - **Condition Field**: List of conditions, one of which the actor must have.
 - **Other Item Field**: List of item names, one of which the actor must have.
 - **Works When Exhausted**: Whether the bonus will still be applied when the gift granting it is exhausted.
 - **Applies to Dodges**: Whether a defense bonus applies to dodge defenses.
 - **Applies to Parries**: Whether a defense bonus applies to parry defenses.
 
</details>
If the special bonus applies, it's applied where relevant, with the bonus depending on the effect configuration.
<details>
<summary>List of effect configuration fields</summary>

 - **Bonus Sources**: List of special additions on the bonus. "Armor" adds the worn armors with the bonus, "Shield" add the equipped shield, "Guard" adds the guard bonus if the actor is Guarding, and "Guard-always" adds the guard bonus whether or not the actor is Guarding.
 - **Bonus Stats**: List of stats (traits and/or skills) to add with the bonus as pre-checked. If empty, the bonus uses its gift's stats.
 - **Bonus Dice**: Dice to add with the bonus as an extra field. If empty, the bonus uses its gift's dice.
 - **Replaces the Base Guarding Bonus**: Whether the bonus to Guarding replaces or adds to the Guarding dice.
 - **Bonus Stride/Dash/Run**: The amount of respective movement capability to add to the actor.
 - **Change From/To**: List of stats to change from and what to change them to. Both fields must have the same number of stats or the system will ignore it.
 - **Encumbrance Bonus**: The bonus added to the carrying capacity of the actor. Note that this bonus should be for the "None" encumbrance limit, the system will multiply it accordingly for the higher limits.
 - **Upgrade Steps**: The number of steps to upgrade the dice. A single "step" would upgrade the dice by one, from d4 to d6, d6 to d8, etc. Negative steps will instead downgrade the dice instead. The upgraded dice cap at *d12* at maximum and *d4* at minimum.
 - **Name Addition**: What to append to the name of items modified by this bonus. If left empty, the name will not change at all. Note that these should not include brackets, as that will cause Foundry's internal system to attempt to parse it as a roll modifier.
 - **Replacing Name**: The name of a gift that this gift would replace. If this field has something, this bonus will not be applied normally. Instead, when the system would apply a same type bonus from the replaced gift, it will check whether this bonus applies and use this one instead if it does apply.
 
</details>

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
