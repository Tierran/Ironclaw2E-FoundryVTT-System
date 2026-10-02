# Chat Commands and Macros

[← Back to the README](../README.md)

## Chat commands

These need the [Chat Commands](https://github.com/League-of-Foundry-Developers/Chat-Commands-Lib) module. Type them in the chat box.

Commands that roll for an actor use your **selected token**, or your assigned character if nothing is selected.

| Command | What it does | Examples |
|---|---|---|
| `/iroll` | Roll dice in the [one-line format](rolling.md#dice-only-one-line). Add `;` and a number for a TN roll. | `/iroll 3d6, d8`<br>`/iroll 3d6, d8; 5` |
| `/popuproll` | Open the dice pool dialog with these stats and dice pre-filled. Add `;` and a number for a TN. | `/popuproll Dodge, Speed; d12; 5`<br>`/popuproll will, presence; 3` |
| `/popuproll soak` | Open the Soak dialog. | |
| `/popuproll defense` | Open the dodge defense dialog. `/popuproll dodging` does the same. (`dodge` alone would roll the Dodge skill.) | |
| `/quickroll` | Like `/popuproll`, but rolls straight away without the dialog. `/directroll` is the same. | `/quickroll Body, Melee Combat` |
| `/itemuse` | Use an item by its **exact** name, as if from a hotbar macro. Works for any item: weapons, gifts, armor, light sources... | `/itemuse Longsword` |
| `/actordamage` | Open the damage dialog. Optionally give `damage; soak; conditions; quick`, where `quick` applies it without the dialog. | `/actordamage 4; 3; Blinded; quick`<br>`/actordamage 2; -1` |
| `/requestroll` | Post a [roll request](rolling.md#asking-players-to-roll) for others to click. Takes a dice pool, an optional TN, then optional gift names. `/askroll` is the same. | `/requestroll Dodge, Speed; d12`<br>`/askroll will, presence; 4` |
| `/whisperask` | Like `/requestroll`, but whispered. Start with the player names. | `/whisperask Alice; Will, Gossip; d8; 3; Fast-Talk`<br>`/whisperask Bob, Charlie; Mind, weathersense; 3` |

In `/popuproll` and `/quickroll`, if there's only one `;`, the system works out whether what follows it is dice or a TN.

## Bundled macros

The **Pre-Packaged Macros** compendium has macros for the hotbar. Most have a comment inside explaining what you can customize.

<!-- TODO: check these names against the compendium after the release -->

| Macro | What it does |
|---|---|
| **Roll macros** | Roll any dice through the system's dice roller, either by entering how many of each die or in the one-line format, as a highest-die or TN roll. |
| **Request a Roll** | Opens the [Request a Roll](rolling.md#asking-players-to-roll) dialog. |
| **Take Damage** | Opens the damage dialog. |
| **Dice Pool Dialog** | Opens the dice pool dialog. |

You can also drag any item to the hotbar to make a macro for it. See [Hotbar macros](items.md#hotbar-macros).
