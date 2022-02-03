import { checkDiceArrayEmpty } from "../helpers.js";
import { addArrays } from "../helpers.js";
import { makeCompareReady } from "../helpers.js";
import { reformDiceString } from "../helpers.js";
import { convertCamelCase } from "../helpers.js";
import { getMacroSpeaker } from "../helpers.js";
import { findActorToken } from "../helpers.js";
import { findTotalDice } from "../helpers.js";
import { splitStatString } from "../helpers.js";
import { nullCheckConcat } from "../helpers.js";
import { parseSingleDiceString } from "../helpers.js";
import { checkDiceArrayIndex } from "../helpers.js";
import { getDiceArrayMaxValue } from "../helpers.js";
import { checkApplicability } from "../helpers.js";
import { compareDiceArrays } from "../helpers.js";
import { getSpeakerActor } from "../helpers.js";
import { checkQuickModifierKey } from "../helpers.js";
import { CommonConditionInfo } from "../conditions.js";
import { checkStandardDefense, CommonSystemInfo } from "../systeminfo.js";
// For condition management
import { hasConditionsIronclaw } from "../conditions.js";
import { getConditionNamesIronclaw } from "../conditions.js";
import { addConditionsIronclaw } from "../conditions.js";
import { removeConditionsIronclaw } from "../conditions.js";
// The rest are for the supermassive function
import { rollTargetNumberArray } from "../dicerollers.js";
import { rollHighestArray } from "../dicerollers.js";
import { enforceLimit } from "../helpers.js";
import { burdenedLimitedStat } from "../helpers.js";
import { Ironclaw2EItem } from "../item/item.js";

Hooks.on("renderChatMessage", function (message, html, data) {
    const noButtons = game.settings.get("ironclaw2e", "noChatButtons");
    const showOthersToAll = game.settings.get("ironclaw2e", "showDefenseButtons");
    const itemInfo = message.getFlag("ironclaw2e", "itemInfo");
    const attackInfo = message.getFlag("ironclaw2e", "attackDamageInfo");
    if (noButtons) {
        html.find('.button-holder').remove();
    } else {
        const buttons = html.find('.button-holder');
        const showAuthor = game.user.isGM || message.isAuthor;
        const showOthers = game.user.isGM || !message.isAuthor || showOthersToAll;
        if (itemInfo) {
            if (showAuthor) {
                const attackHolder = buttons.find('.attack-buttons');
                attackHolder.find('.default-attack').click(Ironclaw2EActor.onChatAttackClick.bind(this));
                attackHolder.find('.skip-attack').click(Ironclaw2EActor.onChatAttackClick.bind(this));
                attackHolder.find('.spark-attack').click(Ironclaw2EActor.onChatSparkClick.bind(this));
            } else {
                buttons.find('.attack-buttons').remove();
            }
            if (showOthers) {
                const defenseHolder = buttons.find('.defense-buttons');
                defenseHolder.find('.dodge-defense').click(Ironclaw2EActor.onChatDefenseClick.bind(this));
                defenseHolder.find('.parry-defense').click(Ironclaw2EActor.onChatDefenseClick.bind(this));
                defenseHolder.find('.special-defense').click(Ironclaw2EActor.onChatDefenseClick.bind(this));
                defenseHolder.find('.resist-defense').click(Ironclaw2EActor.onChatDefenseClick.bind(this));
                defenseHolder.find('.counter-defense').click(Ironclaw2EActor.onChatDefenseClick.bind(this));
            } else {
                buttons.find('.defense-buttons').remove();
            }
        }
        if (attackInfo) {
            if (showOthers) {
                buttons.find('.soak-button').click(Ironclaw2EActor.onChatSoakClick.bind(this));
            } else {
                buttons.remove();
            }
        }
    }
});

/**
 * Extend the base Actor entity by defining a custom data necessary for the Ironclaw system
 * @extends {Actor}
 */
export class Ironclaw2EActor extends Actor {

    /* -------------------------------------------- */
    /* Static Functions                             */
    /* -------------------------------------------- */

    /**
     * Handle the chat button event for clicking attack
     * @param {any} event
     */
    static async onChatAttackClick(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const holderset = $(event.currentTarget).closest('.button-holder')[0]?.dataset;

        if (!holderset) {
            return console.warn("onChatAttackClick somehow failed to get proper data.")
        }

        // Get the actor, either through the sceneid if synthetic, or actorid if a full one
        let attackActor = null;
        if (holderset.sceneid && holderset.tokenid) {
            const foo = game.scenes.get(holderset.sceneid)?.tokens.get(holderset.tokenid);
            attackActor = foo?.actor;
        } else if (holderset.actorid) {
            attackActor = game.actors.get(holderset.actorid);
        }

        const directroll = checkQuickModifierKey();

        // If the attacker is found and the itemid exists, roll the attack
        if (attackActor && holderset.itemid) {
            attackActor.items.get(holderset.itemid).attackRoll(directroll, dataset?.skipresist == "true");
        } else if (!attackActor) {
            ui.notifications.warn("ironclaw2e.ui.actorNotFoundForMacro", { localize: true });
        }
    }

    /**
     * Handle the chat button event for clicking spark
     * @param {any} event
     */
    static async onChatSparkClick(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const holderset = $(event.currentTarget).closest('.button-holder')[0]?.dataset;

        if (!holderset) {
            return console.warn("onChatAttackClick somehow failed to get proper data.")
        }

        // Get the actor, either through the sceneid if synthetic, or actorid if a full one
        let attackActor = null;
        if (holderset.sceneid && holderset.tokenid) {
            const foo = game.scenes.get(holderset.sceneid)?.tokens.get(holderset.tokenid);
            attackActor = foo?.actor;
        } else if (holderset.actorid) {
            attackActor = game.actors.get(holderset.actorid);
        }

        const directroll = checkQuickModifierKey();

        // If the attacker is found and the itemid exists, roll the attack
        if (attackActor && holderset.itemid) {
            attackActor.items.get(holderset.itemid).sparkRoll(directroll);
        } else if (!attackActor) {
            ui.notifications.warn("ironclaw2e.ui.actorNotFoundForMacro", { localize: true });
        }
    }

    /**
     * Handle the chat button event for clicking defense
     * @param {any} event
     */
    static async onChatDefenseClick(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const defenseset = $(event.currentTarget).closest('.defense-buttons')[0]?.dataset;

        if (!defenseset) {
            return console.warn("onChatDefenseClick somehow failed to get proper data.")
        }

        // Get the actor based on the current speaker
        let defenseActor = getSpeakerActor();
        let validDefenses = {};
        let defenseOptions = [];

        const directroll = checkQuickModifierKey();

        // Check what defense type was called and either directly roll that defense or compile the list of weapons that fit the type for the next step
        if (defenseActor && dataset?.defensetype) {
            switch (dataset.defensetype) {
                case "dodge":
                    return defenseActor.popupDefenseRoll({ "prechecked": ["speed", "dodge"] }, { directroll });
                    break;
                case "special":
                    return defenseActor.popupDefenseRoll({ "prechecked": splitStatString(defenseset.defense) }, { directroll, "isspecial": true });
                    break;
                case "resist":
                    return defenseActor.popupSelectRolled({ "prechecked": splitStatString(defenseset.defense) }, { directroll });
                    break;
                case "parry":
                    const parries = defenseActor.items.filter(element => element.data.type === 'weapon' && element.data.data.canDefend);
                    defenseOptions = parries;
                    validDefenses.parryvalid = true;
                    break;
                case "counter":
                    const counters = defenseActor.items.filter(element => element.data.type === 'weapon' && element.data.data.canCounter);
                    defenseOptions = counters;
                    validDefenses.countervalid = true;
                    break;
                default:
                    console.error("Somehow, onChatDefenseClick defaulted on the defensetype switch: " + dataset.defensetype);
                    break;
            }
        }

        // Call the actual popup dialog to choose with what weapon to defend with
        if (defenseActor) {
            Ironclaw2EActor.weaponDefenseDialog(defenseActor, defenseOptions, defenseset?.weaponname, validDefenses);
        } else {
            ui.notifications.warn("ironclaw2e.ui.actorNotFoundForMacro", { localize: true });
        }
    }

    /**
     * Handle the chat button event for clicking soak
     * @param {any} event
     */
    static async onChatSoakClick(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const holderset = $(event.currentTarget).closest('.button-holder')[0]?.dataset;

        if (!holderset) {
            return console.warn("onChatSoakClick somehow failed to get proper data.")
        }

        // Get the actor, either through the sceneid if synthetic, or actorid if a full one
        let soakActor = getSpeakerActor();

        const directroll = checkQuickModifierKey();
        const usedDamage = Number.parseInt(dataset.damage);

        // If the soak actor is found and the data necessary for it exists, roll the soak
        if (soakActor && dataset.soaktype) {
            let wait = function (x) {
                if (x.tnData) {
                    const verybad = (x.highest === 1 ? 1 : 0); // In case of botch, increase damage by one
                    if (!directroll)
                        soakActor.popupDamage(usedDamage + verybad, x.tnData.successes, holderset.conditions);
                    else soakActor.silentDamage(usedDamage + verybad, x.tnData.successes, holderset.conditions);
                }
            };
            if (dataset.soaktype != "conditional") {
                soakActor.popupSoakRoll({ "prechecked": ["body"] }, { directroll, "checkweak": (holderset.weak == "true"), "checkarmor": (holderset.penetrating == "false") }, wait);
            } else {
                if (!directroll)
                    soakActor.popupDamage(-4, 0, holderset.conditions);
                else soakActor.silentDamage(-4, 0, holderset.conditions);
            }
        } else {
            ui.notifications.warn("ironclaw2e.ui.actorNotFoundForMacro", { localize: true });
        }
    }

    /**
     * Construct and pop up a dialog to pick the defending weapon
     * @param {Ironclaw2EActor} actor The actor in question
     * @param {[Ironclaw2EItem]} optionsource What options are available
     * @param {string} weaponname The name of the attacking weapon
     * @param {boolean} [parryvalid] Whether parries are a valid option
     * @param {boolean} [countervalid] Whether counters are a valid option
     */
    static async weaponDefenseDialog(actor, optionsource, weaponname, { parryvalid = false, countervalid = false } = {}) {
        const heading = game.i18n.format("ironclaw2e.dialog.defense.heading", { "weapon": weaponname });
        const rollLabel = game.i18n.format("ironclaw2e.dialog.defense.label", { "weapon": weaponname });
        let options = "";

        if (actor) {
            if (parryvalid) {
                for (let foo of optionsource) {
                    if (foo.data.data.canDefend)
                        options += `<option value="${foo.id}" data-type="parry">${game.i18n.format("ironclaw2e.dialog.defense.parryRoll", { "name": foo.name })}</option >`;
                }
            }
            if (countervalid) {
                for (let foo of optionsource) {
                    if (foo.data.data.canCounter)
                        options += `<option value="${foo.id}" data-type="counter">${game.i18n.format("ironclaw2e.dialog.defense.counterRoll", { "name": foo.name })}</option >`;
                }
            }
        }
        options += `<option value="" data-type="extra">${game.i18n.localize("ironclaw2e.dialog.defense.extraOnly")}</option >`;

        let confirmed = false;
        let speaker = getMacroSpeaker(actor);
        let dlog = new Dialog({
            title: heading,
            content: `
        <form class="ironclaw2e">
        <div class="flexcol">
         <span class="small-text">${game.i18n.format("ironclaw2e.dialog.dicePool.showUp", { "alias": speaker.alias })}</span>
         <select name="defensepick" id="defensepick">
         ${options}
         </select>
        </div>
        <div class="form-group">
         <label class="normal-label">${game.i18n.localize("ironclaw2e.dialog.defense.extraField")}:</label>
	     <input id="extra" name="extra" value="" onfocus="this.select();"></input>
        </div>
        </form>`,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.pick"),
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.cancel"),
                    callback: () => confirmed = false
                }
            },
            default: "one",
            render: html => { document.getElementById("defensepick").focus(); },
            close: html => {
                if (confirmed) {
                    const directroll = checkQuickModifierKey();

                    let DEFENSE = html.find('[name=defensepick]')[0];
                    const defensetype = DEFENSE.selectedOptions[0].dataset.type;
                    const defensevalue = DEFENSE.selectedOptions[0].value;
                    let EXTRA = html.find('[name=extra]')[0]?.value;

                    if (defensetype === "counter" || defensetype === "parry") {
                        const weapon = actor?.items.get(defensevalue);
                        if (defensetype === "counter") weapon?.counterRoll(directroll);
                        if (defensetype === "parry") weapon?.defenseRoll(directroll);
                    } else if (defensetype === "extra") {
                        let extra = findTotalDice(EXTRA);
                        rollHighestArray(extra, rollLabel, actor);
                    }
                }
            }
        });
        dlog.render(true);
    }

    /* -------------------------------------------- */
    /* Overrides                                    */
    /* -------------------------------------------- */


    async _preCreate(data, options, user) {
        const autoPrototypeSetup = game.settings.get("ironclaw2e", "autoPrototypeSetup");
        if (!autoPrototypeSetup) // If not enabled, immediately return out of the function
            return;

        data.token = {};
        data.token.displayName = 20;

        if (data.type === 'character') {
            data.token.actorLink = true;
            data.token.vision = true;
        }

        this.data.update(data);
    }

    /** @override
     * Perform any last data modifications after super.prepareData has finished executing
     */
    prepareData() {
        // Performs the following, in order: data reset, prepareBaseData(), prepareEmbeddedEntities(), prepareDerivedData()
        super.prepareData();
        const actorData = this.data;

        // Automatic Encumbrance Management
        this._encumbranceAutoManagement(actorData);
    }

    /* -------------------------------------------- */
    /* Process Embedded                             */
    /* -------------------------------------------- */

    /** @override
     * Process the embedded entities data, mostly for lists
     */
    prepareEmbeddedDocuments() {
        super.prepareEmbeddedDocuments();
        const actorData = this.data;

        this._prepareExtraCareerData(actorData);
        this._prepareGiftData(actorData);
    }

    /**
     * Prepare Extra Career item data
     */
    _prepareExtraCareerData(actorData) {
        const data = actorData.data;

        // Extra Career additions
        const extraCareers = this.items.filter(element => element.data.type === 'extraCareer');
        if (extraCareers.length > 0) {
            data.hasExtraCareers = true;
            extraCareers.sort((a, b) => a.data.sort - b.data.sort);
            let ids = [];
            extraCareers.forEach(x => { if (x.data.data.valid) ids.push(x.id); });
            data.extraCareerIds = ids;
        }
        else
            data.hasExtraCareers = false;
    }

    /**
     * Prepare Gift item data
     */
    _prepareGiftData(actorData) {
        const data = actorData.data;

        const specialGifts = this.items.filter(element => element.data.type === 'gift' && element.data.data.specialSettings?.length > 0);
        if (specialGifts.length > 0) {
            data.processingLists = {}; // If any of the actor's gifts have special settings, add the holding object for the lists
            data.replacementLists = new Map(); // To store any replacement gifts, stored with the actor as derived data to avoid contaminating the actual gifts

            for (let gift of specialGifts) {
                for (let setting of gift.data.data.specialSettings) {
                    if (!(setting.settingMode in data.processingLists)) {
                        // If the relevant array for a setting mode does not exist, add an empty one
                        data.processingLists[setting.settingMode] = [];
                    }
                    // If the gift has the replacement field set, attempt to find what it replaces
                    if (setting.replaceName) {
                        const replacement = specialGifts.find(x => makeCompareReady(x.name) === setting.replaceName)?.data.data.specialSettings.find(x => x.settingMode == setting.settingMode);
                        if (replacement) { // If the replacement is found, add it to the map of replacements stored with the actor
                            if (replacement.giftId === setting.giftId) { // Check for an infinite loop
                                console.warn("Potential infinite loop detected, bonus attempted to replace something with the same id as it: " + setting.giftName);
                                continue;
                            }

                            let stored = (data.replacementLists.has(replacement.giftId) ? data.replacementLists.get(replacement.giftId) : new Map());
                            stored.set(replacement.settingIndex, setting);
                            data.replacementLists.set(replacement.giftId, stored);
                        }
                        continue;
                    }

                    // Add the setting into the list
                    data.processingLists[setting.settingMode].push(setting);
                }
            }
        }
    }

    /* -------------------------------------------- */
    /* Process Derived                              */
    /* -------------------------------------------- */

    /** @override
     * Augment the basic actor data with additional dynamic data.
     */
    prepareDerivedData() {
        const actorData = this.data;

        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        if (actorData.type === 'character') this._prepareCharacterData(actorData);
        if (actorData.type === 'mook') this._prepareMookData(actorData);
        if (actorData.type === 'beast') this._prepareBeastData(actorData);
    }

    /**
     * Prepare Character type specific data
     */
    _prepareCharacterData(actorData) {
        this._processTraits(actorData);
        this._processSkills(actorData);

        this._processCoinageData(actorData);
        this._processItemData(actorData);

        this._processBattleData(actorData);
    }

    /**
     * Prepare Mook type specific data
     */
    _prepareMookData(actorData) {
        this._processTraits(actorData);
        this._processSkills(actorData);

        this._processCoinageData(actorData);
        this._processItemData(actorData);

        this._processBattleData(actorData);
    }

    /**
     * Prepare Beast type specific data
     */
    _prepareBeastData(actorData) {
        this._processTraits(actorData);
        this._processSkillsMinor(actorData);

        this._processItemData(actorData);

        this._processBattleData(actorData);
    }

    /**
     * Process baseTraits template data
     */
    _processTraits(actorData) {
        const data = actorData.data;

        for (let [key, trait] of Object.entries(data.traits)) {
            trait.diceArray = findTotalDice(trait.dice);

            // Make the name used for a trait more human-readable
            trait.usedTitle = convertCamelCase(key);
        }

        data.traits.species.skills = [makeCompareReady(data.traits.species.speciesSkill1), makeCompareReady(data.traits.species.speciesSkill2), makeCompareReady(data.traits.species.speciesSkill3)];
        data.traits.career.skills = [makeCompareReady(data.traits.career.careerSkill1), makeCompareReady(data.traits.career.careerSkill2), makeCompareReady(data.traits.career.careerSkill3)];

        if (!data.skills) {
            data.traits.species.skillNames = [data.traits.species.speciesSkill1, data.traits.species.speciesSkill2, data.traits.species.speciesSkill3];
            data.traits.career.skillNames = [data.traits.career.careerSkill1, data.traits.career.careerSkill2, data.traits.career.careerSkill3];
        }
    }

    /**
     * Process baseSkills template data
     */
    _processSkills(actorData) {
        const data = actorData.data;

        let extracareers = [];
        if (data.hasExtraCareers) {
            data.extraCareerIds.forEach(x => extracareers.push(this.items.get(x)));
        }

        for (let [key, skill] of Object.entries(data.skills)) {
            skill.diceArray = [0, 0, 0, 0, 0];
            skill.diceString = "";
            skill.totalDiceString = "";

            // Marks
            if (skill.marks > 0) {
                let d12s = Math.floor(skill.marks / 5); // Get the number of d12's for the skill
                let remainder = skill.marks % 5; // Get whatever the mark count is minus full 5's (d12's)
                skill.diceArray[0] += d12s; // Add the d12's
                if (remainder > 0) {
                    skill.diceArray[5 - remainder] += 1; // Based on what the marks are minus full 5's, add a smaller die
                }
                skill.diceString = reformDiceString(skill.diceArray, true); // For showing in the sheet how many dice the marks give
            }

            // Species and Career dice
            const comparekey = makeCompareReady(key);
            for (let foo of data.traits.species.skills) {
                if (foo == comparekey)
                    skill.diceArray = addArrays(skill.diceArray, data.traits.species.diceArray);
            }
            for (let foo of data.traits.career.skills) {
                if (foo == comparekey)
                    skill.diceArray = addArrays(skill.diceArray, data.traits.career.diceArray);
            }
            if (data.hasExtraCareers) {
                extracareers.forEach(element => {
                    for (let foo of element.data.data.skills) {
                        if (foo == comparekey)
                            skill.diceArray = addArrays(skill.diceArray, element.data.data.diceArray);
                    }
                });
            }

            skill.totalDiceString = reformDiceString(skill.diceArray, true); // For showing in the sheet how many dice the skill has in total

            // Make the name used for a skill more human-readable, and add a symbol if the skill can suffer under Burdened condition
            skill.usedTitle = convertCamelCase(key);
            if (burdenedLimitedStat(key)) {
                skill.usedTitle = String.fromCodePoint([9949]) + " " + skill.usedTitle + " " + String.fromCodePoint([9949]);
            }
        }
    }

    /**
     * Process skills data for actor types that lack baseSkills data
     */
    _processSkillsMinor(actorData) {
        const data = actorData.data;

        // Check whether the species and career traits either have no dice in them or have their first skill field be empty
        if ((!checkDiceArrayEmpty(data.traits.species.diceArray) || !data.traits.species.speciesSkill1) && (!checkDiceArrayEmpty(data.traits.career.diceArray) || !data.traits.career.careerSkill1)) {
            return; // If the check passes, abort processing
        }
        if (data.skills) {
            // If an actor with preset skills somehow ends up in this function, return out immediately.
            return console.warn("An actor that has skills by default ended up in the function for actors without skills: " + actorData.name);
        }

        // Add the missing skill field
        data.skills = {};

        let extracareers = [];
        if (data.hasExtraCareers) {
            data.extraCareerIds.forEach(x => extracareers.push(this.items.get(x)));
        }

        // Process trait skills
        if (data.traits.species?.skillNames && checkDiceArrayEmpty(data.traits.species.diceArray)) { // Make sure there's actually something in the trait
            for (let skill of data.traits.species.skillNames) { // Go through the skills
                if (!skill) // If the skill is empty, skip it
                    continue;
                const foo = makeCompareReady(skill); // Prepare the skill name
                data.skills[foo] = data.skills[foo] ?? {}; // If the data object does not exist, make it
                data.skills[foo].diceArray = addArrays(data.skills[foo].diceArray, data.traits.species.diceArray); // Add the trait dice array to the one present
                data.skills[foo].totalDiceString = data.skills[foo].diceString = reformDiceString(data.skills[foo].diceArray, true); // Record the reformed dice string for UI presentation
                data.skills[foo].usedTitle = skill; // Record the name used
                if (burdenedLimitedStat(foo)) { // If the name is limited, add the special icon
                    data.skills[foo].usedTitle = String.fromCodePoint([9949]) + " " + data.skills[foo].usedTitle + " " + String.fromCodePoint([9949]);
                }
            }
        }
        if (data.traits.career?.skillNames && checkDiceArrayEmpty(data.traits.career.diceArray)) {
            for (let skill of data.traits.career.skillNames) {
                if (!skill)
                    continue;
                const foo = makeCompareReady(skill);
                data.skills[foo] = data.skills[foo] ?? {};
                data.skills[foo].diceArray = addArrays(data.skills[foo].diceArray, data.traits.career.diceArray);
                data.skills[foo].totalDiceString = data.skills[foo].diceString = reformDiceString(data.skills[foo].diceArray, true);
                data.skills[foo].usedTitle = skill;
                if (burdenedLimitedStat(foo)) {
                    data.skills[foo].usedTitle = String.fromCodePoint([9949]) + " " + data.skills[foo].usedTitle + " " + String.fromCodePoint([9949]);
                }
            }
        }

        // Process extra careers
        if (data.hasExtraCareers) {
            for (let extra of extracareers) {
                if (!checkDiceArrayEmpty(extra.data.data.diceArray))
                    continue;
                for (let skill of extra.data.data.skillNames) {
                    if (!skill)
                        continue;
                    const foo = makeCompareReady(skill);
                    data.skills[foo] = data.skills[foo] ?? {};
                    data.skills[foo].diceArray = addArrays(data.skills[foo].diceArray, extra.data.data.diceArray);
                    data.skills[foo].totalDiceString = data.skills[foo].diceString = reformDiceString(data.skills[foo].diceArray, true);
                    data.skills[foo].usedTitle = skill;
                    if (burdenedLimitedStat(foo)) {
                        data.skills[foo].usedTitle = String.fromCodePoint([9949]) + " " + data.skills[foo].usedTitle + " " + String.fromCodePoint([9949]);
                    }
                }
            }
        }
    }

    /**
     * Process derived data for battle calculations
     */
    _processBattleData(actorData) {
        const data = actorData.data;

        // Base levels
        let stridebonus = 0;
        let dashbonus = 0;
        let runbonus = 0;
        const sprintarray = this.sprintRoll(-1);

        let speedint = getDiceArrayMaxValue(data.traits.speed.diceArray);
        let bodyint = getDiceArrayMaxValue(data.traits.body.diceArray);
        let sprintint = getDiceArrayMaxValue(sprintarray);

        if (speedint < 0 || bodyint < 0) {
            console.error("Battle data processing failed, unable to parse dice for " + actorData.name);
            ui.notifications.error(game.i18n.format("ironclaw2e.ui.battleProcessingFailure", { "name": actorData.name }));
            data.stride = 0;
            data.dash = 0;
            data.run = 0;
            return;
        }

        // Apply burdenend limit
        if (speedint > 8 && hasConditionsIronclaw("burdened", this)) speedint = 8;

        // Apply normal move bonuses
        if (data.processingLists?.moveBonus) { // Check if move bonuses even exist
            for (let setting of data.processingLists.moveBonus) { // Loop through them
                if (checkApplicability(setting, null, this)) { // Check initial applicability
                    let used = setting; // Store the setting in a temp variable
                    let replacement = this._checkForReplacement(used); // Store the potential replacement if any in a temp variable
                    while (replacement && checkApplicability(replacement, null, this)) { // As long as the currently used one could be replaced by something applicable
                        used = replacement; // Store the replacement as the one to be used
                        replacement = this._checkForReplacement(used); // Check for a new replacement
                    }
                    if (used) { // Sanity check that the used still exists
                        // Apply the used setting
                        stridebonus += used.bonusStrideNumber;
                        dashbonus += used.bonusDashNumber;
                        runbonus += used.bonusRunNumber;
                    } else { // If used somehow turns out unsuable, send an error
                        console.error("Somehow, the used setting came up unusable: " + used);
                    }
                }
            }
        }

        // Flying-related bonuses
        if (hasConditionsIronclaw("flying", this)) {
            data.isFlying = true;

            // Apply the flying move bonuses
            if (data.processingLists?.flyingBonus) {
                for (let setting of data.processingLists.flyingBonus) { // Loop through them
                    if (checkApplicability(setting, null, this)) { // Check initial applicability
                        let used = setting; // Store the setting in a temp variable
                        let replacement = this._checkForReplacement(used); // Store the potential replacement if any in a temp variable
                        while (replacement && checkApplicability(replacement, null, this)) { // As long as the currently used one could be replaced by something applicable
                            used = replacement; // Store the replacement as the one to be used
                            replacement = this._checkForReplacement(used); // Check for a new replacement
                        }
                        if (used) { // Sanity check that the used still exists
                            // Apply the used setting
                            stridebonus += used.bonusStrideNumber;
                            dashbonus += used.bonusDashNumber;
                            runbonus += used.bonusRunNumber;
                        } else { // If used somehow turns out unsuable, send an error
                            console.error("Somehow, the used setting came up unusable: " + used);
                        }
                    }
                }
            }
        } else {
            data.isFlying = false;
        }

        // Stride setup
        data.stride = 1 + stridebonus;
        if (hasConditionsIronclaw(["slowed", "immobilized", "half-buried", "cannotmove"], this)) {
            data.stride = 0;
        }
        // Dash setup
        data.dash = Math.round(speedint / 2) + (bodyint > speedint ? 1 : 0) + dashbonus;
        if (hasConditionsIronclaw(["burdened", "blinded", "slowed", "immobilized", "half-buried", "cannotmove"], this)) {
            data.dash = 0;
        }

        // Run setup
        data.run = bodyint + (data.isFlying ? sprintint : speedint) + data.dash + runbonus;
        if (hasConditionsIronclaw(["over-burdened", "immobilized", "half-buried", "cannotmove"], this)) {
            data.run = 0;
        }


        // Sprint visual for the sheet
        data.sprintString = reformDiceString(sprintarray, true);
        // Initiative visual for the sheet
        data.initiativeString = reformDiceString(this.initiativeRoll(-1), true);
    }

    /**
     * Process derived data for money related stuff
     */
    _processCoinageData(actorData) {
        const data = actorData.data;

        let allvalue = 0;
        let allweight = 0;
        for (let [key, currency] of Object.entries(data.coinage)) {
            if (currency.value.length == 0 || (isNaN(currency.value) && isNaN(currency.value.slice(1)))) {
                console.error("Unable to parse the currency value of: " + key);
                continue;
            }

            currency.totalValue = (currency.value.includes(";") ? currency.amount / parseInt(currency.value.slice(1)) : currency.amount * parseInt(currency.value));
            currency.totalWeight = (currency.weight * currency.amount) / 6350;
            currency.parsedSign = Number.isInteger(currency.sign) ? String.fromCodePoint([currency.sign]) : "";

            allvalue += currency.totalValue;
            allweight += currency.totalWeight;
        }
        data.coinageValue = Math.floor(allvalue).toString() + String.fromCodePoint([data.coinage.denar.sign]);
        data.coinageWeight = allweight;
    }

    /**
     * Process derived data from items 
     */
    _processItemData(actorData) {
        const data = actorData.data;
        const gear = this.items;

        let totalweight = 0;
        let totalarmors = 0;
        let giftbonus = 0;
        for (let item of gear) {

            if (item.data.data.totalWeight && !isNaN(item.data.data.totalWeight)) {
                totalweight += item.data.data.totalWeight; // Check that the value exists and is not a NaN, then add it to totaled weight
            }

            if (item.data.type === 'armor' && item.data.data.worn === true) {
                totalarmors++;
            }
        }

        // Apply encumbrance bonuses
        if (data.processingLists?.encumbranceBonus) { // Check if move bonuses even exist
            for (let setting of data.processingLists.encumbranceBonus) { // Loop through them
                if (checkApplicability(setting, null, this)) { // Check initial applicability
                    let used = setting; // Store the setting in a temp variable
                    let replacement = this._checkForReplacement(used); // Store the potential replacement if any in a temp variable
                    while (replacement && checkApplicability(replacement, null, this)) { // As long as the currently used one could be replaced by something applicable
                        used = replacement; // Store the replacement as the one to be used
                        replacement = this._checkForReplacement(used); // Check for a new replacement
                    }
                    if (used) { // Sanity check that the used still exists
                        // Apply the used setting
                        giftbonus += used.encumbranceBonusNumber;
                    } else { // If used somehow turns out unsuable, send an error
                        console.error("Somehow, the used setting came up unusable: " + used);
                    }
                }
            }
        }

        const bodyarr = parseSingleDiceString(data.traits.body.dice);
        if (!Array.isArray(bodyarr)) {
            console.error("Unable to parse body die for " + actorData.name);
            return;
        }

        data.encumbranceNone = Math.round(((bodyarr[1] / 2) - 1) * bodyarr[0] + giftbonus);
        data.encumbranceBurdened = Math.round((bodyarr[1] - 1) * bodyarr[0] + giftbonus * 2);
        data.encumbranceOverBurdened = Math.round(((bodyarr[1] / 2) * 3 - 1) * bodyarr[0] + giftbonus * 3);

        const coinshaveweight = game.settings.get("ironclaw2e", "coinsHaveWeight");
        if (coinshaveweight === true && data.coinageWeight) {
            totalweight += data.coinageWeight;
        }
        data.totalWeight = totalweight;
        data.totalArmors = totalarmors;
    }

    /** 
     *  Automatic encumbrance management, performed if the setting is enabled
     */
    _encumbranceAutoManagement(actorData) {
        const manageburdened = game.settings.get("ironclaw2e", "manageEncumbranceAuto");
        const data = actorData.data;

        if (manageburdened) {
            if (data.totalWeight > data.encumbranceOverBurdened || data.totalArmors > 3) {
                this.addEffect(["burdened", "over-burdened", "cannotmove"]);
            }
            else if (data.totalWeight > data.encumbranceBurdened || data.totalArmors == 3) {
                this.deleteEffect(["cannotmove"], false);
                this.addEffect(["burdened", "over-burdened"]);
            }
            else if (data.totalWeight > data.encumbranceNone || data.totalArmors == 2) {
                this.deleteEffect(["over-burdened", "cannotmove"], false);
                this.addEffect(["burdened"]);
            }
            else {
                this.deleteEffect(["burdened", "over-burdened", "cannotmove"], false);
            }
        }
    }

    /* -------------------------------------------- */
    /* Private Internal Functions                   */
    /* -------------------------------------------- */

    /**
     * Update tokens associated with this actor with lighting data
     * @param {any} lightdata Data to use for update
     * @private
     */
    async _updateTokenLighting(lightdata) {
        let foundtoken = findActorToken(this);
        if (foundtoken) {
            await foundtoken.update(lightdata);
        }

        // Update prototype token, if applicable
        if (!this.isToken) {
            await this.update({
                "token": lightdata
            });
        }
    }

    /**
     * Get the total dice pools of the actor for the given traits and skills
     * @param {string[]} traitnames The array of trait names
     * @param {string[]} skillnames The array of skill names, just give the same array as traitnames to use with mixed name arrays
     * @param {boolean} isburdened Whether to apply the burdened limit to relevant skills
     * @param {boolean} addplus Whether to add the plus already on the first pool label
     * @private
     */
    _getDicePools(traitnames, skillnames, isburdened, addplus = false) {
        const data = this.data.data;
        let label = "";
        let labelgiven = addplus;
        let totaldice = [0, 0, 0, 0, 0];

        if (data.traits && Array.isArray(traitnames) && traitnames.length > 0) { // If the actor has traits and the list of traits to use is given
            for (let [key, trait] of Object.entries(data.traits)) { // Loop through the traits
                if (traitnames.includes(makeCompareReady(key)) || (trait.name && traitnames.includes(makeCompareReady(trait.name)))) { // If the traitnames include either the key or the name of the trait (career / species name)
                    totaldice = addArrays(totaldice, (isburdened && burdenedLimitedStat(key) ? enforceLimit(trait.diceArray, 2) : trait.diceArray)); // Add the trait to the total dice pool, limited by burdened if applicable
                    if (labelgiven) // Check if the label has been given to add something in between names
                        label += " + ";
                    label += (data.hasExtraCareers && key === "career" ? trait.name : convertCamelCase(key)); // Add the name to the label, either a de-camelcased trait name or the career name if extra careers are a thing
                    labelgiven = true; // Mark the label as given
                }
            }
            if (data.hasExtraCareers) { // Check if extra careers are a thing
                let extracareers = [];
                data.extraCareerIds.forEach(x => extracareers.push(this.items.get(x))); // Grab each extra career from the ids
                for (let [index, extra] of extracareers.entries()) { // Loop through the careers
                    let key = makeCompareReady(extra.data.data.careerName); // Make a comparable key out of the career name
                    if (traitnames.includes(key)) {
                        // Even if extra careers can't be part of the standard burdened lists, check it just in case of a custom burdened list, though usually the extra career die is just added to the total dice pool
                        totaldice = addArrays(totaldice, (isburdened && burdenedLimitedStat(key) ? enforceLimit(extra.data.data.diceArray, 2) : extra.data.data.diceArray));
                        if (labelgiven)
                            label += " + ";
                        label += extra.data.data.careerName; // Add the career name as a label
                        labelgiven = true;
                    }
                }
            }
        }
        if (data.skills && Array.isArray(skillnames) && skillnames.length > 0) { // If the actor has skills and the lists of skills to use is given
            for (let [key, skill] of Object.entries(data.skills)) { // Loop through the skills
                if (skillnames.includes(makeCompareReady(key))) {
                    totaldice = addArrays(totaldice, (isburdened && burdenedLimitedStat(key) ? enforceLimit(skill.diceArray, 2) : skill.diceArray)); // Add the skill to the total dice pool, limited by burdened if applicable
                    if (labelgiven)
                        label += " + ";
                    label += convertCamelCase(key); // Add the skill name as a label after being de-camelcased
                    labelgiven = true;
                }
            }
        }

        return { "totalDice": totaldice, "label": label, "labelGiven": labelgiven };
    }

    /**
     * Get the total added dice pool from the checked traits, skills, extra dice and bonus dice
     * @param {string[]} prechecked Traits and skills to add the dice from
     * @param {boolean} isburdened Whether to apply the burdened limit to relevant skills
     * @param {string} extradice Extra dice to add
     * @param {[string]} otherkeys An array of keys, if empty the function will not add labels for the bonus dice
     * @param {[number[]]} otherdice An array of dice arrays, the items should match exactly with their counterparts at otherkeys
     */
    _getAllDicePools(prechecked, isburdened, otherkeys = [], otherdice = [], extradice = "") {
        let label = "";
        let labelgiven = false;
        let totaldice = [0, 0, 0, 0, 0];

        // Get the trait and skill pools
        const dicePools = this._getDicePools(prechecked, prechecked, isburdened);
        label = dicePools.label;
        labelgiven = dicePools.labelGiven;
        totaldice = dicePools.totalDice;

        // Get the bonus dice pools
        if (otherdice?.length > 0) {
            for (let i = 0; i < otherdice.length; ++i) {
                totaldice = addArrays(totaldice, otherdice[i]);
                if (otherkeys?.length > i) { // Only try to add a label if the array has a key to use as a label
                    if (labelgiven)
                        label += " + ";
                    label += otherkeys[i];
                }
                labelgiven = true;
            }
        }

        // Get the extra dice
        if (extradice?.length > 0) {
            const extra = findTotalDice(extradice);
            if (checkDiceArrayEmpty(extra)) {
                if (labelgiven)
                    label += " + ";
                label += game.i18n.localize("ironclaw2e.chat.extraDice");
                totaldice = addArrays(totaldice, extra);
            }
        }

        return { "totalDice": totaldice, "label": label, "labelGiven": labelgiven };
    }

    /**
     * Check for a replacement gift for the given setting
     * @param {any} setting
     * @returns {any} The replacement setting if it exists
     */
    _checkForReplacement(setting) {
        const data = this.data.data;
        if (!data.processingLists || !data.replacementLists) {
            console.warn("Attempted to check for replacements despite the fact that no special settings are present for the actor: " + this.name);
            return null;
        }

        if (data.replacementLists.has(setting.giftId)) { // Check for and get the list of replacements for a given gift
            const foo = data.replacementLists.get(setting.giftId);
            if (foo.has(setting.settingIndex)) { // Check for and get the actual replacement based on the index of the setting
                const bar = foo.get(setting.settingIndex)
                if (setting.settingMode == bar.settingMode) {
                    return bar; // If a to-be-replaced setting with the correct gift id, setting index and setting mode is found, return the corresponding setting
                }
            }
        }

        return null; // Otherwise return null
    }

    // Functions to construct the roll dialog properly

    /**
     * Apply a certain type of gift special bonus to roll dialog construction
     * @param {any} specialname
     * @param {any} prechecked
     * @param {any} otherinputs
     * @param {any} otherkeys
     * @param {any} otherdice
     * @param {any} item
     * @param {boolean} defensecheck Whether the check is done from a defense 
     * @param {string} defensetype
     * @returns {object} Returns a holder object which returns the inputs with the added bonuses
     * @private
     */
    _getGiftSpecialConstruction(specialname, prechecked, otherkeys, otherdice, otherinputs, item, defensecheck = false, defensetype = "") {
        const data = this.data.data;
        if (data.processingLists?.[specialname]) { // Check if they even exist
            for (let setting of data.processingLists[specialname]) { // Loop through them
                if (checkApplicability(setting, item, this, defensecheck, defensetype)) { // Check initial applicability
                    let used = setting; // Store the setting in a temp variable
                    let replacement = this._checkForReplacement(used); // Store the potential replacement if any in a temp variable
                    while (replacement && checkApplicability(replacement, item, this, defensecheck, defensetype)) { // As long as the currently used one could be replaced by something applicable
                        used = replacement; // Store the replacement as the one to be used
                        replacement = this._checkForReplacement(used); // Check for a new replacement
                    }
                    if (used) { // Sanity check that the used still exists
                        // Apply the used setting
                        // Apply bonus sources to the roll dialog contruction
                        if (used.bonusSources) {
                            for (let source of used.bonusSources) {
                                let foobar = null;
                                switch (source) {
                                    case ("armor"):
                                        foobar = this._getArmorConstruction(otherkeys, otherdice, otherinputs);
                                        break;
                                    case ("shield"):
                                        foobar = this._getShieldConstruction(otherkeys, otherdice, otherinputs);
                                        break;
                                    case ("guard"):
                                        foobar = this._getStatusBonusConstruction(otherkeys, otherdice, otherinputs, "guard", false);
                                        break;
                                    case ("guard-always"):
                                        foobar = this._getStatusBonusConstruction(otherkeys, otherdice, otherinputs, "guard", true);
                                        break;
                                    case ("aim"):
                                        foobar = this._getStatusBonusConstruction(otherkeys, otherdice, otherinputs, "aim", false);
                                        break;
                                    case ("aim-always"):
                                        foobar = this._getStatusBonusConstruction(otherkeys, otherdice, otherinputs, "aim", true);
                                        break;
                                }
                                if (foobar) {
                                    otherinputs = foobar.otherinputs;
                                    otherkeys = foobar.otherkeys;
                                    otherdice = foobar.otherdice;
                                }
                            }
                        }
                        // Apply the bonus stats to the prechecked stats
                        if (used.bonusStats) {
                            for (let stat of used.bonusStats) {
                                if (!prechecked.includes(stat)) {
                                    prechecked.push(stat);
                                }
                            }
                        }
                        // Apply the bonus dice to the roll dialog construction
                        if (used.bonusDice) {
                            otherkeys.push(used.giftName);
                            otherdice.push(used.bonusDice);
                            otherinputs += `<div class="form-group flexrow">
                                <label class="normal-label">${used.giftName}: ${reformDiceString(used.bonusDice, true)}</label>
	                            <input type="checkbox" id="${makeCompareReady(used.giftName)}" name="${makeCompareReady(used.giftName)}" checked></input>
                                </div>`+ "\n";
                        }
                    } else { // If used somehow turns out unsuable, send an error
                        console.error("Somehow, the used setting came up unusable: " + used);
                    }
                }
            }
        }

        return { "prechecked": prechecked, "otherinputs": otherinputs, "otherkeys": otherkeys, "otherdice": otherdice };
    }

    /**
     * Apply armors to roll dialog construction
     * @param {any} otherinputs
     * @param {any} otherkeys
     * @param {any} otherdice
     * @param {boolean} autocheck
     * @returns {object} Returns a holder object which returns the inputs with the added bonuses
     * @private
     */
    _getArmorConstruction(otherkeys, otherdice, otherinputs, autocheck = true) {
        const data = this.data.data;
        let armors = this.items.filter(element => element.data.data.worn === true);
        for (let i = 0; i < armors.length && i < 3; ++i) {
            otherkeys.push(armors[i].data.name);
            otherdice.push(armors[i].data.data.armorArray);
            otherinputs += `<div class="form-group flexrow">
                <label class="normal-label">${armors[i].data.name}: ${reformDiceString(armors[i].data.data.armorArray, true)}</label>
	            <input type="checkbox" id="${makeCompareReady(armors[i].data.name)}" name="${makeCompareReady(armors[i].data.name)}" ${(autocheck ? "checked" : "")}></input >
                </div>`+ "\n";
        }
        return { "otherinputs": otherinputs, "otherkeys": otherkeys, "otherdice": otherdice };
    }

    /**
     * Apply shield to roll dialog construction
     * @param {any} otherinputs
     * @param {any} otherkeys
     * @param {any} otherdice
     * @param {boolean} autocheck
     * @returns {object} Returns a holder object which returns the inputs with the added bonuses
     * @private
     */
    _getShieldConstruction(otherkeys, otherdice, otherinputs, autocheck = true) {
        const data = this.data.data;
        let shield = this.items.find(element => element.data.data.held === true);
        if (shield) {
            otherkeys.push(shield.data.name);
            otherdice.push(shield.data.data.coverArray);
            otherinputs += `<div class="form-group flexrow">
                <label class="normal-label">${shield.data.name}: ${reformDiceString(shield.data.data.coverArray, true)}</label>
	            <input type="checkbox" id="${makeCompareReady(shield.data.name)}" name="${makeCompareReady(shield.data.name)}" ${(autocheck ? "checked" : "")}></input>
                </div>`+ "\n";
        }
        return { "otherinputs": otherinputs, "otherkeys": otherkeys, "otherdice": otherdice };
    }

    /**
     * Apply guarding bonus to roll dialog construction
     * @param {any} otherinputs
     * @param {any} otherkeys
     * @param {any} otherdice
     * @param {object} bonustype Whether the bonus is of "aim" or "guard" type
     * @param {boolean} skipcheck Whether to skip the "Guarding" condition check
     * @returns {object} Returns a holder object which returns the inputs with the added bonuses
     * @private
     */
    _getStatusBonusConstruction(otherkeys, otherdice, otherinputs, bonustype, skipcheck = false) {
        const data = this.data.data;
        let replaceSettings = []; // Bonuses that would replace the base bonus
        let addSettings = []; // Bonuses that would add to the base bonus

        let bonusName = "", bonusList = "";
        switch (bonustype) { // Depending on the given type, look for the corresponding bonus type
            case "aim":
                bonusName = "aiming";
                bonusList = "aimBonus";
                break;
            case "guard":
                bonusName = "guarding";
                bonusList = "guardBonus";
                break;
            default:
                console.error("Status bonus construction somehow defaulted on bonus type lookup: " + bonustype);
                return { "otherinputs": otherinputs, "otherkeys": otherkeys, "otherdice": otherdice };
                break;
        }

        if (skipcheck || hasConditionsIronclaw(bonusName, this)) { // If the check is skipped or the actor has a "Guarding" condition
            if (data.processingLists?.[bonusList]) { // Check if move bonuses even exist
                for (let setting of data.processingLists[bonusList]) { // Loop through them
                    if (checkApplicability(setting, null, this)) { // Check initial applicability
                        let used = setting; // Store the setting in a temp variable
                        let replacement = this._checkForReplacement(used); // Store the potential replacement if any in a temp variable
                        while (replacement && checkApplicability(replacement, null, this)) { // As long as the currently used one could be replaced by something applicable
                            used = replacement; // Store the replacement as the one to be used
                            replacement = this._checkForReplacement(used); // Check for a new replacement
                        }
                        if (used) { // Sanity check that the used still exists
                            // Store the used setting to a temp array
                            if (used.replacesBaseBonus) {
                                replaceSettings.push(used);
                            } else {
                                addSettings.push(used);
                            }
                        } else { // If used somehow turns out unsuable, send an error
                            console.error("Somehow, the used setting came up unusable: " + used);
                        }
                    }
                }
            }
        } else { // If the actor does not have the proper status condition, just return the variables like they were
            return { "otherinputs": otherinputs, "otherkeys": otherkeys, "otherdice": otherdice };
        }

        let bonusArray = [0, 0, 1, 0, 0];
        let bonusLabel = game.i18n.localize("ironclaw2e.dialog.dicePool." + bonusName);
        // Go through the potential status bonus replacements
        if (Array.isArray(replaceSettings)) {
            for (let setting of replaceSettings) {
                if (setting.bonusDice) { // If the setting has bonus dice
                    if (compareDiceArrays(setting.bonusDice, bonusArray) < 0) { // Check if the bonus dice are bigger than the normal bonus
                        bonusArray = setting.bonusDice; // Set the bonus to be the setting bonus
                        bonusLabel = setting.giftName + " " + game.i18n.localize("ironclaw2e.dialog.dicePool." + bonusName); // Name the label after the bonus
                    }
                }
            }
        }
        // Go through the potential status bonus additions
        if (Array.isArray(addSettings)) {
            for (let setting of addSettings) {
                if (setting.bonusDice) { // If the bonus dice exist
                    bonusArray = addArrays(bonusArray, setting.bonusDice); // Add them
                }
            }
        }

        otherkeys.push(bonusLabel);
        otherdice.push(bonusArray);
        otherinputs += `<div class="form-group flexrow">
                 <label class="normal-label">${bonusLabel}: ${reformDiceString(bonusArray, true)}</label>
	             <input type="checkbox" id="${makeCompareReady(bonusLabel)}" name="${makeCompareReady(bonusLabel)}" checked></input>
                </div>`+ "\n";

        return { "otherinputs": otherinputs, "otherkeys": otherkeys, "otherdice": otherdice };
    }

    /* -------------------------------------------- */
    /*  Actor Change Functions                      */
    /* -------------------------------------------- */

    /**
     * Change which illumination item the actor is using, or turn them all off
     * @param {Ironclaw2EItem} lightsource
     */
    changeLightSource(lightsource) {
        if (!lightsource) {
            console.error("Attempted to change a light source without providing light source for actor: " + this);
            return;
        }
        let updatedlightdata = {
            "light": {
                "dim": 0, "bright": 0, "angle": 360, "color": "#ffffff", "alpha": 0.25, "animation": {
                    "type": "", "speed": 5, "intensity": 5
                }
            }
        };

        let lightsources = this.items.filter(element => element.data.type == "illumination");

        if (!lightsource.data.data.lighted) { // Light the light source
            updatedlightdata = {
                "light": {
                    "dim": lightsource.data.data.dimLight, "bright": lightsource.data.data.brightLight, "angle": lightsource.data.data.lightAngle,
                    "color": lightsource.data.data.lightColor, "alpha": lightsource.data.data.lightAlpha, "animation": {
                        "type": lightsource.data.data.lightAnimationType, "speed": lightsource.data.data.lightAnimationSpeed, "intensity": lightsource.data.data.lightAnimationIntensity
                    }
                }
            };
            const index = lightsources.findIndex(element => element.id == lightsource.id);
            if (index > -1)
                lightsources.splice(index, 1); // Exclude from dousing
            lightsource.update({ "_id": lightsource.id, "data.lighted": true });
        }

        let doused = [];
        for (let l of lightsources) { // Douse all other light sources, including the caller if it was previously lighted
            doused.push({ "_id": l.id, "data.lighted": false });
        }
        this.updateEmbeddedDocuments("Item", doused);
        this._updateTokenLighting(updatedlightdata);
    }

    /**
     * Refresh the token light source based on which illumination item is active, if any
     */
    refreshLightSource() {
        let updatedlightdata = {
            "light": {
                "dim": 0, "bright": 0, "angle": 360, "color": "#ffffff", "alpha": 0.25, "animation": {
                    "type": "", "speed": 5, "intensity": 5
                }
            }
        };

        let lightsources = this.items.filter(element => element.data.type == "illumination");
        let activesource = lightsources.find(element => element.data.data.lighted == true);
        if (activesource) {
            updatedlightdata = {
                "light": {
                    "dim": lightsource.data.data.dimLight, "bright": lightsource.data.data.brightLight, "angle": lightsource.data.data.lightAngle,
                    "color": lightsource.data.data.lightColor, "alpha": lightsource.data.data.lightAlpha, "animation": {
                        "type": lightsource.data.data.lightAnimationType, "speed": lightsource.data.data.lightAnimationSpeed, "intensity": lightsource.data.data.lightAnimationIntensity
                    }
                }
            };
        }

        this._updateTokenLighting(updatedlightdata);
    }

    /**
     * Apply damage conditions to the actor
     * @param {number} damage
     * @param {boolean} knockout
     * @param {boolean} nonlethal
     */
    async applyDamage(damage, knockout = false, nonlethal = false) {
        let adding = ["reeling"];
        if (damage >= 1) {
            adding.push("hurt");
            if (knockout) adding.push("asleep");
        }
        if (damage >= 2) {
            adding.push("afraid");
            if (knockout) adding.push("unconscious");
        }
        if (damage >= 3) adding.push("injured");
        if (damage >= 4) adding.push("dying");
        if (damage >= 5 && !nonlethal) adding.push("dead");
        if (damage >= 6 && !nonlethal) adding.push("overkilled");
        await this.addEffect(adding);
        return adding;
    }

    /**
     * Add a given condition to the actor
     * @param {string | [string]} condition 
     */
    async addEffect(condition) {
        await addConditionsIronclaw(condition, this);
    }

    /**
     * Remove given conditions from the actor, either by name or id
     * @param {string | [string]} condition
     * @param {boolean} isid
     */
    async deleteEffect(condition, isid = false) {
        condition = Array.isArray(condition) ? condition : [condition];
        if (isid) {
            await this.deleteEmbeddedDocuments("ActiveEffect", condition);
        }
        else {
            await removeConditionsIronclaw(condition, this);
        }
    }

    /**
     * Remove all conditions from the actor
     */
    async resetEffects() {
        const reset = [];
        for (let effect of this.effects) {
            reset.push(effect.id);
        }
        await this.deleteEffect(reset, true);
    }

    /** Start of turn maintenance for the actor
     */
    startOfRound() {
        // Condition auto-removal system, performed only if the system is active and the no-turn-maintenance mode is not
        const conditionRemoval = game.settings.get("ironclaw2e", "autoConditionRemoval") && !game.settings.get("ironclaw2e", "autoConditionRemovalNoTurns");
        if (conditionRemoval) {
            this.deleteEffect("guarding");
        }
    }

    /** End of turn maintenance for the actor
     */
    endOfRound() {
        // Condition auto-removal system, performed only if the system is active and the no-turn-maintenance mode is not
        const conditionRemoval = game.settings.get("ironclaw2e", "autoConditionRemoval") && !game.settings.get("ironclaw2e", "autoConditionRemovalNoTurns");
        if (conditionRemoval) {
            this.deleteEffect("aiming");
        }
    }

    /* -------------------------------------------- */
    /*  Non-popup Roll Functions                    */
    /* -------------------------------------------- */

    /**
     * Function to call initiative for an actor
     * @param {number} returntype The type of return to use: -1 to simply return the total initiative dice array, 0 for nothing as it launches a popup, 1 for a traditional initiative roll, 2 for the initiative check on combat start for side-based initiative
     * @param {number} tntouse The target number to use in case the mode uses target numbers
     * @param {boolean} directroll Whether to skip the popup dialog
     * @returns {any} Exact return type depends on the returntype parameter, null if no normal return path
     */
    initiativeRoll(returntype, tntouse = 2, directroll = false) {
        const data = this.data.data;
        let formconstruction = ``;
        let constructionkeys = [];
        let constructionarray = [];
        let prechecked = ["speed", "mind"];
        const burdened = hasConditionsIronclaw("burdened", this);

        if (returntype === 0) {// Special case to roll initiative in an encounter through the sheet
            const activeCombatant = game.combat?.getCombatantByActor(this.id);
            if (activeCombatant?.isOwner && !activeCombatant?.initiative) { // If the actor is an active combatant in an encounter and has _not_ yet rolled initiative, roll initiative for it
                return this.rollInitiative();
            }
        }

        const bonuses = this._getGiftSpecialConstruction("initiativeBonus", prechecked, constructionkeys, constructionarray, formconstruction, null);
        prechecked = bonuses.prechecked;
        formconstruction = bonuses.otherinputs;
        constructionkeys = bonuses.otherkeys;
        constructionarray = bonuses.otherdice;

        let foo, bar;
        switch (returntype) { // Yes, yes, the breaks are unnecessary
            case -1:
                foo = this._getAllDicePools(prechecked, burdened, constructionkeys, constructionarray);
                bar = foo.totalDice;
                return bar;
                break;
            case 0:
                this.basicRollSelector({
                    "prechecked": prechecked, "tnyes": true, "tnnum": tntouse, "otherkeys": constructionkeys, "otherdice": constructionarray, "otherinputs": formconstruction,
                    "otherlabel": game.i18n.localize("ironclaw2e.chat.rollingInitiative")
                }, { directroll });
                return null;
                break;
            case 1:
                foo = this._getAllDicePools(prechecked, burdened, constructionkeys, constructionarray);
                bar = foo.totalDice;
                return rollHighestArray(bar, game.i18n.localize("ironclaw2e.chat.rollingInitiative") + ": " + foo.label, this, false);
                break;
            case 2:
                foo = this._getAllDicePools(prechecked, burdened, constructionkeys, constructionarray);
                bar = foo.totalDice;
                return rollTargetNumberArray(tntouse, bar, game.i18n.localize("ironclaw2e.chat.rollingInitiativeCheck") + ": " + foo.label, this, false);
                break;
        }

        console.error("Initiative roll return type defaulted for actor: " + this.data.name);
        return null;
    }

    /**
     * Function to call Sprint on an actor
     * @param {number} returntype The type of return to use: -1 to simply return the total Sprint dice array, 0 for nothing as it launches a popup
     * @param {boolean} directroll Whether to skip the popup dialog
     * @returns {any} Exact return type depends on the returntype parameter, null if no normal return path
     */
    sprintRoll(returntype, directroll = false) {
        const data = this.data.data;
        let formconstruction = ``;
        let constructionkeys = [];
        let constructionarray = [];
        let prechecked = ["speed"];
        const burdened = hasConditionsIronclaw("burdened", this);

        const bonuses = this._getGiftSpecialConstruction("sprintBonus", prechecked, constructionkeys, constructionarray, formconstruction, null);
        prechecked = bonuses.prechecked;
        formconstruction = bonuses.otherinputs;
        constructionkeys = bonuses.otherkeys;
        constructionarray = bonuses.otherdice;

        let foo, bar;
        switch (returntype) { // Yes, yes, the breaks are unnecessary
            case -1:
                foo = this._getAllDicePools(prechecked, burdened, constructionkeys, constructionarray);
                bar = foo.totalDice;
                return bar;
                break;
            case 0:
                this.basicRollSelector({
                    "prechecked": prechecked, "tnyes": false, "tnnum": 3, "otherkeys": constructionkeys, "otherdice": constructionarray, "otherinputs": formconstruction, "otherlabel": game.i18n.localize("ironclaw2e.chat.rollingSprint") + ", " +
                        game.i18n.format("ironclaw2e.chat.rollingSprintExtra", { "stride": `+-${data.stride}` })
                }, { directroll });
                return;
                break;
        }

        console.error("Sprint roll return type defaulted for actor: " + this.data.name);
        return null;
    }

    /* -------------------------------------------- */
    /*  Special Popup Macro Puukko Functions        */
    /* -------------------------------------------- */

    /** A simple selector to pick the correct roll function based whether directroll is set to true */
    basicRollSelector(holder, { directroll = false } = {}, successfunc = null, autocondition = null) {
        if (directroll) {
            this.silentSelectRolled(holder, successfunc, autocondition);
        } else {
            this.popupSelectRolled(holder, successfunc, autocondition);
        }
    }

    popupSoakRoll({ prechecked = [], tnyes = true, tnnum = 3, extradice = "", otherkeys = [], otherdice = [], otherinputs = "", otherlabel = "" } = {}, { directroll = false, checkweak = false, checkarmor = true } = {}, successfunc = null) {
        const data = this.data.data;
        let checkedstats = [...prechecked];
        let formconstruction = otherinputs;
        let constructionkeys = [...otherkeys];
        let constructionarray = [...otherdice];

        // Armor dice
        const armor = this._getArmorConstruction(constructionkeys, constructionarray, formconstruction, checkarmor);
        formconstruction = armor.otherinputs;
        constructionkeys = armor.otherkeys;
        constructionarray = armor.otherdice;

        // Soak bonuses
        const bonuses = this._getGiftSpecialConstruction("soakBonus", checkedstats, constructionkeys, constructionarray, formconstruction, null);
        checkedstats = bonuses.prechecked;
        formconstruction = bonuses.otherinputs;
        constructionkeys = bonuses.otherkeys;
        constructionarray = bonuses.otherdice;

        formconstruction += `
      <div class="form-group">
       <label class="normal-label">${game.i18n.localize("ironclaw2e.dialog.dicePool.soakWeak")}</label>
       <input type="checkbox" id="doubledice" name="doubledice" value="1" ${(checkweak ? "checked" : "")}></input>
      </div>`;

        if (directroll)
            this.silentSelectRolled({ "prechecked": checkedstats, tnyes, tnnum, extradice, "otherkeys": constructionkeys, "otherdice": constructionarray, otherlabel }, successfunc);
        else
            this.popupSelectRolled({ "prechecked": checkedstats, tnyes, tnnum, extradice, "otherkeys": constructionkeys, "otherdice": constructionarray, "otherinputs": formconstruction, otherlabel }, successfunc);
    }

    popupDefenseRoll({ prechecked = [], tnyes = false, tnnum = 3, extradice = "", otherkeys = [], otherdice = [], otherinputs = "", otherlabel = "" } = {}, { directroll = false, isparry = false, isspecial = false } = {},
        item = null, successfunc = null) {
        const data = this.data.data;
        let checkedstats = [...prechecked];
        let formconstruction = otherinputs;
        let constructionkeys = [...otherkeys];
        let constructionarray = [...otherdice];

        // Shield cover die
        const shield = this._getShieldConstruction(constructionkeys, constructionarray, formconstruction);
        formconstruction = shield.otherinputs;
        constructionkeys = shield.otherkeys;
        constructionarray = shield.otherdice;

        // Guarding bonus
        const guard = this._getStatusBonusConstruction(constructionkeys, constructionarray, formconstruction, "guard");
        formconstruction = guard.otherinputs;
        constructionkeys = guard.otherkeys;
        constructionarray = guard.otherdice;

        // Defense bonuses
        const defensetype = (isparry ? "parry" : (isspecial ? "special" : "dodge"));
        const bonuses = this._getGiftSpecialConstruction("defenseBonus", checkedstats, constructionkeys, constructionarray, formconstruction, item, true, defensetype);
        checkedstats = bonuses.prechecked;
        formconstruction = bonuses.otherinputs;
        constructionkeys = bonuses.otherkeys;
        constructionarray = bonuses.otherdice;

        if (directroll)
            this.silentSelectRolled({ "prechecked": checkedstats, tnyes, tnnum, extradice, "otherkeys": constructionkeys, "otherdice": constructionarray, otherlabel }, successfunc);
        else
            this.popupSelectRolled({ "prechecked": checkedstats, tnyes, tnnum, extradice, "otherkeys": constructionkeys, "otherdice": constructionarray, "otherinputs": formconstruction, otherlabel }, successfunc);
    }

    popupAttackRoll({ prechecked = [], tnyes = true, tnnum = 3, extradice = "", otherkeys = [], otherdice = [], otherinputs = "", otherlabel = "" } = {}, { directroll = false } = {}, item = null, successfunc = null) {
        const data = this.data.data;
        let checkedstats = [...prechecked];
        let formconstruction = otherinputs;
        let constructionkeys = [...otherkeys];
        let constructionarray = [...otherdice];

        // Aiming bonus
        const aim = this._getStatusBonusConstruction(constructionkeys, constructionarray, formconstruction, "aim");
        formconstruction = aim.otherinputs;
        constructionkeys = aim.otherkeys;
        constructionarray = aim.otherdice;

        // Attack bonuses
        const bonuses = this._getGiftSpecialConstruction("attackBonus", checkedstats, constructionkeys, constructionarray, formconstruction, item);
        checkedstats = bonuses.prechecked;
        formconstruction = bonuses.otherinputs;
        constructionkeys = bonuses.otherkeys;
        constructionarray = bonuses.otherdice;

        // Aiming auto-remove
        const actor = this;
        const autoremove = (x => { actor.deleteEffect("aiming"); });

        if (directroll)
            this.silentSelectRolled({ "prechecked": checkedstats, tnyes, tnnum, extradice, "otherkeys": constructionkeys, "otherdice": constructionarray, otherlabel }, successfunc, autoremove);
        else
            this.popupSelectRolled({ "prechecked": checkedstats, tnyes, tnnum, extradice, "otherkeys": constructionkeys, "otherdice": constructionarray, "otherinputs": formconstruction, otherlabel }, successfunc, autoremove);
    }

    popupCounterRoll({ prechecked = [], tnyes = false, tnnum = 3, extradice = "", otherkeys = [], otherdice = [], otherinputs = "", otherlabel = "" } = {}, { directroll = false } = {}, item = null, successfunc = null) {
        const data = this.data.data;
        let checkedstats = [...prechecked];
        let formconstruction = otherinputs;
        let constructionkeys = [...otherkeys];
        let constructionarray = [...otherdice];

        // Guarding bonus
        const guard = this._getStatusBonusConstruction(constructionkeys, constructionarray, formconstruction, "guard");
        formconstruction = guard.otherinputs;
        constructionkeys = guard.otherkeys;
        constructionarray = guard.otherdice;

        // Counter bonuses
        const bonuses = this._getGiftSpecialConstruction("counterBonus", checkedstats, constructionkeys, constructionarray, formconstruction, item);
        checkedstats = bonuses.prechecked;
        formconstruction = bonuses.otherinputs;
        constructionkeys = bonuses.otherkeys;
        constructionarray = bonuses.otherdice;

        if (directroll)
            this.silentSelectRolled({ "prechecked": checkedstats, tnyes, tnnum, extradice, "otherkeys": constructionkeys, "otherdice": constructionarray, otherlabel }, successfunc);
        else
            this.popupSelectRolled({ "prechecked": checkedstats, tnyes, tnnum, extradice, "otherkeys": constructionkeys, "otherdice": constructionarray, "otherinputs": formconstruction, otherlabel }, successfunc);
    }

    /* -------------------------------------------- */
    /*  Actual Popup Functions                      */
    /* -------------------------------------------- */

    /**
     * Damage calculation popup
     * @param {number} readydamage
     * @param {number} readysoak
     * @param {string} damageconditions
     */
    popupDamage(readydamage = 0, readysoak = 0, damageconditions = "") {
        let confirmed = false;
        let speaker = getMacroSpeaker(this);
        let addeddamage = 0;
        let addedconditions = "";

        if (hasConditionsIronclaw("hurt", this)) {
            addeddamage++;
            addedconditions = game.i18n.localize(CommonConditionInfo.getConditionLabel("hurt"));
        }
        if (hasConditionsIronclaw("injured", this)) {
            addeddamage++;
            addedconditions += (addedconditions ? ", " : "") + game.i18n.localize(CommonConditionInfo.getConditionLabel("injured"));
        }
        const confirmSend = game.settings.get("ironclaw2e", "defaultSendDamage");

        let dlog = new Dialog({
            title: game.i18n.format("ironclaw2e.dialog.damageCalc.title", { "name": speaker.alias }),
            content: `
     <form class="ironclaw2e">
      <h1>${game.i18n.format("ironclaw2e.dialog.damageCalc.header", { "name": this.data.name })}</h1>
      <div class="form-group">
       <label class="normal-label">${game.i18n.localize("ironclaw2e.dialog.damageCalc.received")}:</label>
	   <input type="text" id="damage" name="damage" value="${readydamage}" onfocus="this.select();"></input>
      </div>
      <div class="form-group">
       <label class="normal-label">${game.i18n.localize("ironclaw2e.dialog.damageCalc.soaked")}:</label>
	   <input type="text" id="soak" name="soak" value="${readysoak}" onfocus="this.select();"></input>
      </div>
      <div class="form-group">
       <span class="normal-label" title="${addeddamage ? game.i18n.format("ironclaw2e.dialog.damageCalc.conditionDamageAdded", { "conditions": addedconditions }) : game.i18n.localize("ironclaw2e.dialog.damageCalc.conditionDamageNothing")}">
        ${game.i18n.localize("ironclaw2e.dialog.damageCalc.conditionDamage")}: ${addeddamage}</span>
       <input type="checkbox" id="hurt" name="hurt" value="1" checked></input>
      </div>
      <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.damageCalc.knockoutStrike")}</label>
       <input type="checkbox" id="knockout" name="knockout" value="1"></input>
      </div>
      <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.damageCalc.nonLethal")}</label>
       <input type="checkbox" id="nonlethal" name="nonlethal" value="1"></input>
      </div>
      <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.damageCalc.damageConditions")}</label>
       <input type="text" id="cond" name="cond" value="${damageconditions}"></input>
      </div>
      <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.sendToChat")}</label>
       <input type="checkbox" id="send" name="send" value="1" ${confirmSend ? "checked" : ""}></input>
      </div>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.add"),
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.cancel"),
                    callback: () => confirmed = false
                }
            },
            default: "one",
            render: html => { document.getElementById("damage").focus(); },
            close: async html => {
                if (confirmed) {
                    let DAMAGE = html.find('[name=damage]')[0].value;
                    let damage = 0; if (DAMAGE.length > 0) damage = parseInt(DAMAGE);
                    let SOAK = html.find('[name=soak]')[0].value;
                    let soak = 0; if (SOAK.length > 0) soak = parseInt(SOAK);
                    let HURT = html.find('[name=hurt]')[0];
                    let hurt = HURT.checked;
                    let KNOCKOUT = html.find('[name=knockout]')[0];
                    let knockout = KNOCKOUT.checked;
                    let ALLOW = html.find('[name=nonlethal]')[0];
                    let allow = ALLOW.checked;
                    let COND = html.find('[name=cond]')[0].value;
                    let conds = ""; if (COND.length > 0) conds = COND;
                    let SEND = html.find('[name=send]')[0];
                    let send = SEND.checked;

                    let statuses = await this.applyDamage(damage + (hurt ? addeddamage : 0) - soak, knockout, allow);
                    let conditions = splitStatString(conds);
                    if (conditions.length > 0) await this.addEffect(conditions);

                    if (send) {
                        const reportedStatus = statuses[statuses.length - 1];
                        let chatData = {
                            "content": game.i18n.format("ironclaw2e.dialog.damageCalc.chatMessage", { "name": speaker.alias, "condition": game.i18n.localize(CommonConditionInfo.getConditionLabel(reportedStatus)) }),
                            "speaker": speaker
                        };
                        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
                        CONFIG.ChatMessage.documentClass.create(chatData);
                    }
                }
            }
        });
        dlog.render(true);
    }

    /**
     * Damage calculation done silently
     * @param {number} readydamage
     * @param {number} readysoak
     * @param {string} damageconditions
     */
    async silentDamage(readydamage = 0, readysoak = 0, damageconditions = "") {
        let speaker = getMacroSpeaker(this);
        let addeddamage = 0;
        const confirmSend = game.settings.get("ironclaw2e", "defaultSendDamage");

        if (hasConditionsIronclaw("hurt", this)) {
            addeddamage++;
        }
        if (hasConditionsIronclaw("injured", this)) {
            addeddamage++;
        }

        let statuses = await this.applyDamage(readydamage + addeddamage - readysoak);
        let conditions = splitStatString(damageconditions);
        if (conditions.length > 0) await this.addEffect(conditions);

        if (confirmSend) {
            const reportedStatus = statuses[statuses.length - 1];
            let chatData = {
                "content": game.i18n.format("ironclaw2e.dialog.damageCalc.chatMessage", { "name": speaker.alias, "condition": game.i18n.localize(CommonConditionInfo.getConditionLabel(reportedStatus)) }),
                "speaker": speaker
            };
            ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
            CONFIG.ChatMessage.documentClass.create(chatData);
        }
    }

    /** Special condition adding popup */
    popupAddCondition(readyname = "") {
        let confirmed = false;
        let speaker = getMacroSpeaker(this);
        let dlog = new Dialog({
            title: game.i18n.format("ironclaw2e.dialog.addCondition.title", { "name": speaker.alias }),
            content: `
     <form class="ironclaw2e">
      <h1>${game.i18n.format("ironclaw2e.dialog.addCondition.header", { "name": this.data.name })}</h1>
      <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.addCondition.toAdd")}:</label>
      </div>
	  <div class="form-group">
	   <input id="cond" name="cond" value="${readyname}" onfocus="this.select();"></input>
      </div>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.add"),
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.cancel"),
                    callback: () => confirmed = false
                }
            },
            default: "one",
            render: html => { document.getElementById("cond").focus(); },
            close: html => {
                if (confirmed) {
                    let COND = html.find('[name=cond]')[0].value;
                    if (COND.length > 0) this.addEffect(makeCompareReady(COND));
                }
            }
        });
        dlog.render(true);
    }

    /* -------------------------------------------- */
    /* Supermassive Generic Dice Pool Roll Popup    */
    /* -------------------------------------------- */

    /** Supermassive mega-function to make a dynamic popup window asking about which exact dice pools should be included
     * @param {boolean} [tnyes] Whether to use a TN, true for yes
     * @param {number} [tnnum] TN to use
     * @param {string[]} [prechecked] Traits and skills to autocheck on the dialog
     * @param {[string]} [otherkeys] An array of keys, to be used for UI information and with the added HTML for checkboxes in case the other dice can be switched off
     * @param {[number[]]} [otherdice] An array of dice arrays, the items should match exactly with their counterparts at otherkeys
     * @param {string} [otherinputs] HTML string to add to the dialog
     * @param {string} [extradice] Default extra dice to use for the bottom one-line slot
     * @param {string} [otherlabel] Text to postpend to the label
     * @param successfunc Callback to execute after going through with the macro, will not execute if cancelled out
     * @param autocondition Callback to a condition auto-removal function, executed if the setting is on, will not execute if cancelled out
     */
    popupSelectRolled({ tnyes = false, tnnum = 3, prechecked = [], otherkeys = [], otherdice = [], otherinputs = "", extradice = "", otherlabel = "" } = {}, successfunc = null, autocondition = null) {
        const data = this.data.data;
        let formconstruction = ``;
        let firstelement = "";
        const hastraits = data.hasOwnProperty("traits");
        const hasskills = data.hasOwnProperty("skills");
        const hashtml = otherinputs.length > 0;
        const conditionRemoval = game.settings.get("ironclaw2e", "autoConditionRemoval");

        if (prechecked === null || typeof (prechecked) === "undefined") {
            console.warn("Prechecked stat array turned up null or undefined! This should not happen, correcting: " + prechecked);
            prechecked = [];
        }

        let extracareers = [];
        if (data.hasExtraCareers) { // Check if the actor has any extra careers to show
            data.extraCareerIds.forEach(x => extracareers.push(this.items.get(x)));
        }

        let statuseffectnotes = "";
        const burdened = hasConditionsIronclaw("burdened", this);
        if (burdened) {
            statuseffectnotes = `
     <div class="form-group">
       <label class="normal-label">${game.i18n.localize("ironclaw2e.dialog.dicePool.applyBurdened")}:</label>
       <input type="checkbox" id="burdened" name="burdened" value="1" checked></input>
     </div>`;
        }
        if (hasConditionsIronclaw("hiding", this)) {
            statuseffectnotes = `
     <div class="form-group">
       <span class="normal-text"><strong>${game.i18n.localize("ironclaw2e.effect.status.hiding")}:</strong> ${game.i18n.localize("ironclaw2e.dialog.dicePool.hidingExplanation")}:</span>
     </div>`;
        }

        if (hastraits) {
            formconstruction += `<h2>${game.i18n.localize("ironclaw2e.actor.traits")}:</h2>
       <div class="grid-2row grid-minimal">` + "\n";;
            for (let [key, trait] of Object.entries(data.traits)) {
                const lowerkey = makeCompareReady(key); // Separate variable for prechecked in traits to account for using the species or career name in the pre-checked
                const isPrechecked = prechecked.includes(lowerkey) || (trait.name && prechecked.includes(makeCompareReady(trait.name)));
                if (firstelement == "")
                    firstelement = lowerkey;
                formconstruction += `<div class="form-group flex-group-center flex-tight">
       <label class="normal-label">${(data.hasExtraCareers && key === "career" ? trait.name : convertCamelCase(key))}: ${reformDiceString(trait.diceArray)}</label>
	   <input type="checkbox" id="${lowerkey}" name="trait" value="${lowerkey}" ${isPrechecked ? "checked" : ""}></input>
      </div>`+ "\n";
            }
            // Extra Career additional boxes
            if (extracareers.length > 0) {
                for (let [index, extra] of extracareers.entries()) {
                    if (index >= 2)
                        break; // For UI reasons, only show up to two extra careers on dice pool selection, these should select themselves from the top of the list in the sheet
                    const lowerkey = makeCompareReady(extra.data.data.careerName);
                    if (firstelement == "")
                        firstelement = lowerkey;
                    formconstruction += `<div class="form-group flex-group-center flex-tight">
       <label class="normal-label">${extra.data.data.careerName}: ${reformDiceString(extra.data.data.diceArray)}</label>
	   <input type="checkbox" id="${lowerkey}" name="trait" value="${lowerkey}" ${prechecked.includes(lowerkey) ? "checked" : ""}></input>
      </div>`+ "\n";
                }
            }
            formconstruction += `</div>` + "\n";
        }
        if (hasskills) {
            formconstruction += `<h2>${game.i18n.localize("ironclaw2e.actor.skills")}:</h2>
       <div class="grid grid-3col grid-minimal">` + "\n";
            for (let [key, skill] of Object.entries(data.skills)) {
                const lowerkey = makeCompareReady(key);
                if (firstelement == "")
                    firstelement = lowerkey;
                let usedname = (burdenedLimitedStat(lowerkey) ? String.fromCodePoint([9949]) : "") + " " + convertCamelCase(key) + ": " + reformDiceString(skill.diceArray);
                formconstruction += `<div class="form-group flex-group-center flex-tight">
       <label class="${usedname.length > 26 ? "tiny-label" : (usedname.length > 18 ? "small-label" : "normal-label")}">${usedname}</label>
	   <input type="checkbox" id="${lowerkey}" name="skill" value="${lowerkey}" ${prechecked.includes(lowerkey) ? "checked" : ""}></input>
      </div>`+ "\n";
            }
            formconstruction += `</div>` + "\n";
        }

        if (firstelement == "") {
            console.warn("Somehow, an empty actor sheet was received! " + this.data.name);
            return null;
        }

        let confirmed = false;
        let dlog = new Dialog({
            title: game.i18n.localize("ironclaw2e.dialog.dicePool.title"),
            content: `
     <form class="ironclaw2e">
     <h1>${game.i18n.format("ironclaw2e.dialog.dicePool.header", { "name": this.data.name })}</h1>
     <span class="small-text">${game.i18n.format("ironclaw2e.dialog.dicePool.showUp", { "alias": getMacroSpeaker(this).alias })}</span>
     <div class="form-group">
       <label class="normal-label">${game.i18n.localize("ironclaw2e.dialog.dicePool.useTN")}:</label>
       <input type="checkbox" id="iftn" name="iftn" value="1" ${tnyes ? "checked" : ""}></input>
	   <input id="tn" name="tn" value="${tnnum}" onfocus="this.select();"></input>
     </div>
      ${statuseffectnotes}
      ${formconstruction}
      ${otherinputs}
	  <div class="form-group">
       <label class="normal-label">${game.i18n.localize("ironclaw2e.dialog.dicePool.extraDice")}:</label>
	   <input id="dices" name="dices" value="${extradice}" onfocus="this.select();"></input>
      </div>
     <div class="form-group">
       <label class="normal-label">${game.i18n.localize("ironclaw2e.dialog.dicePool.limitAllLabel")}:</label>
       <input type="checkbox" id="iflimit" name="iflimit" value="1"></input>
	   <input id="limit" name="limit" value="" placeholder="${game.i18n.localize("ironclaw2e.dialog.dicePool.limitAllPlaceholder")}" onfocus="this.select();"></input>
     </div>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.roll"),
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.cancel"),
                    callback: () => confirmed = false
                }
            },
            default: "one",
            render: html => { document.getElementById("iftn").focus(); },
            close: async html => {
                if (confirmed) {
                    let traitchecks = html.find('input:checkbox[name=trait]:checked');
                    let skillchecks = html.find('input:checkbox[name=skill]:checked');
                    let traitvalues = [];
                    let skillvalues = [];
                    let totaldice = [0, 0, 0, 0, 0];

                    for (let i = 0; i < traitchecks.length; ++i) { // Go through all the traits and skills, see which ones are checked and grab those
                        traitvalues.push(traitchecks[i].value);
                    }
                    for (let i = 0; i < skillchecks.length; ++i) {
                        skillvalues.push(skillchecks[i].value);
                    }

                    let IFBURDENED = html.find('[name=burdened]');
                    let isburdened = IFBURDENED.length > 0 ? IFBURDENED[0].checked : false;

                    let IFLIMIT = html.find('[name=iflimit]')[0];
                    let uselimit = IFLIMIT.checked;
                    let LIMIT = html.find('[name=limit]')[0].value;
                    let limit = 0;
                    let limitparsed = parseSingleDiceString(LIMIT.trim()); // Check if the limit field is a die, in which case, parse what value it's meant to limit to
                    if (Array.isArray(limitparsed)) limit = checkDiceArrayIndex(limitparsed[1]);
                    else if (LIMIT.length > 0) limit = parseInt(LIMIT);

                    let IFTNSS = html.find('[name=iftn]')[0];
                    let IFTN = IFTNSS.checked;
                    let TNSS = html.find('[name=tn]')[0].value;
                    let TN = 0; if (TNSS.length > 0) TN = parseInt(TNSS);
                    let DICES = html.find('[name=dices]')[0].value;
                    let DICE = findTotalDice(DICES);

                    let DOUBLE = html.find('[name=doubledice]')?.[0];
                    let doubleDice = (DOUBLE ? DOUBLE.checked : false);

                    let labelgiven = false;
                    let label = "";
                    if (IFTN)
                        label = game.i18n.localize("ironclaw2e.chat.rollingTN") + ": ";
                    else
                        label = game.i18n.localize("ironclaw2e.chat.rollingHighest") + ": ";

                    if (hastraits || hasskills) { // Get the dice pools from the checked traits and skills and add them to the roll
                        let statfoobar = this._getDicePools(traitvalues, skillvalues, isburdened, labelgiven);
                        totaldice = statfoobar.totalDice;
                        label += statfoobar.label;
                        labelgiven = statfoobar.labelGiven;
                    }
                    if (Array.isArray(otherdice) && Array.isArray(otherkeys) && otherdice.length > 0 && otherdice.length == otherkeys.length) {
                        for (let i = 0; i < otherdice.length; i++) { // Check whether the listed bonus dice are checked into the roll, then add those to the roll
                            let OTHER = html.find(`[name=${makeCompareReady(otherkeys[i])}]`);
                            let otherchecked = (hashtml && OTHER.length > 0 ? OTHER[0].checked : true);
                            if (otherchecked) {
                                totaldice = addArrays(totaldice, otherdice[i]);
                                if (labelgiven)
                                    label += " + ";
                                label += otherkeys[i];
                                labelgiven = true;
                            }
                        }
                    }
                    if (DICE.some(element => element != 0)) { // Get the extra dice field and add it to the roll if there is anything in it
                        label += " + " + game.i18n.localize("ironclaw2e.chat.extraDice");
                        totaldice = addArrays(totaldice, DICE);
                    }

                    if (doubleDice) {
                        label += ", " + game.i18n.localize("ironclaw2e.chat.doubleDice");
                    } // Set the labels
                    label += ".";
                    if (typeof (otherlabel) === 'string' && otherlabel.length > 0)
                        label += `<p style="color:black">${otherlabel}</p>`;

                    if (doubleDice) { // See if the dicepool will be rolled twice (doubled dicepool), like in case of a Weak Soak
                        totaldice = addArrays(totaldice, totaldice);
                    }
                    if (uselimit) { // See if a special limit has been set to all dice
                        totaldice = enforceLimit(totaldice, limit);
                    }

                    let rollreturn;
                    if (IFTN) // Do and get the actual roll
                        rollreturn = await rollTargetNumberArray(TN, totaldice, label, this);
                    else
                        rollreturn = await rollHighestArray(totaldice, label, this);

                    if (successfunc && typeof (successfunc) == "function") {
                        successfunc(rollreturn); // Then do the special callback function of the roll if it is set
                    }

                    // The automated condition removal callback
                    if (conditionRemoval && autocondition && typeof (autocondition) == "function") {
                        autocondition(); // Automatic condition removal after a successful roll
                    }
                }
            }
        }, { width: 600 });
        dlog.render(true);
    }

    /** Function to silently roll the given prechecked dice pools and extra dice, instead of popping a dialog for it
     * @param {boolean} [tnyes] Whether to use a TN, true for yes
     * @param {number} [tnnum] TN to use
     * @param {string[]} [prechecked] Traits and skills to roll
     * @param {[string]} [otherkeys] An array of keys, to be used for UI information
     * @param {[number[]]} [otherdice] An array of dice arrays, the items should match exactly with their counterparts at otherkeys
     * @param {string} extradice Extra dice to roll
     * @param {string} [otherlabel] Text to postpend to the label
     * @param successfunc Callback to execute after going through with the macro, executed unless an error happens
     * @param autocondition Callback to a condition auto-removal function, executed if the setting is on, executed unless an error happens
     */
    async silentSelectRolled({ tnyes = false, tnnum = 3, prechecked = [], otherkeys = [], otherdice = [], extradice = "", otherlabel = "" } = {}, successfunc = null, autocondition = null) {
        const burdened = hasConditionsIronclaw("burdened", this);
        const conditionRemoval = game.settings.get("ironclaw2e", "autoConditionRemoval");
        // Get the total of all the dice pools
        const all = this._getAllDicePools(prechecked, burdened, otherkeys, otherdice, extradice);

        // Set the label
        let label = all.label + ".";

        // If it exists, set the separate label
        if (typeof (otherlabel) === 'string' && otherlabel.length > 0)
            label += `<p style="color:black">${otherlabel}</p>`;

        let rollreturn;
        if (tnyes) // Do the actual roll, either TN or Highest based on tnyes
            rollreturn = await rollTargetNumberArray(tnnum, all.totalDice, label, this);
        else
            rollreturn = await rollHighestArray(all.totalDice, label, this);

        // The success callback function
        if (successfunc && typeof (successfunc) == "function") {
            successfunc(rollreturn);
        }

        // The condition callback function
        if (conditionRemoval && autocondition && typeof (autocondition) == "function") {
            autocondition();
        }
    }
}