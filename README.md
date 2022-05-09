# Ironclaw Second Edition system for Foundry VTT

This is a system for running the second edition version of Ironclaw (the corebook named Ironclaw Omnibus: Squaring the Circle) in Foundry VTT.  
The system has full sheets for characters and simpler sheets for 'mooks', ie. relatively unimportant / minor NPC's to be mass-copied onto the field, and beasts which lack separate skills. The system also has multiple item types to represent gifts and the different gear characters can acquire, plus a general one with no mechanical systems to it.  

For arbitrary rolls and for people that prefer external sheets, there are two sets of ready-made macros included that can be used to roll arbitrary dice pools without creating an actor for them. In addition, there are some other utility macros available.  

While the system has compendiums, they **do not** contain characters, gifts, gear or other notable game content from the Ironclaw books. Instead, they include paraphrased basic system information for quick reference as well as the aforementioned macros.  

This system was built from the Boilerplate system found here: https://gitlab.com/asacolips-projects/foundry-mods/boilerplate  

## Usage

For rolling actor dice pools, actor sheets have a button to open a dice poll popup, which allows you to select what pools to use for the roll. Weapons and gifts can also be rolled directly, as well as Soak, Dodge defense and Rally from the actor's sheet. The sheet's Rally roll will attempt to get the right range penalty if the user is targeting another token while Rallying. The system supports setting up gifts to grant a variety of bonuses to most of the roll types through the gift sheet, which can be set to trigger with specific conditions or when used with weapons that match its configured attributes.  
Weapons and gifts can be set up to automatically select certain dice pools, as well as giving extra dice for the roll automatically. The system will also use the above-mentioned system to add relevant modifiers to the rolls. Armor and shields also work, and gifts that add dice (eg. Armored Fighter) can be set up through the special bonus system.  
Extra Career gift is a special case and has its own item type, instead of being a normal gift. The system can handle an arbitrary number of them, but will only show the two top ones as dice pools.  
The system has support for dragging items to the hotbar to create usable macros for their quick use. The specifics vary by item type, as weapons would ask how it is used (Attack, Spark, Parry, Counter) from its set pools or just pop up a dice pool selection with the only pool set, gifts would pop up either a dice pool, refresh or exhaust dialog, simpler used items would switch whether they are worn/held/lit, and simple gear will just output their info to chat. Holding the quickroll modifier key (default *Control*) when you drag an item to the hotbar will instead create a macro to always send the item's info to chat.  

In sheets, things with red outlines signify a clickable function, while blue signifies a double-clickable. Single-clicks are usually some function, like opening the dice pool dialog, whereas double-clickable is usually for outputting info to the chat about the thing. Double-clicking on weapons sends an info message to chat with buttons for attacking with the weapon, placing an AoE template for relevant weapons, as well as defending against the weapon as the current actor. Rolling the defense first will allow the attacker to right click the opposing roll and select a context option to attack against the defense directly, with the attack roll automatically taking the right values from the defense roll. Weapon attack damage messages also have soak buttons for different damage levels that allow quickly rolling soak against the weapon as the current actor. Attacks that automatically hit (eg. explosions) don't allow a resistance roll immediately and instead ask for the attacker to roll the attack first, then the Soak button rolls both the resistance and the actual soak to reduce the damage.  
The system has some additional context menu / right-click options for chat messages. Rolls done with the system's own 'dice rollers' have options to change the roll type, the target number or reroll a one, as well as some additional functions to resolve resisted or counter-attacks while the "Auto-calculate attack damage" option is on.  

The order of rolls for the system only really matters in cases where there is automation, which is generally limited to combat. The general preferred order is that the *defender rolls first* and the *contender / attacker responds* to the defender's rolls. Since there are context menu commands to change a roll's type or target number, mistakes on those parts can be corrected later for the system, which also usually means that the order of rolls can be fixed when needed.  
The recommended way of handling attacks is that the attacker sends the weapon's information to the chat, then the defender rolls their defenses first, the attacker right-clicks the defending message to open the context menu and picks the "Attack Against This Defense" option to automatically attack with the original weapon. By default, this will also send a message to chat with the weapon's damage information and buttons for the defender to quickly roll soak with. The exception to this flow are explosion attacks, as they hit automatically. In this case, the attacker places the explosion's AoE template and rolls to hit first, then the defender rolls the resist and soak rolls both to reduce the incoming damage. Counter-attacks can be resolved by a context menu option, and attack rolls have an option to deal "Slaying" damage to account for weaknesses against the weapon.  

Ironclaw's initiative system is supported, both the normal side-based and the alternate classic style. Configuring the specifics is done through the combat tracker settings as normal, the system supporting a few different ways to classify sides in a battle. The system also auto-rolls the initiative check for battle participants when 'rolling' initiative. Beginning the combat encounter saves the side and initiative settings to the encounter and lets the combat tracker settings be used for other encounters with different settings, unless the "Force settings" option is checked.  
The Combat Tracker will show the result of the initiative check before the initiative itself for the GM, either as the number of successes, or as Tie (T), Failure (F), or Botch (B).  

The Species and Career Template items are a way to group up the statistics, gifts and natural weapons they can involve. Actors do not own them like normal items, but instead dragging one over from the Items Directory onto an actor's sheet allows it to be applied onto the actor. In addition, the system has a configuration to automatically apply them based on the randomized token images of mooks and beasts as they are added onto scenes, if the settings are correct. More on that below.  
The template data will overwrite the actor's own fields whether the template has data in them or not. By contrast, the system will ignore empty template item fields and will avoid creating duplicate gifts and weapons, basing the duplicate check on the exact name.  

The system has support for the Drag Ruler module (https://github.com/manuelVo/foundryvtt-drag-ruler). The distance colors represent Stride (blue), Stride+Dash (green), Run (yellow) and over max distance (red).  
The system has support for the Chat Commands module (https://github.com/League-of-Foundry-Developers/Chat-Commands-Lib). If present and active, the system will register different commands that can be called directly from chat. The commands listed and explained below.  
The system has support for the Combat Utility Belt module (https://github.com/death-save/combat-utility-belt), specifically for its Enhanced Conditions system. If present and active, the system will try to use the EC for conditions. Proper setup explained below.  
The system has an importable calendar configuration for Simple Calendar (https://github.com/vigoren/foundryvtt-simple-calendar). Found under "systems/ironclaw2e/calendars", the configuration sets the names correctly and the start date to the spring of the corebook current year. Moon phases are based on actual historical data of year 881 and not in-universe lore.  
For area-of-effect templates, the system can use Enhanced Terrain Layer's elevation setting (https://github.com/ironmonk88/enhanced-terrain-layer). This can have an effect when fliers or terrain elevation matters, as otherwise templates are assumed to be on the same level as the attacking token.  

#### Options

All world-scope settings are in sub-menus within the System Configuration menu. By default, certain automation options are turned off, in case they conflict with the way a GM wants to run the system. These can be turned on in the system configuration at their leisure. In addition, the system contains some client-scope settings, which can be seen in the default system settings menu.  
Among the more notable options:  
 - **Range settings:** The range settings in the world configuration control how the system measurements behave, with options to change the measurement method or the accuracy of the internal measuring.  
 - **Auto-remove conditions:** The system will remove conditions from actors based on hard-coded logic of where they should turn off. More on this under **Conditions**.  
 - **Automated encumbrance system:** Based on carried weight and worn armors, the system will give the actors encumbrance conditions as appropriate. The system is tested and should work fine, but it is potentially slightly unstable due to its implementation. When active, the encumbrance conditions should **not** be manually toggled.  
 - **Auto-calculate attack damage:** When attacking with a weapon, the system will attempt to check what the potential damage with the weapon would be, based on the successes and effects, then create a chat message with that information. Rolls representing counter-attacks and resisted attacks can be right-clicked to resolve them, triggering a popup to input the needed data to figure out how much damage the attack ultimately causes, or in case of turning a resisted attack into a normal one (for, say, when the enemy tries and fails to counter) it just does it based on the original roll. The auto-calculation system has some further options to also display failed attacks by default, or to never send the effect calculations to chat by default, only when asked through the context menu.  
 - **Currency settings:** The used currencies and their attributes can be configured by the GM in the separate currency configuration menu.  
 - **Wildcard Templates:** When mooks or beasts are dragged to the field with the "Apply Wildcard Templates" checked, the system will attempt to fill a missing species or career field with a Species or Career Template respectively, ignoring them if a Species or Career Name is already present. The system will require two folders to hold the Species and Career Templates, and the naming convention for the token images will need to have the species or career name featured in the image name for the system to notice it. The wildcard template system does not care about the alternate override name field in the templates, only the actual item name. Templates that have a different name on the sheets to what needs to be in the image name can be done like that, as the wildcard system only uses the item name, whereas when applying the template the system will use the override name. While the system is built with the Foundry's built-in "Randomize Wildcard Images" setting in mind, strictly speaking, it does not need to be set for the system to function.  

### How to roll

To properly format and calculate the results from Ironclaw's dice system, the system has an internal 'dice roller' to parse the dice pools into the correct format for the FoundryVTT dice roller, accessible either through the actor sheets or by the included macros. Macros allow the dice to be set either by specifying how many of each die type is rolled, or though a 'one line' parser. Most popups also include an input for extra one line dice pools.  
The 'One Line' macros allow the dice pools to be inputted in standard dice notation: "*(number of dice)*d*(sides of the die)*, *(number)*d*(sides)*", for example "d12, 3d6,2d12". Each separate type of die must be separated with a comma, but the system automatically removes spaces between types. Multiple pools of the same type are automatically added together.  
Right-clicking on a roll that has already been rolled will allow you to change the type of roll to another or change the TN of a roll. The copied roll will be shown as a new roll, but tagged as a copy and with static result numbers replacing the dice pools. For Favored Use, there's also a quick button to reroll a single die showing "1", which will copy the roll otherwise but reroll that one die. It will automatically pick the highest die showing a "1". Note that rerolling can't be used on copied rolls.  
Most buttons in the sheet or the chat that perform rolls can be "quickrolled" by holding a configurable keybind down, default *Control*. While not applicable with every button, most allow the popup dialog to be skipped and the roll or function performed with the default given values. Normal attack rolls are a big exception.  

Setting up dice pools for items follows this format: "*(trait or skill name)*, *(another name)*;*(any bonus dice in one line format)*", eg. "Body, Melee Combat, dodge,weathersense;d12". The order of skills and traits are arbitrary and can include spaces in the name, but every name must be separated with a comma. The semicolon (;) separates the stat names from bonus dice, which are formatted the same way as one line rolls. If there is no bonus dice, the semicolon can be omitted.  
For gifts that only grant situational bonuses to certain things without any related skills, like Strength or Veteran, the gift dice pool can be set as either a one line roll "d12" or as a dice pool without stats ";d12". Both work, though if the system doesn't seem to recognize the dice, use the latter.  
Gifts that grant situational bonuses can be configured from the "Advanced Settings" tab. More on that below. Items that have weight can have their weight value set up as either a fractional value "1/8" or a decimal value "0.125", the system will detect the presence of a slash and treat the value accordingly.  

Both the *Effect* and *Descriptor* fields in weapons should be formatted so that every attribute is separated with a comma, eg. "Damage +2, Slaying, Awkward", for the system automations to support them. Weapons also have a field to give its opposing defensive pool for system and quick reference, normally this is just standard "defense" but some weapons with special defenses may have different pools. Weapons with resisted effects should set the resistance pool in the opposing defense field and toggle the "Defense is Resist" checkbox on. Wands and rods should also include "Wand" or "Rod" respectively as a descriptor even if that's not normal for Ironclaw.  
Weapons that would exhaust a gift on use can be set to auto-exhaust the gift in question when used to Attack or Counter. Depending on the world settings of whether weapons with a gift *require* an unexhausted gift, trying to use the weapon when the gift is exhausted will instead pop out a Refresh Gift dialog. A weapon can also be set to exhaust its gift when readied, in which case the popup to refresh a gift will happen when readying.  
Currently, the system does not allow dice pools to include items. Instead, the system tries to track what items should be included in which dice pools, eg. including worn armor in Soak rolls, as well as adding the gift special bonuses. Where these bonuses go is hard-coded though, so I'm afraid it won't be perfect.  

**For Chat Commands**:  
The /iroll command can be used to quickly roll dice with the internal dice roller. It takes a one line format input after the command to roll dice as a highest roll type, with a semicolon followed by a number at the end changing it to a TN roll. Eg. "/iroll 3d6,d8" or "/iroll 3d6,d8;5"  
The /popuproll command opens a standard roll dialog with the given dice pools already checked and optional extra dice and TN preset. It takes a dice pool format input, again with an additional semicolon and number changing the default roll type from highest to TN. However, the system will attempt to detect if the value after the first and only semicolon is a dice input or a TN. Eg. "/popuproll Dodge, Speed;d12;5" or "/popuproll will,presence;3"  
In addition, /popuproll can take a simple "soak", "defense" or "dodging" as input. In the former case, it will open a standard soak roll popup, while the latter two open a dodge defense popup, since "dodge" would normally refer to a roll of pure dodge skill, rather than the defense.  
The /quickroll command takes the same parameters as /popuproll, but rather than opening a dice pool dialog, the given dice are rolled quickly without any dialog opening up. The /directroll command is simply an alias for /quickroll.  
The /itemuse command simply uses an item; it takes an item name and uses that to activate a normal item use, as if the item was used through a hotbar macro. The *item* in this case refers to all things FoundryVTT considers items (armor, gifts, weapons, illumination...), not just the gear type. The name must be an **exact** match.  
The /actordamage command pops up a damage dialog, either with the normal defaults or with inputted values. Every value should be separated by a semicolon, with the values being damage, soak, extra conditions and whether the damage should be added quickly / silently without a popup, respectively. For example: "/actordamage 4;3;Blinded;quick" or "/actordamage 2;-1"  
The /requestroll and its alias /askroll commands are for requesting a specific roll from other players, and send a chat message which contains a button to roll the specified stats, dice and TN. It takes a dice pool format input, again with an additional semicolon and number changing the default roll type from highest to TN. Eg. "/requestroll Dodge, Speed;d12" or "/askroll will,presence;4". The /whisperask does the same thing, but this time, the first part should be player names that the request will be whispered to. Eg. "/whisperask Alice; Will, Gossip; d8; 3" or "/whisperask Bob, Charlie; Mind, weathersense; 3"  

#### Advanced Gift Bonus Settings

For gifts that should interact with the system by giving situational bonuses, the advanced settings can be used to add special bonuses to gifts. When added, the system will automatically see if a given bonus will be applicable given its configuration and add it in the relevant place.  

<details>
<summary>List of possible Advanced Gift Bonus Settings</summary>

 - **Attack Bonus**: A bonus applied when a weapon is used to attack.  
 - **Defense Bonus**: A bonus applied when defending, whether as a parry with a weapon, when dodging, or with special defenses.  
 - **Counter Bonus**: A bonus applies when counter-attacking with a weapon.  
 - **Resist Bonus**: A bonus applies when resisting a weapon.  
 - **Soak Bonus**: A bonus applied when rolling for Soak.  
 - **Guard Bonus**: Either a replacement or a bonus to what the Guarding condition gives. No need to check whether the actor is Guarding when configuring this bonus, it's implicit in its type.  
 - **Aim Bonus**:  Either a replacement or a bonus to what the Aiming condition gives. No need to check whether the actor is Aiming when configuring this bonus, it's implicit in its type.  
 - **Sprint Bonus**: A bonus applied to the sprint roll.  
 - **Initiative Bonus**: A bonus applied to the initiative roll.  
 - **Movement Bonus**: A bonus that changes the movement speed of an actor.  
 - **Flying Move Bonus**: A bonus that changes the flying speed of an actor. (These stack with normal movement bonuses)  
 - **Range Penalty Reduction**: A bonus that reduces the range penalty applied to attacks by the actor.  
 - **Encumbrance Limit Bonus**: A bonus to the carrying capacity of an actor.  
 - **Currency Value Change**: A way to allow a gift to change the value of a currency for an actor.  
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
 - **Other Owned Item Field**: List of item names, one of which the actor must have.
 - **Works When State**: In what gift states will the bonus apply: any state, when gift is refreshed, or when gift is exhausted.
 - **Applies to Dodges**: Whether a defense bonus applies to dodge defenses.
 - **Applies to Parries**: Whether a defense bonus applies to parry defenses.
 - **Applies to Special Defenses**: Whether a defense bonus applies to special defenses.
 - **Applies to Rallying**: Whether a range penalty reduction applies to rallying.
 
</details>

<details>
<summary>Attacker applicability configurations</summary>

These applicability configuration fields are applied from the *attacking weapon*, to allow defensive bonuses to determine what sorts of weapons they are applicable *against*.  
Any of these fields that aren't just checkboxes can include multiple values, separated with commas.  

 - **Other Name Field**: List of partial names, one of which must match with the attacking weapon's name.
 - **Other Descriptor Field**: List of descriptors, one of which must be present in the attacking weapon's descriptors.
 - **Other Effect Field**: List of effects, one of which must be present in the attacking weapon's effects.
 - **Other Stat Field**: List of stats, one of which must be present in any of the attacking weapon's attack stats.
 - **Other Equip Field**: List of weapon equip types, one of which must match the attacking weapon's equip type.
 - **Other Range Field**: List of range bands, depending on the checkbox settings, either tells the minimum and maximum distance from the attacker at or in-between which the special setting is applicable, or one of which must match the attacking weapon's range band.
 - **Use Actual Range**: If checked, the special setting will try and measure the actual distance between the attacker and the defender, and the range bands at *Other Range Field* instead describe the range at which the special setting is applicable.
 - **Applies To Longer Ranges**: Whether the range check will work with distances or range bands longer than listed.
 - **Applies To Shorter Ranges**: Whether the range check will work with distances or range bands shorter than listed.
 
</details>

If the special bonus applies, it's applied where relevant, with the bonus depending on the effect configuration.  

<details>
<summary>List of effect configuration fields</summary>

Note on **"Check Bonus Automatically"**: If it is set to "By Applicability" for a bonus, it alters how the above applicability fields are used. Normally, the applicability settings control whether the bonus is added to or appears on the dice pool popup. But when a bonus is auto-checked by applicability, the *entire bonus* is always added and the applicability system controls whether the *dice bonus* is auto-checked. The only exception is the gift exhaust state check. It is *highly* recommended that bonus sources and stats are not used when the "By Applicability" option is set. *(The option is a sort-of kludgy special case for odd gift bonuses anyway, where a bonus might apply a lot, but is hard to reliably check for.)*  

 - **Bonus Sources**: List of special additions on the bonus. "Armor" adds the worn armors with the bonus, "Shield" adds the equipped shield, "Guard" or "Aim" adds the guarding or aiming bonus if the actor has the respective condition, and "Guard-always" or "Aim-always" adds the guarding or aiming bonus whether or not the actor has the condition.
 - **Bonus Stats**: List of stats (traits and/or skills) to add with the bonus as pre-checked. If empty, the bonus uses its gift's stats. A dash "-" will make the special skip the bonus stats entirely and not use anything.
 - **Bonus Dice**: Dice to add with the bonus as an extra field. If empty, the bonus uses its gift's dice. A dash "-" will make the special skip the bonus dice entirely and not use anything.
 - **Check Bonus Automatically**: Whether the bonus dice are automatically checked in a dice pool popup, either always, never, or based on the applicability fields.
 - **Bonus Exhausts the Gift**: Whether the bonus automatically exhausts its gift if it is used in a dice pool popup. Also implies that the bonus needs an unexhausted gift.
 - **Replaces the Base Bonus**: Whether the bonus to Guarding/Aiming replaces or adds to the Guarding/Aiming dice.
 - **Bonus Stride/Dash/Run**: The amount of respective movement capability to add to the actor.
 - **Ignore Bad Footing**: Whether the gift allows the actor to ignore bad footing / difficult terrain.
 - **Change From/To**: List of stats to change from and what to change them to. Both fields must have the same number of stats or the system will ignore it.
 - **Penalty Reduction**: The number of range bands the range penalty is reduced by.
 - **Encumbrance Bonus**: The bonus added to the carrying capacity of the actor. Note that this bonus should be for the "None" encumbrance limit, the system will multiply it accordingly for the higher limits.
 - **Currency Name**: The name of the currency to change the value of.
 - **Currency Value**: The new value for the given currency.
 - **Upgrade Steps**: The number of steps to upgrade the dice. A single "step" would upgrade the dice by one, from d4 to d6, d6 to d8, etc. Negative steps will instead downgrade the dice instead. The upgraded dice cap at *d12* at maximum and *d4* at minimum.
 - **Name Addition**: What to append to the name of items modified by this bonus. If left empty, the name will not change at all. Note that these should not include brackets, as that will cause Foundry's internal system to attempt to parse it as a roll modifier.
 - **Replacing Name**: The name of a gift that this gift would replace. If this field has something, this bonus will not be applied normally. Instead, when the system would apply a same type bonus from the replaced gift, it will check whether this bonus applies and use this one instead if it does apply. Note that the system does not support multiple potential replacements, only one replacement per type is supported. Also, only the top-most one of each bonus type is considered for the replacement system.
 
</details>

#### Pre-Packaged Macros
The macro compendium for the system has some ready-built macros to use, both as a way to trigger certain rolls through the hotbar, and as an ease-of-access option in case ChatCommands is not for you. Most macros also include a comment in the macro if they can be customized in some way.  

<details>
<summary>The macros include:</summary>

 - **Roll Macros**: A set of macros that pop up dialogs that allow rolling any arbitrary dice through the Cardinal roller easily.
 - **Request a Roll**: A pop up dialog that allows the GM, or any user if the setting is on, to send a chat request to roll a dice pool to some or all players.
 - **Take Damage**: A quick way to pop up the standard damage popup.
 - **Dice Pool Dialog**: A quick way to pop up the standard dice pool popup.
 
</details>

### Conditions

The system has a full set of standard Ironclaw status effect conditions set up and supported, as well as a few extras (the Miscs) purely for GM to differentiate between tokens if they want. Information on them is provided in the status effects compendium pack.  
Damage calculations have a separate pop-up function for simpler calculation. Just input the raw damage from the attack and the soak successes, even if the value goes negative. Do NOT include any added by standard conditions. The system will automatically add the damage from Hurt and Injured if they apply, as noted in the "Condition Damage" part.  

The "Condition auto-removal" system will remove conditions from actors based on internal hard-coded logic. This is mostly for conditions that are necessary to actively manage while in combat.  
<details>
<summary>The current logic is as follows:</summary>

*Aiming* will be removed after attacks and at the end of the actor's own turn.  
*Guarding* will be removed at the start of the actor's next turn.  
*Temporary Ward* will be removed when it takes enough damage to be reduced to zero.  

</details>

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
