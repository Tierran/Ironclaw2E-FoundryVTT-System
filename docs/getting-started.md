# Getting Started

[← Back to the README](../README.md)

## Install

The system needs **Foundry VTT v13 or v14**.

1. In Foundry's setup screen, open **Game Systems** and choose **Install System**.
2. Paste this manifest URL and choose **Install**:
   ```
   https://github.com/Tierran/Ironclaw2E-FoundryVTT-System/releases/latest/download/system.json
   ```
3. Create a world using **Ironclaw Second Edition**.

## Actor types

| Type | Use it for |
|---|---|
| **Character** | Player characters and important NPCs. Full sheet with traits, skills, marks, gifts and gear. |
| **Mook** | Minor NPCs you put on the map in numbers. A simpler sheet, but still with traits and skills. |
| **Beast** | Animals and monsters with no separate skills. |
| **Marker** | A token with only a description, for marking things on the map. It has no stats and rolls nothing. |

## Building a character

![The Skills tab of a character sheet](images/character-skills-tab.png)

1. **Create a Character actor** and open its sheet.
2. **Set trait dice** for Body, Speed, Mind and Will in the sheet header.
3. **Add a species and career.** The quickest way is to drag a **Species Template** and a **Career Template** item from the Items Directory onto the sheet. See [Templates](#species-and-career-templates) below.
4. **Mark skills** on the **Skills** tab. The sheet shows the total dice each skill rolls.
5. **Add gifts, weapons, armor and gear** by dragging items onto the sheet, or create them from the relevant tab.

### The character sheet tabs

| Tab | What's on it |
|---|---|
| **Skills** | Species and career side by side, with their skills listed under them, and your skill marks. |
| **Battle Statistics** | Initiative, movement, Soak, Dodge and Rally, plus the weapons, armor and shields you've marked to show here. Click a value to roll it. |
| **Magic** | Your [Magic Gifts](magic.md) and their spell attacks. |
| **Gifts** | Your other gifts and Extra Careers. |
| **Status Effects** | The conditions currently on the character. |
| **Combat Gear** | Weapons, armor, shields and light sources. |
| **Items** | Everything else you carry, with weights and money. |
| **Biography** | Description, height, weight, age, habitat and other notes. |

The header has two buttons you'll use constantly: **Open Dice Pool Popup** for any roll (see [Rolling Dice](rolling.md)) and **Apply Damage**.

### Red and blue outlines

On sheets, a **red outline** means *click this* (usually it rolls something), and a **blue outline** means *double-click this* (usually it sends the item's information to chat). Items also have a **Send to Chat** button next to their name.

![Red and blue outlined elements on a sheet](images/sheet-click-outlines.png)

## Species and career templates

**Species Template** and **Career Template** items bundle up everything a species or career gives: the name, its skills, its dice, its gifts and natural weapons.

To apply one, drag it from the Items Directory onto an actor's sheet. The actor doesn't keep the template as an item. Instead:

- The template's fields **overwrite** the actor's species or career fields, even where the template's field is empty.
- Gifts and weapons in the template are **added** to the actor, skipping any the actor already has with exactly the same name.

![Dragging a career template onto a sheet](images/apply-template.png)

### Extra Careers

The **Extra Career** gift is its own item type. A character can have any number of them, but only the first two show up as dice pools.

## Optional modules

The system has built-in support for a few modules. These integrations were written for older Foundry versions, so check that the module itself supports your Foundry version before relying on it.

| Module | What the system does with it |
|---|---|
| [Chat Commands](https://github.com/League-of-Foundry-Developers/Chat-Commands-Lib) | Adds `/iroll`, `/popuproll` and other commands. See [Chat Commands and Macros](chat-commands-and-macros.md). |
| [Drag Ruler](https://github.com/manuelVo/foundryvtt-drag-ruler) | Colors the ruler by movement: Stride (blue), Stride + Dash (green), Run (yellow), beyond Run (red). |
| [Enhanced Terrain Layer](https://github.com/ironmonk88/enhanced-terrain-layer) | Uses its elevation for area-of-effect templates, which matters for fliers and terrain height. |
| [Simple Calendar](https://github.com/vigoren/foundryvtt-simple-calendar) | An importable calendar is in `systems/ironclaw2e/calendars`, starting in the spring of the corebook's current year. Moon phases follow real historical data for the year 881, not in-setting lore. |

## Next steps

- [Rolling Dice](rolling.md): how the dice pool dialog works.
- [Combat](combat.md): the recommended way to run an attack.
