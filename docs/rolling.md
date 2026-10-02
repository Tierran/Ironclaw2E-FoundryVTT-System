# Rolling Dice

[← Back to the README](../README.md)

## The dice pool dialog

Click **Open Dice Pool Popup** in a sheet's header (or the left button under a token) to open the dice pool dialog.

![The dice pool dialog](images/dice-pool-dialog.png)

1. **Check the traits and skills** you're rolling.
2. **Check any bonuses** that apply. Gift bonuses, armor, shields, Guarding, Aiming, range penalties and Combat Advantage show up here automatically when they're relevant. See [Gift Bonuses](gift-bonuses.md).
3. **Add extra dice** in the *Extra dice* field if needed, e.g. `d8` or `2d6, d4`.
4. **Choose the roll type.** Leave *Check to use TN* unchecked for a **highest-die** roll, or check it and enter a **target number**.
5. Choose **Roll**.

Most rolls you make from a weapon, gift or the Battle Statistics tab open this same dialog with the right boxes already checked.

### Skipping the dialog

Hold the **Quick Roll** key (default **Control**) when you click a roll button to skip the dialog and roll the defaults straight away. This works for most buttons, but not for normal attacks. You can rebind the key in Foundry's **Configure Controls**.

## Dice formats

Wherever you type dice into a weapon, gift or field, use one of these two formats.

### Dice only ("one line")

Standard dice notation, with each die type separated by a comma. Spaces don't matter, and repeated types are added together.

| You type | You roll |
|---|---|
| `d12` | one d12 |
| `d12, 3d6, 2d12` | three d12 and three d6 |

### Dice pool (stats and dice)

Trait and skill names separated by commas, then optionally a semicolon and extra dice:

| You type | You roll |
|---|---|
| `Body, Melee Combat` | Body plus Melee Combat |
| `Body, Melee Combat; d12` | the same, plus a d12 |
| `;d12` | just a d12, as a pool with no stats |

Names aren't case-sensitive and can contain spaces.

**Armor and shield dice fields only take dice** (e.g. `2d10`), not stat names.

### Using the other side's stats

Put `@` before a stat name to use your **opponent's** stat instead of your own. For example, a resist field of `Mind, Inquiry, @Body` adds the attacker's Body to the defender's roll.

- In an **attack** pool, `@` means the target's stats.
- In a **defense or counter** pool, `@` means the attacker's stats.
- In **any other roll**, `@` means your current target's stats.

## Fixing and rerolling a roll

Right-click a roll in chat to change it after the fact. These options are available to the GM and to whoever made the roll. The change is posted as a **new copy** of the roll, marked as a copy, with the original dice results.

![The chat context menu on a roll](images/chat-context-menu-roll.png)

| Option | What it does |
|---|---|
| **Copy to TN Roll** | Re-reads a highest-die roll against a target number you enter. |
| **Change TN** | Changes the target number of a TN roll. |
| **Copy to Highest Roll** | Re-reads a TN roll as a highest-die roll. |
| **Reroll a Single One** | For Favored Use. Rerolls the highest die showing a 1. |
| **Rerolling Dialog** | Shows when the selected actor has a gift with a [Reroll Bonus](gift-bonuses.md#reroll-bonus), or always for a GM with nothing selected. Pick the type: Reroll One, Favor Bonus, Luck, Knack or Keen Sense. |

Because rolls can be changed later, it's fine if someone rolls with the wrong TN or type. Fix it from the menu instead of rolling again.

The combat options in this menu are covered in [Combat](combat.md#the-chat-context-menu).

## Asking players to roll

The GM (or anyone, if the *Allow Non-GM Users to request Rolls* setting is on) can post a roll request to chat. Players click the button on the message to roll it.

Use the **Request a Roll** macro from the bundled macros, or the `/requestroll` [chat command](chat-commands-and-macros.md).

![The Request a Roll dialog](images/request-roll-dialog.png)

In the dialog, **check the traits and skills** to request, list any gifts to include, set the **target number** (default 3), and choose who to **whisper** it to (default: everyone).

## Dice order

By default the dice are grouped by where they came from (trait, skill, gift...) and sorted by size within each group. To sort all dice by size instead, turn off *Source ordered dice pools* in [Settings](settings.md#dice-system-settings).
