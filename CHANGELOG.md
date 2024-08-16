### 0.8.2 Cold Fix Release
 - Fixed vision modes in V12
 - Context menu fixed

### 0.8.1 "Hot" Fix Release
 - Corrections to the system.json to let the system show up in Foundry V12. Thanks @Tierran !
 - Work-In-Progress vehicle sheets

### 0.8.0 Brand-new condition release
 - Updated to Foundry V11
 - Made conditions use the new handling system, and removed CUB from the system

### 0.7.3 Threatening release
 - The system can now track whether and how weapons and actors are threatening others in combat
 - Vehicles now have their own damage tracking for vehicle-level damage
 - Likely final Foundry VTT V10 release

### 0.7.2 Fix-logging release
 - Added some console logs and UI notifications to places
 - Fixed an error from vehicles having non-vehicle items
 - *Note: Vehicles cannot have items like gifts or templates, the system will prevent their creation*
 - *Note: For that matter, neither can characters or mooks have vehicle items like stations*

### 0.7.1 Wildcard fix release
 - Fixed broken wildcard template system
 - Added an option to search the full image path in case modules can randomize the folder as well

### 0.7.0 Vehicular progress release
 - Added a new actor type for vehicles
 - Added two new item types for vehicle stations and modifications
 - Vehicle systems pretty WIP but functional
 - Fixes to dice rolling

### 0.6.8 Bug fixing release 
 - Bug fixes
 
### 0.6.7 Chat gifts release 
 - Gifts now have a button to use them directly from chat messages
 - Item descriptions should now show up properly enriched in chat
 - Tours should now actually work
 - Internal refactoring and cleanup
 
### 0.6.6 Readable docs release 
 - Added buttons to open the markdown doc files inside Foundry as readable HTML
 - Hidden tokens are ignored as targets when the system derives the initiative TN
 - Minor fixes

### 0.6.5 Touring status release 
 - Added new Ironclaw system tours that can explain a bit more about the system
 - Changed the included status effect quick references to be in a single journal
 - Detection modes should be applied in the correct order now
 - Bug fixes
 
### 0.6.4 Fixed stable release 
 - Fixed a couple of issues that happened with V10.282

### 0.6.3 Better vision release 
 - Updated vision and detection to follow V10.279 specs
 - Added "Keen Sense" as a reroll type
 - Fixed advanced gift bonuses potentially not acting correctly
 - System macro creation takes precedence over Foundry's default
 
### 0.6.2 Fixing fire release 
 - Added a button to add a flame light on actors that are On Fire
 - Added an option to do the above automatically if they don't have a light source active
 - Echolocation is affected by Silenced and not Blinded
 - Fixed Enhanced Terrain Layer detection
 
### 0.6.1 Visible release 
 - Made separate vision modes for Ironclaw 
 - Gifts can now give another vision mode to the actor's tokens, toggleable on and off 
 - Added missing core combat sounds
 - Item hotbar macros are working again 
 - New setting to control whether the default item macro is sending a chat info message, or using it

### 0.6.0 New tens release 
 - Updated system for Foundry VTT V10
 - Shifted things to use the V10 data structure
 - Made diceroll chat message text more unified and consistent in look and formatting
 - Misc issue fixes

### 0.5.17 Shifting host release
 - Moving things over to GitHub
 - Formatted the readme a bit
 - *Probably actually* the last Foundry VTT V9 update

### 0.5.16 Tactical shields release
 - Added a checkbox to use Tactics when attacking, to help with opposing gift bonuses checking for attacker using Tactics
 - Added equip style info to shields
 - ASCII art added to console
 - ~~*Very possibly* the last Foundry VTT V9 update~~

### 0.5.15 Upgraded rerolling release
 - Players can now use reroll gifts on rolls not made by them, if world configuration and gift settings allow
 - Added luck rerolling to the reroll bonus options
 - Added weapon upgrade system for spells that are upgraded from a previous one
 - Made favor bonus roll visible
 - Added spark die auto-dwindle world config option
 - One-line pools can now be ordered internally as well
 - Shields now specify how they are held
 - Fixed bugs
 - Added a note about Foundry VTT license
 - ~~Most likely the last Foundry VTT V9 update~~

### 0.5.14 Rerolling gift release
 - Added a rerolling bonus type for gifts and a rerolling dialog in the chat context menu that shows up when applicable
 - Added a possibility to ask for specific gifts when requesting a roll, which will show up in the roll dialog if available and exhausted when used if applicable
 - Made the rallying roll base TN check what the rallyer's side is in relation to the target's
 - Added a setting to ask for a second readied weapon in some bonus types
 - Compatibility with multi-digit damage numbers in weapons
 - Fixed bugs
 
### 0.5.13 Pooling UI release
 - Added an option to order dice in dice pool rolls by their source instead of by size
 - Added a new gift special option to use the applicability field to control the checkbox auto-check instead of the bonus appearing in the dice pools
 - Added two options to choose what the extra token buttons Ironclaw adds do
 - Added quota / ward field to the condition adding popup
 - New checkbox to damage-applying to specify whether the damage is from an attack
 - Added more visible dice pools to battle statistics part of character sheets

### 0.5.12 Template exhaustion release
 - Added species and career templates that can be applied to actors
 - Added a system where a mook token will automatically get a missing species or career template from a configured source based on the image's name
 - Gift bonuses can now be configured on whether they autocheck in the dice pool dialog and whether they exhaust the associated gift
 - Added a better condition adding popup to sheets
 - Added a way to make weapon AoE templates from the sheet, but they have no effect on rolls
 - Actor sheets should be using the localization system entirely
 - Fixed bugs

### 0.5.11 Flat fixes release
 - Added detection for flat damage to weapons
 - Attackers now use the information for the defender's token through the chat if rolling directly against a damage, used for combat advantage detection
 - Added a setting to hide NPC item descriptions from players
 - Fixed an old bug with item macro creation

### 0.5.10 Explosive exhausting release
 - Added proper handling of explosive weapons and added a button to create AoE marker for them
 - Added checkboxes to automatically ready and stow weapons on use
 - Added an option to exhaust the weapon's gift on ready instead of use
 - Applying damage to someone with a temporary ward now first subtracts damage from the ward
 - Targeting someone granting combat advantage now adds that to the attacker's roll
 - Added support for multiple damage-multiplier effects in weapons
 - GM's can now copy weapons from the directory as well as gifts, from a weapon sheet's advanced settings
 - Added buttons to token HUD to quickly popup the default roll dialog or damage dialog
 - Flying tokens and tokens with 'ignore bad footing' bonus now ignore difficult terrain
 - Roll popup dialog accepts a trait or a skill as the roll's limit

### 0.5.9 Diagonal release
 - Fixed some potential bugs
 - Added a new diagonal rule, as some modules behave differently under the standard Euclidean rule
 - Added a ready calendar config for Simple Calendar
 - Rallying rolls have a proper label

### 0.5.8 Measuring release
 - Added options to define how the system measures distance, defaulting to Euclidean measurements
 - Added a system where targeting a token displays the range band it is at from the controlled one, as well as when either of the tokens moves
 - Attackers can right click a defense against their attack to pick the correct TN / opposing resistance immediately
 - Added a way for GM's and potentially other players to request a certain roll through a chat message
 - Added a rally roll to the character sheet that lets a character roll a rally directly
 - Gifts can now grant a skill Mark directly, only works for actors that normally feature Marks
 - Extra Careers now take their name directly from the item, unless overridden

### 0.5.7 Ranged release
 - Added penalties from range as a bonus when defending or resisting against attacks from long-enough range
 - Added a new "Range Penalty Reduction" special bonus type that reduces the range penalty applied
 - A readied wand should correctly eliminate the range penalty for magic attacks
 - Corrected some null reference bugs

### 0.5.6 Weapon resisting release
 - Added a new "Resist Bonus" special bonus type
 - Added special bonus setting fields that are applied from the attacking weapon
 - Corrected some template bugs

### 0.5.5 Very configurable release
 - Made a separate, better formatted menu for the world settings
 - Made currencies used in the world configurable from a separate menu
 - Added a gift special bonus that changes the value of a currency
 - Added /actordamage ChatCommand for quickly adding damage to someone
 - Made combat encounters store the initiative settings when it is started, to allow GM's to change settings for other encounters without messing up the running one
 - Added a way to make special bonuses ignore the Gift's dice and stats, by adding a '-' to the appropriate field

### 0.5.4 Beastly skills release
 - Redid how beast actors handle and display skills
 - Made having the same skill multiple times as a trait skill (eg. species skills) add dice appropriately
 - Beasts can now have extra careers too, just in case
 - Added quotas to some conditions
 - Changed some condition icons

### 0.5.3 Quick buttons release
 - Added buttons to item info and attack damage info for quicker rolls
 - Added a configurable keybind to skip most roll dialogs when pressing buttons, default is Control
 - Added /quickroll as the command to use for quickrolls, /directroll still works
 - Item info and attack damage info messages based on templates
 - Beast actors have the missing Career configuration fields
 - While the actor is an active combatant in an encounter without an initiative, the initiative in the sheet will be green and clicking it will roll the encounter initiative
 - Encounter initiative automatically sets Focused and botch Reeling conditions
 - Target number rolls show the highest die in smaller print

### 0.5.2 Aimed source release
 - Added aiming as a bonus source
 - Misc fixes

### 0.5.1 Clean aim release
 - Added "Aiming" as a condition
 - Added a system to auto-remove conditions, mostly for combat
 - Species and career can now be called by their name for a roll, rather than just "species" or "career"
 - Added a "/directroll" command with ChatCommands
 - Changed "/actorroll" to "/popuproll" for ChatCommands

### 0.5.0 Plan nine release
 - Upgraded to FoundryVTT 0.9
 - Fixed upgrade bugs with illumination, gifts and extra careers
 - Re-added Chat Commands as a supported thing

### 0.4.5 Extra resist release
 - Final planned FoundryVTT 0.8 release
 - Attacks that are resisted can now roll the resist or counter-attack roll from the attack message context menu
 - Fixed a potential issue with special bonus settings using bad replacement data
 - Extra Career's die is now editable from the actor sheet directly, and the skills it affects are shown next to it
 - Misc fixes

### 0.4.4 Defense context release
 - Weapon info messages in chat have a context menu option to roll the relevant defense for the selected token or default actor
 - Added a new toggle for Gift defense bonuses for special defenses 
 - Item dice pools that are simply one-line-style dice should now parse correctly everywhere

### 0.4.3 Bug fixing release
 - Fixed resolving resisted attacks as normal attacks
 - Fixed illumination item updating
 - Fixed potential glitches with item updating not going through
 - Corrected a version upgrade typo
 - Misc fixes

### 0.4.2 Weak damage release
 - Soak rolls have a new checkbox for Weak damage
 - Fixed bugs from previous release

### 0.4.1 Readied bug-fixing release
 - Added a ready-state variable to weapons
 - Fixed bugs from previous release
 - Unified the Sheet look a bit

### 0.4.0 Customized bonuses release
 - Added a system to add free-form bonuses to any Gifts, replacing the previous hard-coded system for Gifts
 - Added a separate "defend with" field to weapons, also used for Resisted weapons with a checkboxed setting
 - Added a system to auto-exhaust a gift when using weapons
 - Item weights can be set in fractional as well as decimal format
 - Added two buttons for GM's to force-copy either Gift special settings or the entire Gift data from an Item Directory Gift to every gift with the same name in the campaign world

### 0.3.6 Bug fixing release
 - Fixed a bug that prevented token lights from being updated

### 0.3.5 Burdened flight release
 - Added Flight as a tracked Gift
 - Battle statistics shows when the speeds in it are considered flying speeds
 - Added symbols to skills that have their max die type limited by Burdened
 - Battle statistics localization added

### 0.3.4 Jade release
 - Added an option to set statted Gift dice pools as just one-line-style dice
 - Added more Gifts to internal tracking

### 0.3.3 Favored release
 - Upgraded to FoundryVTT 0.8.9
 - Added a "Reroll One" button to use for Favored Use
 - Updated the automatic attack effect calculation system to work with copied rolls
 - Added new settings to the auto-calculation

### 0.3.2 Localized calculation release
 - Upgraded to FoundryVTT 0.8.8
 - Damage auto-calculation can now handle counter-attacks and resisted attacks, a "hanging" roll can be resolved through the right-click menu
 - Added most of the text from scripts to the localization system
 - Put actual dice amounts on sheets
 - Added "Hiding" as a status effect

### 0.3.1 Effect split release
 - Upgraded to FoundryVTT 0.8.7
 - Split off the "Resist with ... vs. 3" weapon effect from other effects into its own field
 - Added an option for the system to attempt to auto-calculate weapon damage based on its effects and the successes in the attack check
 - Added an option to send the heaviest damage effect to chat when applying damage

### 0.3.0 Upgraded release
 - Upgraded to FoundryVTT 0.8.6
 - System functional from a quick look

### 0.2.8 Unconditional conditions release
 - Removed dependency to Combat Utility Belt for using Ironclaw conditions
 - Bug fixing
 - Final FoundryVTT 0.7 release

### 0.2.7 Extra career chat release
 - Implemented support for the Chat Commands module
 - Extra Career gift now properly implemented
 - Properly separated different item types to their own internal lists to resolve sort issues

### 0.2.6 Chat looks release
 - Made chat information output look better and take into account roll mode

### 0.2.5 Better information release
 - Double-clicking an item or condition (blue highlight) in an actor sheet will output some information about it to the chat, with a safeguard setting to ask confirmation before the output
 - Added mottos and goals to character actor sheets as new fields
 - Show dice pools in the dice pool selection dialog


### 0.2.4: Sane initiative release
 - Properly done initiative system, working with the Foundry's assumptions and systems
 - Context menu options to copy the results of a dice roll (effectively 'change' it) into another type or TN
 - Quick buttons to add encumbrance to an actor from the sheet (click the encumbrance level)


### 0.2.3: Actually probably functional release
 - Added functional encumbrance-related systems
 - Added encumbrance information to the sheets
 - Sheets closer to having all information tracked
 - Internal reworking


### 0.2.2: First public release
