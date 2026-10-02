# Settings

[← Back to the README](../README.md)

Open **Configure Settings** and choose the **Ironclaw Second Edition** section.

- **World settings** (GM only) are behind four buttons in that section: **World Settings Config**, **Currency Settings Config**, **Wildcard Template Configuration** and **Token HUD Conditions**.
- **Client settings** (each player's own) are listed directly in the section.

![The Ironclaw section of Configure Settings](images/settings-section.png)

Most automation is **on** by default. Turn off anything that doesn't suit how your table plays.

## World Settings Config

![The World Settings Config window](images/world-settings-config.png)

### Dice System Settings

| Setting | Default | What it does |
|---|---|---|
| Source ordered dice pools | On | Groups dice by where they came from, sorted by size within each group. Off sorts all dice by size, largest first. |
| One line pools ordered | Off | With source ordering on, keeps each comma-separated set of dice in a one-line pool separate, so `3d8, d6, d12` shows in that order. |
| Allow rerolling other users' dice | On | Lets reroll bonuses marked *Allow Use on Others* reroll other players' rolls. |

### Auto-Attack Calculation Settings

| Setting | Default | What it does |
|---|---|---|
| Auto-calculate attack effects | On | Works out damage from attacks and counters and posts a damage card. Needed for the combat options in the chat context menu. See [Combat](combat.md). |
| Auto-calculate displays failures | On | Also posts a card for failed attacks, saying the attack missed. |
| Auto-calculate does not display effect by default | Off | Doesn't post damage cards for normal attacks automatically. Post them from the context menu instead. Counters and resisted attacks still post when resolved. |

### Chat Buttons Settings

| Setting | Default | What it does |
|---|---|---|
| Chat buttons | On | Adds quick buttons to chat cards, e.g. to attack with or defend against a weapon. |
| Always show defense buttons | On | Shows defense buttons to everyone. Off hides them from the (non-GM) attacker. |
| Show other user's Tactics use | On | Shows the *Using Tactics* checkbox on weapon cards to everyone. Off shows it only to the GM and the sender. Gift bonuses still see it either way. |

### Auto Condition Settings

| Setting | Default | What it does |
|---|---|---|
| Auto-set initiative conditions | On | Gives Focused or Reeling from the Initiative check (but not Reeling from a tie, which is the player's choice). |
| Auto-remove conditions | On | Removes Aiming, Guarding and Temporary Ward when appropriate. See [Conditions](conditions.md#automatic-removal). |
| No turn maintenance | Off | Skips the start- and end-of-turn part of auto-removal. |
| Auto-add light when On Fire | On | Gives a burning actor a flame light if it has no light source. |
| Auto-apply Combat Advantage | On | Adds the Combat Advantage die to attacks when the defender has a condition that grants it. |

### Range & Distance Measurement Settings

| Setting | Default | What it does |
|---|---|---|
| Use range penalties | On | Adds a range penalty to dice pools when it can measure the distance, including height. |
| Match system and ruler measurements | Off | Measures distance the same imprecise way as Foundry's ruler. Off measures precisely (hold Shift on the ruler to see two decimal places). |
| Require special bonus range | Off | When a gift bonus's range check can't measure the distance, fail the check instead of ignoring it. |
| When 'Show range' uses combat rules | In Combat | Never, In Combat or Always: when the *Show range when targeting* label uses the combat rules for height, versus just adding height to the distance. |

### Item Related Settings

| Setting | Default | What it does |
|---|---|---|
| Send weapon gift exhaustion to chat | Off | Posts a message when using a weapon exhausts its gift. |
| Send weapon readying gift exhaustion to chat | Off | Posts a message when readying a weapon exhausts its gift. |
| Send gift use exhaustion to chat | Off | Posts a message when using a gift in a roll exhausts it. |
| Spark die auto-dwindles | On | Lowers a spark die by one step when it botches. Assumes the spark die field has a single die. |
| Ask to ready a weapon on use | On | Asks before readying a *Ready on Use* weapon. |
| Weapons ask to refresh their gifts | On | Using a weapon whose gift is exhausted asks to refresh the gift. Off ignores the gift's state. |
| NPC item messages have descriptions | On | Includes the description when an NPC's item is sent to chat. Off shows players only the buttons. |

### Miscellaneous Settings

| Setting | Default | What it does |
|---|---|---|
| Use token names | On | Rolls show the token's name and image instead of the actor's. |
| Show Ironclaw-specific token buttons | On | Adds two buttons under tokens. By default the left opens the dice pool dialog and the right opens the damage dialog (each player can change these). |
| Auto-setup prototype tokens | On | Gives newly created actors type-specific prototype token defaults. |
| Allow Non-GM Users to request Rolls | On | Lets players use [Request a Roll](rolling.md#asking-players-to-roll). |
| Auto-manage encumbrance | Off | Manages Burdened, Over-Burdened and Cannot Move from carried weight and armor. Reload the world after changing it. See [Conditions](conditions.md#encumbrance). |
| Make coins have weight | On | Counts coins toward carried weight. Reload the world after changing it. |

## Currency Settings Config

Sets the name, plural, sign, value and weight of each currency, and which ones are used. Changes need a world reload to apply to existing actors.

## Wildcard Template Configuration

Automatically applies [species and career templates](getting-started.md#species-and-career-templates) to mook and beast tokens when they're placed, based on the token's image file name.

1. Put your Species Templates in one Items folder and your Career Templates in another.
2. Right-click each folder and choose **Set as Species Template Source** or **Set as Career Template Source**.
3. Check **Apply Wildcard Templates** on the mook or beast.
4. Name the token images so they contain the template's item name, e.g. `Mook-Bandit-Wolf-1.png` for a *Bandit* career and *Wolf* species.

When a token is placed, the system fills in the species or career from a template whose **item name** appears in the image file name. It only does this if the actor's *Species Name* or *Career Name* is empty. *Search the full image path* also matches folder names, for modules that randomize folders too.

## Token HUD Conditions

Choose which conditions appear in the Token HUD. See [Conditions](conditions.md#choosing-which-conditions-show-in-the-token-hud).

## Client settings

| Setting | Default | What it does |
|---|---|---|
| Damage to chat by default | On | Pre-checks *Send to Chat* in the damage dialog. |
| Gift state change to chat by default | On | Pre-checks *Send to Chat* when exhausting or refreshing a gift. |
| Confirm sending item info | Off | Asks before sending an item's information to chat. |
| Show range when targeting | On | Shows a floating label with the range band when you target a token. |
| Range text duration | 3000 | How long that label stays up, in milliseconds. |
| Default item macro sends to chat | On | Item hotbar macros send info to chat by default. Hold the Quick Roll key when dragging for the other kind. See [Hotbar macros](items.md#hotbar-macros). |
| Left token button / Right token button | Dice pool / Damage | What the two buttons under a token do. |

The **Quick Roll Modifier Key** (default Control) is set in Foundry's **Configure Controls**.
