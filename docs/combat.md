# Combat

[← Back to the README](../README.md)

## Initiative

Add combatants to the tracker as usual. When you **roll initiative**, the system rolls each combatant's Initiative check for you and orders the tracker by Ironclaw's rules.

### Combat tracker settings

Open the combat tracker's **settings** to choose how initiative works.

![The combat tracker settings](images/combat-tracker-settings.png)

| Setting | What it does |
|---|---|
| **Use side-based initiative** | On: Ironclaw's standard side-based initiative. Off: the classic alternative, ordered by the highest die of the Initiative check, with ties broken by the second highest. |
| **Combat sides used** | How combatants are grouped and which side goes first: Players vs NPCs, Allies vs Enemies, or Players and Allies vs Enemies, in either order. Allies and enemies come from token disposition, with neutrals counted as enemies. In classic mode this only decides who counts as an enemy for the check's TN. |
| **Set TN manually** | The TN for the Initiative check. Leave it at **-1** to have the system work it out from the distance to the nearest enemy. |
| **Force initiative settings** | Each encounter saves these settings when you press **Begin Combat**, so different encounters can use different settings. Check this to make every encounter use the tracker's current settings instead. |

The GM sees each combatant's Initiative check result in the tracker before their initiative: the number of successes, or **T** (tie), **F** (failure) or **B** (botch).

If *Auto-set initiative conditions* is on (the default), combatants get **Focused** or **Reeling** from their check automatically. Reeling from a **tie** isn't applied, because taking it is the player's choice.

## Running an attack

The automation works best when **the defender rolls first** and the attacker responds to the defense.

![An attack resolved in chat: weapon card, defense roll, attack roll and damage card](images/attack-flow.png)

1. **The attacker targets** the token they're attacking and **sends the weapon to chat** (double-click it on the sheet, or use its Send to Chat button). The card shows the weapon's dice, effects and the defense it's opposed by.
2. **The defender rolls a defense** using the buttons on that card: **Dodge**, **Parry with...**, **Counter with...**, **Special Defend** or **Resist Against**, depending on the weapon.
3. **The attacker rolls against that defense** with the **Attack This Defense** button on the defense roll (or by right-clicking it and choosing *Attack Against This Defense*). The attack automatically uses the defense roll's result as its target. If someone other than the original attacker uses the button, they pick one of their own weapons.
4. **A damage card** appears in chat showing whether the attack hit and how much damage it does at each damage level.
5. **The defender clicks a Soak button** on the damage card for the matching damage level. This rolls their Soak and then opens the damage dialog with the damage and soak already filled in. See [Conditions](conditions.md#taking-damage).

![The damage card with its soak buttons](images/damage-card.png)

The attacker can also roll straight from the weapon card with **Attack with *weapon***, without waiting for a defense. For resisted weapons, the **Basic** button attacks while skipping the resistance step.

### Explosions and other automatic hits

Attacks that hit automatically work the other way round:

1. The attacker places the **AoE template** from the weapon card's **Place AoE Template** button.
2. The attacker **rolls the attack first**.
3. Each defender clicks a **Soak** button on the damage card. This rolls their **resist and Soak together**, and the resist successes reduce the damage.

### Counter-attacks

When the defender uses **Counter with...**, the counter is resolved when the attacker rolls against it:

- If the counter was rolled against a **TN** (a resisted attack), the result is worked out automatically. On a **tie** or a **counter win**, the counter's damage is posted for you.
- Otherwise, right-click the counter roll and choose **Resolve the Counter-Attack**, then enter the attacker's highest die.

### Resisted attacks

Weapons whose *Opposing Defense* is a resistance (with *Defense is Resist* checked) can be resolved by right-clicking the attack roll:

- **Resolve the Resisted Attack** asks how many successes the defender's resist roll got.
- **Resolve as Normal Attack** treats it as an ordinary hit, e.g. when the defender tried to counter and failed.

### Slaying damage

When a target is weak to a weapon, right-click the attack roll and choose **Send the Attack as Slaying** (or **Resolve as Normal Slaying Attack**).

## The chat context menu

Right-click a roll in chat for these combat options. The rolling options (TN, rerolls) are covered in [Rolling Dice](rolling.md#fixing-and-rerolling-a-roll).

| Option | What it does |
|---|---|
| **Attack Against This Defense** | Attack the defense roll you right-clicked, with the weapon it was defending against. |
| **Send the Attack to Chat** | Post the damage card for an attack, if it wasn't posted automatically. |
| **Send the Attack as Slaying** | Post the damage card with Slaying damage. |
| **Resolve the Counter-Attack** | Work out a counter's damage from the attacker's highest die. |
| **Resolve the Resisted Attack** | Work out a resisted attack's damage from the defender's result. |
| **Resolve as Normal Attack** / **Resolve as Normal Slaying Attack** | Treat a resisted attack as a normal one. |

All of these except *Attack Against This Defense* need the *Auto-calculate attack effects* setting, which is on by default. Most are only shown to the player who made the roll.

## What gets added to rolls automatically

You don't need to add these by hand. They appear as pre-checked options in the dice pool dialog when they apply.

| Bonus | When |
|---|---|
| **Worn armor** and **held shield** | In Soak and defense rolls. Up to three worn armors and one held shield count. |
| **Range penalty** | When you're targeting a token. The penalty for the range band is worked out from the distance, including height. |
| **Combat Advantage** | When the defender has a condition that grants it. Can be turned off in [Settings](settings.md#auto-condition-settings). |
| **Guarding** and **Aiming** | When the actor has the condition. |
| **Gift bonuses** | When a gift's [Advanced Settings](gift-bonuses.md) say they apply. |
| **Tactics** | When the weapon card's **Using Tactics** box is checked. |

### Using Tactics

The weapon card has a **Using Tactics** checkbox, which the GM and the player who sent the card can toggle. Gift bonuses that check for Tactics (e.g. Counter-Tactics) use it. The system also tries to work out whether your target is being threatened by your allies when it posts the card.

If the checkbox isn't visible, either the attacker has no Tactics, the weapon's attack pool already includes Tactics, or *Show other user's Tactics use* is off and you're not the GM or the sender.

## Movement and range

- **Targeting a token** shows a floating label with its range band from your controlled token. Turn this off with the *Show range when targeting* client setting.
- **Rally** rolls from the sheet use the range penalty to your target.
- **Sprint** is on the Battle Statistics tab.
