# Conditions

[← Back to the README](../README.md)

The system includes all the standard Ironclaw conditions, plus a few **Misc** markers the GM can use to tell tokens apart. The **Status Effects** compendium describes each one.

Add or remove conditions from the **Token HUD** or the sheet's **Status Effects** tab.

![The Token HUD's condition palette](images/token-hud-conditions.png)

## Taking damage

Open the damage dialog with the sheet's **Apply Damage** button, the right button under a token, or a **Soak** button on a [damage card](combat.md#running-an-attack) (which fills it in for you).

![The damage dialog](images/damage-dialog.png)

| Field | What to enter |
|---|---|
| **Damage received** | The attack's raw damage. |
| **Soaked** | Your Soak successes. It's fine for the result to be negative. |
| **Is the damage from an attack?** | Only damage from an attack makes the target Reeling. Uncheck it for things like fire or falling. |
| **Knockout Strike?** / **Non-lethal attack?** | For attacks meant to knock out rather than kill. |
| **Reduce the damage by Ward** | Shown when the actor has a Ward. |
| **Other conditions to add** | Extra conditions the attack causes, e.g. `Knockdown`. |

**Don't add damage from your own conditions.** The dialog adds the extra damage from **Hurt** and **Injured** itself and shows it under *Condition Damage*.

The resulting conditions (Hurt, Injured, Dying and so on) are applied for you.

## Automatic removal

With *Auto-remove conditions* on (the default), the system takes these off for you:

| Condition | Removed |
|---|---|
| **Aiming** | After the actor attacks, and at the end of their turn. |
| **Guarding** | At the start of the actor's next turn. |
| **Temporary Ward** | When it's reduced to zero by damage. |

Turn on *No turn maintenance* to keep the after-attack removal but skip the start- and end-of-turn removal.

## Other automation

| Setting | What it does |
|---|---|
| **Auto-set initiative conditions** | Gives Focused or Reeling from the Initiative check. See [Combat](combat.md#initiative). |
| **Auto-apply Combat Advantage** | Adds the Combat Advantage die to attacks against a defender with a condition that grants it. |
| **Auto-add light when On Fire** | Gives a burning actor a flame light if it has no other light source. |
| **Auto-manage encumbrance** | Off by default. See below. |

All of these are in the **World Settings Config** menu. See [Settings](settings.md).

## Encumbrance

With *Auto-manage encumbrance* on, the system gives actors **Burdened**, **Over-Burdened** and **Cannot Move** based on their carried weight and worn armor.

- **Don't toggle these conditions by hand** while it's on, or it can get confused.
- After turning it on or off, **reload the world** for it to apply to every actor.
- *Make coins have weight* controls whether money counts toward the weight.

## Choosing which conditions show in the Token HUD

The GM can hide conditions they don't use from the Token HUD. In **Configure Settings**, open the **Ironclaw Second Edition** section and choose **Token HUD Conditions**, then uncheck any you don't want in the palette.

![The Token HUD Conditions menu](images/token-hud-conditions-menu.png)

Hidden conditions still work everywhere else. A token that already has a hidden condition still shows it in the HUD, so it can be removed.
