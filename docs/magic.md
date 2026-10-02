# Magic

[← Back to the README](../README.md)

Spells are **Magic Gifts**: gifts that hold any number of **spell attacks**. Each spell attack works like its own weapon, with its own effect, defense, range and dice pools.

## Making a spell

1. Create a **Magic Gift** item, or open an existing gift and choose **Convert to Magic Gift** on its **Advanced Settings** tab. Converting keeps all the gift's settings, but it can't be undone.
2. Fill in the **Gift Attributes** tab like any other gift: gift dice, refresh, exhaustion and so on. See [Gifts](items.md#gifts).
3. On the **Spell Attributes** tab, choose **Add new Attack** for each way the spell can be used.

![The Spell Attributes tab of a Magic Gift](images/magic-gift-spell-tab.png)

### Spell attack fields

| Field | What it does |
|---|---|
| **Attack name** | Shown when you pick which attack to use. |
| **Effect** | Comma-separated effects, as on a [weapon](items.md#effects-and-defenses). |
| **Opposing Defense** / **Resist With** | What the target defends or resists with. Check **Defense is Resist** for resisted spells. |
| **Descriptors** | Comma-separated descriptors. |
| **Range** | The spell's range band. |
| **Attack Pool** | The pool to cast the attack with, e.g. `Will, Spellcraft`. |
| **Counter Pool** | The pool to counter with, if the spell can counter. |
| **Success Tiers** | Conditions to apply based on how well the attack succeeds. See below. |

A spell attack doesn't need an Effect if it has success tiers.

## Success tiers

Success tiers let a spell do different things depending on its **net successes**. Choose **Add Tier** and fill in:

| Field | Example |
|---|---|
| **Successes** | `2` |
| **Remove** | Conditions to take off the target, e.g. `Afraid` |
| **Add** | Conditions to put on the target, e.g. `Blinded, Confused` |
| **Note** | Any text to show with the result |

When the attack is rolled, the **highest tier the net successes reach** is shown on the damage card, with an **Apply to Target** button that removes and adds the listed conditions.

![A damage card showing a success tier and its Apply to Target button](images/spell-success-tier-card.png)

## The Magic tab

Characters, mooks and beasts list their Magic Gifts on the **Magic** tab. Click the arrow next to a spell to show or hide its spell attacks.

![The Magic tab with a spell's attacks expanded](images/magic-tab.png)

## Readying and casting

| You do | What happens |
|---|---|
| **Ready** a spell | The spell is exhausted. If it's already exhausted, you're offered a refresh first. |
| **Cast** a readied spell | It isn't exhausted again. It becomes unreadied. |
| **Cast** an unreadied spell | It's exhausted as normal. |
| **Counter** with a spell | Only readied spells can counter. |

## Using a spell in combat

Spells work like weapons in [Combat](combat.md#running-an-attack):

- **Sending a spell to chat** or **attacking with it** asks which spell attack to use. You can also send *the spell itself, no attack* to show just the gift.
- **Counter with...** on a weapon card lists each spell attack separately.
- Defending, attacking against a defense, and damage cards all work the same as for weapons.
