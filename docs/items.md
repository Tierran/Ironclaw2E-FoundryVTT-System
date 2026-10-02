# Items and Gear

[← Back to the README](../README.md)

## Item types

| Type | Use it for |
|---|---|
| **Gift** | Gifts. Can roll a dice pool, be exhausted and refreshed, and grant [bonuses](gift-bonuses.md) to other rolls. |
| **Magic Gift** | Spells. A gift with any number of spell attacks. See [Magic](magic.md). |
| **Extra Career** | The Extra Career gift, which works like a second career. |
| **Weapon** | Anything that attacks, parries or counters, including natural weapons. |
| **Armor** | Worn armor. Its dice are added to Soak. |
| **Shield** | Held shields. Its cover die is added to defenses. |
| **Light Source** | Torches, lanterns and the like. Lighting one puts a light on the actor's token. |
| **Item** | Everything else. Has weight and quantity but no rules. |
| **Species Template** / **Career Template** | Bundles you drag onto an actor to apply a species or career. See [Getting Started](getting-started.md#species-and-career-templates). |

Items with weight take either a fraction (`1/8`) or a decimal (`0.125`).

**Show in Battle Stats** on weapons, armor, shields, gifts and light sources puts the item on the actor's Battle Statistics tab, where you can roll and ready it from one place.

## Weapons

![A weapon sheet](images/weapon-sheet.png)

### Dice pools

| Field | Example |
|---|---|
| **Attack Pool** | `Body, Melee Combat` |
| **Defense Pool** (parry) | `Body, Melee Combat` |
| **Counter Pool** | `Body, Melee Combat; d8` |
| **Spark Die** | `d12` |

Pools use the [dice pool format](rolling.md#dice-pool-stats-and-dice). Leave a pool empty if the weapon can't be used that way, and its button won't show.

### Effects and defenses

| Field | How to fill it in |
|---|---|
| **Effect** | Comma-separated, e.g. `Damage +2, Slaying, Awkward`. The automation reads these, so spell them as the book does. |
| **Descriptors** | Comma-separated, e.g. `Edged, Heavy`. Wands and rods should include `Wand` or `Rod`. |
| **Opposing Defense** | What the target defends with. Usually `Defense`. Can include dice, e.g. `Will, Inquiry, d6`, and the other side's stats with `@`. |
| **Defense is Resist** | Check this if the defense is a resistance. The field becomes **Resist With**. |
| **Equips to** / **Range** | The weapon's handedness and range band. |

`Flat` anywhere in the effects makes the damage flat, e.g. `Damage 2, Flat`. `Flat 2` works on its own.

### Readying and gifts

| Field | What it does |
|---|---|
| **Readied** | Whether the weapon is in hand. |
| **Ready on Use** | Using the weapon readies it automatically (asking first, unless *Ask to ready a weapon on use* is off). |
| **Auto-Stow** | The weapon is put away automatically after use. |
| **Exhausts a Gift** / **Auto-Exhaust Gift Name** | Attacking or countering with the weapon exhausts the named gift. If the gift is already exhausted, you're asked to refresh it (see *Weapons ask to refresh their gifts* in [Settings](settings.md#item-related-settings)). |
| **Exhausts when Readied** | Exhaust the gift when readying instead of when using. |
| **Threatens** / **Threat Range** | Whether, and how far, the weapon threatens. Used for the Tactics checks in [Combat](combat.md#using-tactics). |

### Upgrades

A weapon can be an upgrade of another (**Upgrades from a Weapon**, **Auto-Upgrade Weapon Name**). Readying the upgrade requires the original to be readied first, and the system offers to ready it for you. **Upgrade Action** notes the action needed, and **Upgrade Condition** gives the actor a condition when upgrading, e.g. action *Aim* with condition *Aiming*.

This can lead to several prompts in a row if gifts need refreshing or the original weapon is itself an upgrade. Each ready or refresh is still a separate action in the rules.

## Armor and shields

- **Armor:** set **Armor Dice** (e.g. `d8`) and check **Worn**. Up to **three** worn armors count toward Soak.
- **Shields:** set the **Shield Cover Die** and check **Held**. Only **one** held shield counts.

Both are added to the right rolls automatically. Their dice fields only take dice, not stat names.

## Gifts

![A gift sheet](images/gift-sheet.png)

| Field | What it does |
|---|---|
| **Gift dice** | The pool the gift rolls, e.g. `Mind, Inquiry` or `;d12` for a bonus die with no stats. |
| **Default TN** | Rolls the gift as a TN roll by default. |
| **Exhausts when used** | Using the gift exhausts it. |
| **Refresh** | How the gift is refreshed. A gift with a Refresh entry shows the **Exhausted/Refreshed** toggle on the sheet. |
| **Grants a Skill Mark** | Adds a mark to a skill. |
| **Extra Sense** | Gives the actor a special sense. See [Senses](#senses). |
| **Tags** | Comma-separated tags that [gift bonuses](gift-bonuses.md) can match. |

Situational bonuses, like Strength or Veteran, are set up on the gift's **Advanced Settings** tab. See [Gift Bonuses](gift-bonuses.md).

### Senses

Gifts with an **Extra Sense** can be switched on and off from the sheet, or through a hotbar macro if the gift has nothing else to use. Switching one on changes the token's vision mode, and switching all of them off restores the token's original vision.

Some senses are passive, or partly passive, and apply automatically while the actor has the gift. These show an icon next to the sense name instead of an activate button.

## Light sources

Lighting a **Light Source** puts its light (dim and bright range, color, animation) on the actor's token. With *Auto-add light when On Fire* on, a burning actor gets a flame light automatically if it has no other light.

## Hotbar macros

Drag any item onto the hotbar to make a macro for it.

- **By default**, the macro sends the item's information to chat.
- **Hold the Quick Roll key** (default **Control**) while dragging to make a macro that **uses** the item instead: weapons ask how to use it (Attack, Spark, Parry, Counter), gifts roll or refresh, armor and light sources toggle worn or lit.

Swap these with the *Default item macro sends to chat* client setting.

## Money

Actors track money on the **Items** tab. The GM can rename currencies, change their values and weights in the **Ironclaw Currency Settings Config** menu. Coins count toward encumbrance unless *Make coins have weight* is off.
