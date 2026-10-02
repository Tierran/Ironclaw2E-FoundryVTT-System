# Gift Bonuses

[← Back to the README](../README.md)

Gifts that give situational bonuses, like Strength, Veteran or Armored Fighter, are set up on the gift's **Advanced Settings** tab. The system then adds the bonus to the right rolls by itself.

![A gift's Advanced Settings tab with an Attack Bonus](images/gift-advanced-settings.png)

## How it works

1. Choose **Add new Special Setting** and pick a **bonus type**.
2. Fill in the **conditions** for when it applies. **Empty fields are ignored.** Every field you fill in must match. In fields that take a comma-separated list, matching **any one** item is enough.
3. Fill in **what it gives**.

When a roll is made, each bonus whose conditions match shows up in the dice pool dialog, checked or unchecked according to *Check Bonus Automatically*.

**Tip:** if several actors have the same gift, use **Copy Special Settings to every Gift with same name** to update them all at once.

### Example: a +d8 attack bonus with axes

| Field | Value |
|---|---|
| Bonus type | Attack Bonus |
| Descriptor Field | `Axe` |
| Bonus Dice | `d8` |
| Bonus Stats | `-` |

## Bonus types

| Type | What it does |
|---|---|
| **Attack Bonus** | Adds to attacks with a weapon. |
| **Defense Bonus** | Adds to defenses: dodges, parries and special defenses. |
| **Counter Bonus** | Adds to counter-attacks. |
| **Resist Bonus** | Adds to resisting a weapon. |
| **Soak Bonus** | Adds to Soak. |
| **Guard Bonus** | Replaces or adds to what Guarding gives. Implies Guarding, so there's no need to require it. |
| **Aim Bonus** | Replaces or adds to what Aiming gives. Implies Aiming. |
| **Sprint Bonus** | Adds to Sprint. |
| **Initiative Bonus** | Adds to the Initiative check. |
| **Movement Bonus** | Adds Stride, Dash and Run, and can ignore bad footing. |
| **Flying Move Bonus** | Adds flying Stride, Dash and Run. Stacks with Movement Bonus. |
| **Reroll Bonus** | Allows a type of reroll from the chat [Rerolling Dialog](rolling.md#fixing-and-rerolling-a-roll). |
| **Range Penalty Reduction** | Reduces the actor's range penalty by some number of range bands. |
| **Encumbrance Limit Bonus** | Raises the actor's carrying capacity. |
| **Currency Value Change** | Changes a currency's value for this actor. |
| **Stat Change** | Swaps stats in an item when it's dragged onto the actor. |
| **Dice Upgrade** | Upgrades or downgrades an item's dice when it's dragged onto the actor. |

## Conditions: when a bonus applies

### Matching the item being used

These check the weapon, gift or item being rolled. Each takes a comma-separated list.

| Field | Matches if |
|---|---|
| **Type Field** | The item's type is listed (`gift`, `weapon`, `armor`...). |
| **Name Field** | Part of the item's name matches. |
| **Tag Field** | The item has one of the tags. |
| **Descriptor Field** | The item has one of the descriptors. |
| **Effect Field** | The item has one of the effects. |
| **Stat Field** | One of the item's roll stats is listed. |
| **Equip Field** | The item's equip type is listed. |
| **Range Field** | The item's range band is listed. |

### Matching the actor

| Field | Matches if |
|---|---|
| **Condition Field** | The actor has one of the conditions. |
| **Other Owned Item Field** | The actor owns an item with one of the names. |
| **Works When Gift State Is** | The gift is in that state: Any State, Refreshed or Exhausted. |
| **Needs a Second Readied Weapon** | The actor has another weapon readied. |

### Matching the attacker (defense, counter and resist bonuses)

These check the **attacking weapon**, so a defensive bonus can apply only against certain attacks.

| Field | Matches if |
|---|---|
| **Other Name Field** | Part of the attacking weapon's name matches. |
| **Other Descriptor Field** | The attacking weapon has one of the descriptors. |
| **Other Effect Field** | The attacking weapon has one of the effects. |
| **Other Attack Stat Field** | One of the attacking weapon's attack stats is listed. |
| **Other Equip Field** | The attacking weapon's equip type is listed. |
| **Other Range Field** | The attacking weapon's range band is listed, or, with *Use Actual Range*, the actual distance to the attacker. |
| **Use Actual Range** | Measure the real distance between attacker and defender instead of using the weapon's range band. |
| **Applies To Longer Ranges** / **Applies To Shorter Ranges** | Also match ranges longer or shorter than the ones listed. |

### Checkboxes for specific types

| Field | Bonus type | What it does |
|---|---|---|
| **Applies To Dodges** / **Parries** / **Special Defenses** | Defense Bonus | Which kinds of defense the bonus applies to. |
| **Applies To Rallying** | Range Penalty Reduction | Also reduce the penalty on Rally. |
| **Allow Use on Others** | Reroll Bonus | Allow the reroll on other people's rolls. |

## What a bonus gives

### Dice bonuses

| Field | What it does |
|---|---|
| **Bonus Sources** | Extra sources to add: `Armor` (worn armor), `Shield` (held shield), `Guard` or `Aim` (the Guarding or Aiming bonus if the actor has that condition), `Guard-always` or `Aim-always` (the bonus even without the condition). |
| **Bonus Stats** | Traits and skills to add, pre-checked. Empty uses the gift's own stats. `-` adds no stats. |
| **Bonus Dice** | Dice to add. Empty uses the gift's own dice. `-` adds no dice. |
| **Check Bonus Automatically** | **Always**, **Never**, or **By Applicability** (see below). |
| **Bonus Exhausts the Gift** | Using the bonus in a roll exhausts the gift, and the bonus needs the gift refreshed. |
| **Replaces the Base Bonus** | For Guard and Aim Bonus: replace the normal Guarding or Aiming dice instead of adding to them. |
| **Replacing Name** | The name of another gift this one replaces. This bonus is then only used in place of that gift's bonus of the same type, when it applies. Only one replacement per bonus type is supported. |

**By Applicability** changes how the conditions are used. The bonus **always** shows in the dice pool dialog, and the conditions only decide whether it's **pre-checked**. (The gift state check still applies normally.) It's meant for odd gifts that apply often but are hard to check reliably. Avoid using Bonus Sources and Bonus Stats with it.

### Movement

| Field | What it does |
|---|---|
| **Bonus Stride** / **Bonus Dash** / **Bonus Run** | Added to the actor's movement. |
| **Ignore Bad Footing** | The actor ignores bad footing. (Movement Bonus only.) |

### Reroll Bonus

| Field | What it does |
|---|---|
| **Reroll Type** | Reroll One, Favor Bonus, Luck, Knack or Keen Sense. |
| **Stat Field** | Which stats the roll must include to use the reroll. `-` uses the gift's skill. |
| **Reroll Identifier Override** | The label shown on the reroll instead of the type name. |

With **Favor Bonus**, a separate mini-roll for the bonus is shown first, then the reroll of the 1. If the bonus die itself rolls a 1, that's rerolled instead of the original 1.

### Other types

| Field | Bonus type | What it does |
|---|---|---|
| **Penalty Reduction** | Range Penalty Reduction | Number of range bands to reduce the penalty by. |
| **Encumbrance Bonus** | Encumbrance Limit Bonus | Added to the *unencumbered* limit. The higher limits are multiplied from it. |
| **Currency Name** / **Currency Value** | Currency Value Change | The currency and its new value. |
| **Change From** / **Change To** | Stat Change | Stats to swap. Both lists must have the same number of stats. Applies to a gift's dice and a weapon's attack, parry and counter pools. |
| **Upgrade Steps** | Dice Upgrade | Steps to upgrade each die (d4 → d6 is one step). Negative downgrades. Capped at d12 and d4. Applies to every die in the item. |
| **Name Addition** | Stat Change, Dice Upgrade | Text added to the changed item's name. Don't use square brackets. |
