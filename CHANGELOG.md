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
