# Ironclaw Second Edition for Foundry VTT

A Foundry VTT game system for **Ironclaw Second Edition** (*Ironclaw Omnibus: Squaring the Circle*). It handles Ironclaw's dice pools, combat exchanges, gifts, spells and conditions, so you can spend less time counting dice and more time playing.

![A character sheet and an attack resolving in chat](docs/images/readme-hero.png)

**Requires Foundry VTT v13.**

## Install

In Foundry's **Game Systems** tab, choose **Install System** and paste this manifest URL:

```
https://github.com/Tierran/Ironclaw2E-FoundryVTT-System/releases/latest/download/system.json
```

## What it does

- **Character, mook and beast sheets.** Click a trait, skill, weapon or gift to roll it.
- **Dice pools assembled for you.** Worn armor, held shields, gift bonuses, range penalties, Combat Advantage and conditions are added to the right rolls automatically.
- **Combat in chat.** Defend against an attack, then let the attacker roll back against your defense with one click. Damage, counters and resisted attacks are worked out for you.
- **Magic Gifts** for spells, with several attacks per spell and success tiers that apply conditions.
- **Initiative** with Ironclaw's side-based or classic styles.
- **All the standard conditions**, with automatic removal of Aiming and Guarding and optional encumbrance tracking.

## Documentation

Start with **[Getting Started](docs/getting-started.md)**, or jump to a topic:

| | |
|---|---|
| [Getting Started](docs/getting-started.md) | Install, actor types, building a character |
| [Rolling Dice](docs/rolling.md) | The dice pool dialog, pool formats, rerolls and fixing rolls |
| [Combat](docs/combat.md) | Initiative, attacking, defending, counters and damage |
| [Items and Gear](docs/items.md) | Weapons, armor, shields, gifts, light sources and hotbar macros |
| [Magic](docs/magic.md) | Magic Gifts, spell attacks and success tiers |
| [Conditions](docs/conditions.md) | Status effects, damage, automatic removal and encumbrance |
| [Gift Bonuses](docs/gift-bonuses.md) | Reference for a gift's Advanced Settings |
| [Settings](docs/settings.md) | Every system setting and what it does |
| [Chat Commands and Macros](docs/chat-commands-and-macros.md) | Slash commands and the bundled macros |

See the [CHANGELOG](CHANGELOG.md) for what's new.

## Compendiums

The included compendiums **do not** contain characters, gifts, gear or other content from the Ironclaw books. They hold paraphrased rules references, status effect descriptions and the bundled macros.

## License

Ironclaw © SanguineGames.com. This is a fan project, not associated with Sanguine Productions.

Foundry VTT integration is licensed under the Foundry Virtual Tabletop EULA's [Limited License Agreement for Module Development](https://foundryvtt.com/article/license/).

This system is licensed under the MIT License in [LICENSE](LICENSE). Some content is excluded from the MIT License and covered by its own license, marked by an `EXCLUDED.txt` file in the same directory.

Originally built from the [Boilerplate system](https://gitlab.com/asacolips-projects/foundry-mods/boilerplate).
