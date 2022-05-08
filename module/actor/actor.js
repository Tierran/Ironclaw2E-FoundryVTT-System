import { checkDiceArrayEmpty, diceFieldUpgrade, getCombatAdvantageConstruction, getTemplatePosition, popupConfirmationBox } from "../helpers.js";
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
import { getDistancePenaltyConstruction } from "../helpers.js";
import { checkQuickModifierKey } from "../helpers.js";
import { getDistanceBetweenPositions } from "../helpers.js";
import { formDicePoolField } from "../helpers.js";
import { CommonConditionInfo, getConditionSelectObject, getSingleConditionIronclaw, getTargetConditionQuota, setTargetConditionQuota } from "../conditions.js";
import { checkStandardDefense, CommonSystemInfo, getRangeDiceFromDistance } from "../systeminfo.js";
// For condition management
import { hasConditionsIronclaw } from "../conditions.js";
import { getConditionNamesIronclaw } from "../conditions.js";
import { addConditionsIronclaw } from "../conditions.js";
import { removeConditionsIronclaw } from "../conditions.js";
// The rest are for the supermassive function
import { CardinalDiceRoller, rollHighestOneLine } from "../dicerollers.js";
import { enforceLimit } from "../helpers.js";
import { burdenedLimitedStat } from "../helpers.js";
import { Ironclaw2EItem } from "../item/item.js";

/**
 * Extend the base Actor entity by defining a custom data necessary for the Ironclaw system
 * @extends {Actor}
 */
export class Ironclaw2EActor extends Actor {

    /* -------------------------------------------- */
    /* Static Functions                             */
    /* -------------------------------------------- */

    /**
     * Function to hook on item pre-create, checks for template items to stop them from being added to actors
     * @param {Ironclaw2EItem} item
     * @param {object} data
     * @param {object} options
     * @param {string} user
     */
    static onActorPreCreateItem(item, data, options, user) {
        // The hook is only really relevant for template items
        // If the item is a template item, grab the data from it and update the actor with it, then prevent the item's creation by returning false
        if (item.type === "speciesTemplate" || item.type === "careerTemplate") {
            const actor = item.actor;
            // Only applies if the actor actually exists
            if (actor) {
                actor.applyTemplate(data, { "confirm": options?.confirmCreation ?? false });
                if (actor.parent) console.warn("Don't mind the _onCreate error underneath, it's a core bug and doesn't actually affect things AFAICT");
                return false;
            }
        }
    }

    /**
     * Handle the chat button event for clicking attack
     * @param {any} event
     */
    static async onChatAttackClick(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const message = game.messages.get($(event.currentTarget).closest('.chat-message')[0]?.dataset?.messageId);

        const directroll = checkQuickModifierKey();

        // Trigger the attack roll
        Ironclaw2EActor.triggerAttackerRoll(message, "attack", directroll, dataset?.skipresist == "true");
    }

    /**
     * Handle the chat button event for clicking spark
     * @param {any} event
     */
    static async onChatSparkClick(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const message = game.messages.get($(event.currentTarget).closest('.chat-message')[0]?.dataset?.messageId);

        const directroll = checkQuickModifierKey();

        // Trigger the spark roll
        Ironclaw2EActor.triggerAttackerRoll(message, "spark", directroll);
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
        const message = game.messages.get($(event.currentTarget).closest('.chat-message')[0]?.dataset?.messageId);

        if (!defenseset || !message) {
            return console.warn("onChatDefenseClick somehow failed to get proper data.")
        }

        // Get the actor based on the current speaker
        let defenseActor = getSpeakerActor();
        let validDefenses = {};
        let defenseOptions = [];

        let otheritem = {};
        const messageId = message.id;
        const messageFlags = message?.data?.flags?.ironclaw2e;
        if (messageFlags) {
            otheritem = Ironclaw2EActor.getOtherItemFlags(messageFlags, messageId);
        }

        const directroll = checkQuickModifierKey();
        const addMessageId = (x => { Ironclaw2EActor.addCallbackToAttackMessage(x?.message, messageId); });

        // Check what defense type was called and either directly roll that defense or compile the list of weapons that fit the type for the next step
        if (defenseActor && dataset?.defensetype) {
            switch (dataset.defensetype) {
                case "dodge":
                    return defenseActor.popupDefenseRoll({ "prechecked": CommonSystemInfo.dodgingBaseStats }, { directroll, otheritem }, null, addMessageId);
                    break;
                case "special":
                    return defenseActor.popupDefenseRoll({ "prechecked": splitStatString(defenseset.defense) }, { directroll, "isspecial": true, otheritem }, null, addMessageId);
                    break;
                case "resist":
                    return defenseActor.popupResistRoll({ "prechecked": splitStatString(defenseset.defense) }, { directroll, otheritem }, null, addMessageId);
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
            Ironclaw2EActor.weaponDefenseDialog(defenseActor, defenseOptions, defenseset?.weaponname, validDefenses, otheritem);
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
        const message = game.messages.get($(event.currentTarget).closest('.chat-message')[0]?.dataset?.messageId);

        if (!holderset || !dataset) {
            return console.warn("onChatSoakClick somehow failed to get proper data.");
        }

        // Get the actor, either through the sceneid if synthetic, or actorid if a full one
        let soakActor = getSpeakerActor();

        let autoHits = false;
        let defenseStats = null;
        let otheritem = {};
        const messageId = message.id;
        const messageFlags = message?.data?.flags?.ironclaw2e;
        if (messageFlags) {
            autoHits = messageFlags.attackDamageAutoHits;
            defenseStats = messageFlags.attackDamageDefense;
            otheritem = Ironclaw2EActor.getOtherItemFlags(messageFlags, messageId);
        }

        const directroll = checkQuickModifierKey();
        const usedDamage = Number.parseInt(dataset.damage);
        let resistSoak = 0;

        // If the soak actor is found and the data necessary for it exists, roll the soak
        if (soakActor && dataset.soaktype) {
            let wait = function (x) {
                if (x.tnData) {
                    const verybad = (x.highest === 1 ? 1 : 0); // In case of botch, increase damage by one
                    const soaks = x.tnData.successes + resistSoak;
                    if (!directroll)
                        soakActor.popupDamage(usedDamage + verybad, soaks, holderset.conditions);
                    else soakActor.silentDamage(usedDamage + verybad, soaks, holderset.conditions);
                }
            };
            if (dataset.soaktype != "conditional") {
                if (autoHits && defenseStats) { // For when resistance roll is added to the soak directly
                    const resist = await soakActor.popupResistRoll({ "prechecked": defenseStats, "otherlabel": game.i18n.format("ironclaw2e.dialog.dicePool.explosionResist", { "name": otheritem.name }) },
                        { directroll, otheritem });
                    resistSoak = resist?.tnData?.successes; // Only successes count
                }
                soakActor.popupSoakRoll({ "prechecked": CommonSystemInfo.soakBaseStats, "otherlabel": game.i18n.format("ironclaw2e.dialog.dicePool.soakAgainst", { "name": otheritem.name }) },
                    { directroll, "checkweak": (holderset.weak == "true"), "checkarmor": (holderset.penetrating == "false") }, wait);
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
     * @param {object} otheritem The opposing item for this roll
     */
    static async weaponDefenseDialog(actor, optionsource, weaponname, { parryvalid = false, countervalid = false } = {}, otheritem = null) {
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
            close: async html => {
                if (confirmed) {
                    const directroll = checkQuickModifierKey();

                    const DEFENSE = html.find('[name=defensepick]')[0];
                    const defensetype = DEFENSE.selectedOptions[0].dataset.type;
                    const defensevalue = DEFENSE.selectedOptions[0].value;
                    const EXTRA = html.find('[name=extra]')[0]?.value;

                    if (defensetype === "counter" || defensetype === "parry") {
                        const weapon = actor?.items.get(defensevalue);
                        if (defensetype === "counter") weapon?.counterRoll(directroll, otheritem, EXTRA);
                        if (defensetype === "parry") weapon?.defenseRoll(directroll, otheritem, EXTRA);
                    } else if (defensetype === "extra") {
                        const extra = findTotalDice(EXTRA);
                        const rollresult = await CardinalDiceRoller.rollHighestArray(extra, rollLabel, actor);
                        if (rollresult.message) Ironclaw2EActor.addCallbackToAttackMessage(rollresult.message, otheritem?.messageId);
                    }
                }
            }
        });
        dlog.render(true);
    }

    /**
     * Separate function to trigger the actual attacker roll from chat
     * @param {object} otheritem
     * @param {string} rolltype
     * @param {boolean} directroll
     * @param {boolean} skipresist
     * @param {number} presettn
     * @param {number} resists
     */
    static triggerAttackerRoll(message, rolltype, directroll = false, skipresist = false, defenders = null, presettn = 3, resists = -1) {
        const messageFlags = message?.data?.flags?.ironclaw2e;
        const otheritem = Ironclaw2EActor.getAttackerItemFlags(messageFlags);
        if (!otheritem) {
            console.error("Attacker chat roll failed to get the proper information from message flags: " + message);
            return;
        }

        const attackActor = Ironclaw2EActor.getAttackerActor(otheritem);
        const skipActor = (!otheritem.actorId && !otheritem.sceneId && !otheritem.tokenId);

        // Trigger the actual roll if the attacker is found and the weapon id is listed
        if (attackActor && otheritem.weaponId) {
            if (rolltype === "attack")
                attackActor.items.get(otheritem.weaponId).attackRoll(directroll, skipresist, presettn, resists, message, defenders);
            else if (rolltype === "spark")
                attackActor.items.get(otheritem.weaponId).sparkRoll(directroll);
        } else if (!attackActor) {
            if (skipActor && game.user.isGM) { // If the item has no flags for where it is, instead try and get it from the directory and launch a roll from there
                if (rolltype === "attack")
                    game.items.get(otheritem.weaponId)?.attackRoll(directroll, skipresist, presettn, resists, message, defenders);
                else if (rolltype === "spark")
                    game.items.get(otheritem.weaponId)?.sparkRoll(directroll);
            } else {
                ui.notifications.warn("ironclaw2e.ui.actorNotFoundForMacro", { localize: true });
            }
        }
    }

    /**
     * Function to add the attacker's message id to a defending roll to allow the attacker to auto-use the correct TN through the context menu
     * @param {string} messageid
     */
    static async addCallbackToAttackMessage(message, messageid) {
        if (!message || !messageid) {
            // If either input is falsey, return out 
            return null;
        }

        let updateData = {
            flags: { "ironclaw2e.defenseForAttack": messageid }
        };
        return await message.update(updateData);
    }

    /**
     * Get the item flags from a message
     * @param {object} flags
     * @param {string} messageId
     */
    static getOtherItemFlags(flags, messageId = "") {
        if (!flags) {
            return null;
        }
        let otheritem = {};
        // Grab the message flags
        otheritem.messageId = messageId;
        otheritem.name = flags.weaponName;
        otheritem.descriptors = flags.weaponDescriptors;
        otheritem.effects = flags.weaponEffects;
        otheritem.stats = flags.weaponAttackStats;
        otheritem.equip = flags.weaponEquip;
        otheritem.range = flags.weaponRange;
        otheritem.multiAttack = flags.weaponMultiAttack;
        otheritem.multiRange = flags.weaponMultiRange;
        otheritem.attackerPos = flags.itemUserPos;
        otheritem.templatePos = getTemplatePosition(flags);
        otheritem.attackerRangeReduction = flags.itemUserRangeReduction;
        otheritem.attackerRangeAutocheck = !(flags.itemUserRangeAutocheck === false); // If and only if the the value is false, will the value be false; if it is true, undefined or something else, value will be true

        return otheritem;
    }

    /**
     * Get the attacker flags from a message
     * @param {object} flags
     */
    static getAttackerItemFlags(flags) {
        if (!flags) {
            return null;
        }
        let otheritem = {};
        if (flags) {
            // Grab the message flags
            otheritem.weaponId = flags.itemId;
            otheritem.actorId = flags.itemActorId;
            otheritem.tokenId = flags.itemTokenId;
            otheritem.sceneId = flags.itemSceneId;
        } else {
            console.error("Attacker flag get failed to get the proper information from message flags: " + flags);
            return null;
        }
        return otheritem;
    }

    /**
     * Get the attacker actor from the otheritem data
     * @param {object} otheritem
     */
    static getAttackerActor(otheritem) {
        if (!otheritem) {
            return null;
        }

        // Get the actor, either through the sceneid if synthetic, or actorid if a full one
        let attackActor = null;
        if (otheritem.sceneId && otheritem.tokenId) {
            const foo = game.scenes.get(otheritem.sceneId)?.tokens.get(otheritem.tokenId);
            attackActor = foo?.actor;
        } else if (otheritem.actorId) {
            attackActor = game.actors.get(otheritem.actorId);
        }

        // Make sure the current user actually has a permission for the actor
        if (attackActor) {
            if (game.user.isGM || attackActor.isOwner) {
                return attackActor;
            } else {
                ui.notifications.warn("ironclaw2e.ui.ownershipInsufficient", { localize: true, thing: "actor" });
            }
        }
        return null;
    }

    /**
     * Get the attacker token from the otheritem data
     * @param {object} otheritem
     */
    static getAttackerToken(otheritem) {
        if (!otheritem) {
            return null;
        }

        // Get the token, either through the sceneid if possible, or actorid if not
        let attackToken = null;
        if (otheritem.sceneId && otheritem.tokenId) {
            attackToken = game.scenes.get(otheritem.sceneId)?.tokens.get(otheritem.tokenId);
        } else if (otheritem.actorId) {
            const foo = game.actors.get(otheritem.actorId);
            attackToken = findActorToken(foo);
        }

        // Make sure the current user actually has a permission for the actor
        if (attackToken) {
            if (game.user.isGM || attackToken.isOwner) {
                return attackToken;
            } else {
                ui.notifications.warn("ironclaw2e.ui.ownershipInsufficient", { localize: true, thing: "token" });
            }
        }
        return null;
    }

    /**
     * Send the returned damage status to chat
     * @param {DamageReturn} returnedstatus
     * @param {Object} speaker
     */
    static async sendDamageToChat(returnedstatus, speaker) {
        const reportedStatus = returnedstatus.conditionArray.length > 0 ? returnedstatus.conditionArray[returnedstatus.conditionArray.length - 1] : null;
        const chatTemplateData = {
            "speaker": speaker.alias,
            "reportedCondition": game.i18n.localize(reportedStatus ? CommonConditionInfo.getConditionLabel(reportedStatus) : "ironclaw2e.chatInfo.damageEffect.chatNothing"),
            "wardChanged": returnedstatus.wardDamage > 0,
            "wardDamage": returnedstatus.wardDamage,
            "wardDestroyed": returnedstatus.wardDestroyed
        };
        const chatContents = await renderTemplate("systems/ironclaw2e/templates/chat/damage-effect.html", chatTemplateData);

        let chatData = {
            "content": chatContents,
            "speaker": speaker
        };
        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
        CONFIG.ChatMessage.documentClass.create(chatData);
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

        // Gift Skill marks
        const markGifts = this.items.filter(element => element.data.type === 'gift' && element.data.data.grantsMark);
        let markMap = new Map();
        for (let gift of markGifts) {
            const giftData = gift.data.data;
            markMap.set(giftData.skillName, 1 + (markMap.get(giftData.skillName) ?? 0));
        }
        data.tempMarks = markMap;

        // Special settings
        const specialGifts = this.items.filter(element => element.data.type === 'gift' && element.data.data.usedSpecialSettings?.length > 0);
        if (specialGifts.length > 0) {
            data.processingLists = {}; // If any of the actor's gifts have special settings, add the holding object for the lists
            data.replacementLists = new Map(); // To store any replacement gifts, stored with the actor as derived data to avoid contaminating the actual gifts

            for (let gift of specialGifts) {
                for (let setting of gift.data.data.usedSpecialSettings) {
                    if (!(setting.settingMode in data.processingLists)) {
                        // If the relevant array for a setting mode does not exist, add an empty one
                        data.processingLists[setting.settingMode] = [];
                    }
                    // If the gift has the replacement field set, attempt to find what it replaces
                    if (setting.replaceName) {
                        const replacement = specialGifts.find(x => makeCompareReady(x.name) === setting.replaceName)?.data.data.usedSpecialSettings.find(x => x.settingMode == setting.settingMode);
                        if (replacement) { // If the replacement is found, add it to the map of replacements stored with the actor
                            if (replacement.giftId === setting.giftId) { // Check for an infinite loop
                                console.warn("Potential infinite loop detected, bonus attempted to replace something with the same id as it: " + setting.giftName);
                                continue;
                            }

                            let stored = (data.replacementLists.has(replacement.giftId) ? data.replacementLists.get(replacement.giftId) : new Map());
                            stored.set(replacement.settingIndex, setting);
                            data.replacementLists.set(replacement.giftId, stored);
                        }
                        // Skip adding a replacing gift to the normal setting list
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
            const comparekey = makeCompareReady(key);

            // Include the marks from Gifts to the calculation
            skill.giftMarks = (data.tempMarks.has(comparekey) ? data.tempMarks.get(comparekey) : 0);
            const marks = skill.marks + skill.giftMarks;
            // Marks
            if (marks > 0) {
                let d12s = Math.floor(marks / 5); // Get the number of d12's for the skill
                let remainder = marks % 5; // Get whatever the mark count is minus full 5's (d12's)
                skill.diceArray[0] += d12s; // Add the d12's
                if (remainder > 0) {
                    skill.diceArray[5 - remainder] += 1; // Based on what the marks are minus full 5's, add a smaller die
                }
                skill.diceString = reformDiceString(skill.diceArray, true); // For showing in the sheet how many dice the marks give
            }

            // Species and Career dice
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
        let badFooting = false; // Ignore bad footing check
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

                        if (used.ignoreBadFooting)
                            badFooting = true;
                    } else { // If used somehow turns out unsuable, send an error
                        console.error("Somehow, the used setting came up unusable: " + used);
                    }
                }
            }
        }
        data.ignoreBadFooting = badFooting;

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
        const currencySettings = game.settings.get("ironclaw2e", "currencySettings");
        let currencyValueChanges = {};

        // Get currency value changes
        if (data.processingLists?.currencyValueChange) { // Check if currency value changes even exist
            for (let setting of data.processingLists.currencyValueChange) { // Loop through them
                if (checkApplicability(setting, null, this)) { // Check initial applicability
                    let used = setting; // Store the setting in a temp variable
                    let replacement = this._checkForReplacement(used); // Store the potential replacement if any in a temp variable
                    while (replacement && checkApplicability(replacement, null, this)) { // As long as the currently used one could be replaced by something applicable
                        used = replacement; // Store the replacement as the one to be used
                        replacement = this._checkForReplacement(used); // Check for a new replacement
                    }
                    if (used && CommonSystemInfo.currencyNames.includes(used.currencyName) && typeof used.currencyValue === "string") { // Sanity check that the used still exists and the currency name is valid
                        // Store the used setting for the coin processing
                        currencyValueChanges[used.currencyName] = used.currencyValue;
                    } else { // If used somehow turns out unsuable, send an error
                        console.error("Somehow, the used setting came up unusable: " + used);
                    }
                }
            }
        }

        for (let [key, setting] of Object.entries(currencySettings)) {
            if (!data.coinage.hasOwnProperty(key)) {
                // Check to make sure every currency that is kept track of actually exists in the settings
                continue;
            }
            if (setting?.used === false) {
                // If the currency is not set as used, skip it
                continue;
            }

            let currency = data.coinage[key];
            const valueString = (currencyValueChanges.hasOwnProperty(key) ? currencyValueChanges[key] : setting.value);
            currency.used = true;
            currency.name = setting.name;
            currency.plural = setting.plural;
            currency.shownValue = valueString;
            const usedValue = (valueString?.includes("/")
                ? parseInt(valueString.slice(0, valueString.indexOf("/"))) / parseInt(valueString.slice(valueString.indexOf("/") + 1))
                : parseInt(valueString));
            currency.totalValue = currency.amount * usedValue;
            currency.totalWeight = (setting.weight * currency.amount) / 6350; // Translate the weight from grams to Ironclaw's stones
            currency.parsedSign = Number.isInteger(setting.sign) ? String.fromCodePoint([setting.sign]) : "";

            allvalue += currency.totalValue;
            allweight += currency.totalWeight;
        }
        data.coinageValue = Math.floor(allvalue).toString() + String.fromCodePoint([data.coinage.baseCurrency.sign]);
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
    /* Private & Protected Internal Functions       */
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
     * @protected
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
     * @param {Map<string,object>} otherkeys A map of dice pool field id's and the item information
     * @param {Map<string,number[]>} otherdice A map of dice arrays, the id's should match exactly with their counterparts at otherkeys
     * @param {Map<string,string>} [othernames] An array of names for the fields, to be used for UI information, the id's should match exactly with their counterparts at otherkeys
     * @param {Map<string,boolean>} otherbools A map of booleans that determine which modifiers should actually be used for quick rolls by default, the id's should match exactly with their counterparts at otherkeys
     * @protected
     */
    _getAllDicePools(prechecked, isburdened, otherkeys = new Map(), otherdice = new Map(), othernames = new Map(), otherbools = new Map(), extradice = "") {
        let label = "";
        let labelgiven = false;
        let totaldice = [0, 0, 0, 0, 0];
        let giftsToExhaust = [];

        // Get the trait and skill pools
        const dicePools = this._getDicePools(prechecked, prechecked, isburdened);
        label = dicePools.label;
        labelgiven = dicePools.labelGiven;
        totaldice = dicePools.totalDice;

        // Get the bonus dice pools
        if (otherkeys?.size > 0) {
            for (let [key, info] of otherkeys.entries()) {
                // Make sure otherbools has a positive match with the key
                if (otherbools.get(key) === true) {
                    totaldice = addArrays(totaldice, otherdice.get(key));
                    if (othernames.has(key)) { // Only try to add a label if the array has a key to use as a label
                        if (labelgiven)
                            label += " + ";
                        label += othernames.get(key);
                    }
                    labelgiven = true;
                }
                // Check whether the item is a gift that should be exhausted
                if (info.itemId && info.exhaustOnUse) {
                    const item = this.items.get(info.itemId);
                    if (item?.type === 'gift') {
                        giftsToExhaust.push(item);
                    }
                }
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

        return { "totalDice": totaldice, "label": label, "labelGiven": labelgiven, "giftsToExhaust": giftsToExhaust };
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

    /* -------------------------------------------- */
    /* Roll Construction Functions                  */
    /* -------------------------------------------- */

    /**
     * Apply a certain type of gift special bonus to roll dialog construction
     * @param {any} specialname
     * @param {any} prechecked
     * @param {any} otherinputs
     * @param {any} otherbools
     * @param {any} otherkeys
     * @param {any} otherdice
     * @param {any} item
     * @param {any} otheritem
     * @param {boolean} defensecheck Whether the check is done from a defense 
     * @param {string} defensetype
     * @returns {object} Returns a holder object which returns the inputs with the added bonuses
     * @private
     */
    _getGiftSpecialConstruction(specialname, prechecked, otherkeys, otherdice, othernames, otherbools, otherinputs, item, otheritem = null, defensecheck = false, defensetype = "") {
        const data = this.data.data;
        if (data.processingLists?.[specialname]) { // Check if they even exist
            for (let setting of data.processingLists[specialname]) { // Loop through them
                if (checkApplicability(setting, item, this, { otheritem, defensecheck, defensetype })) { // Check initial applicability
                    let used = setting; // Store the setting in a temp variable
                    let replacement = this._checkForReplacement(used); // Store the potential replacement if any in a temp variable
                    while (replacement && checkApplicability(replacement, item, this, { otheritem, defensecheck, defensetype })) { // As long as the currently used one could be replaced by something applicable
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
                                        foobar = this._getArmorConstruction(otherkeys, otherdice, othernames, otherbools, otherinputs);
                                        break;
                                    case ("shield"):
                                        foobar = this._getShieldConstruction(otherkeys, otherdice, othernames, otherbools, otherinputs);
                                        break;
                                    case ("guard"):
                                        foobar = this._getStatusBonusConstruction(otherkeys, otherdice, othernames, otherbools, otherinputs, "guard", false);
                                        break;
                                    case ("guard-always"):
                                        foobar = this._getStatusBonusConstruction(otherkeys, otherdice, othernames, otherbools, otherinputs, "guard", true);
                                        break;
                                    case ("aim"):
                                        foobar = this._getStatusBonusConstruction(otherkeys, otherdice, othernames, otherbools, otherinputs, "aim", false);
                                        break;
                                    case ("aim-always"):
                                        foobar = this._getStatusBonusConstruction(otherkeys, otherdice, othernames, otherbools, otherinputs, "aim", true);
                                        break;
                                }
                                if (foobar) {
                                    otherinputs = foobar.otherinputs;
                                    otherbools = foobar.otherbools;
                                    otherkeys = foobar.otherkeys;
                                    otherdice = foobar.otherdice;
                                    othernames = foobar.othernames;
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
                            // Check whether the bonus uses the applicability for autocheck, or is always or never checked
                            const autocheck = used.bonusAutoUsed === "applied" ? checkApplicability(setting, item, this, { otheritem, defensecheck, defensetype, "usecheck": true }) : (used.bonusAutoUsed === "always" ? true : false);
                            const foo = formDicePoolField(used.bonusDice, used.giftName, `${used.giftName}: ${reformDiceString(used.bonusDice, true)}`, autocheck, { "itemid": used.giftId, "exhaustonuse": used.bonusExhaustsOnUse },
                                { otherkeys, otherdice, othernames, otherbools, otherinputs });
                            otherinputs = foo.otherinputs;
                            otherbools = foo.otherbools;
                            otherkeys = foo.otherkeys;
                            otherdice = foo.otherdice;
                            othernames = foo.othernames;
                        }
                    } else { // If used somehow turns out unsuable, send an error
                        console.error("Somehow, the used setting came up unusable: " + used);
                    }
                }
            }
        }

        return { "prechecked": prechecked, "otherinputs": otherinputs, "otherbools": otherbools, "otherkeys": otherkeys, "otherdice": otherdice, "othernames": othernames };
    }

    /**
     * Apply armors to roll dialog construction
     * @param {any} otherinputs
     * @param {any} otherkeys
     * @param {any} otherdice
     * @param {any} othernames
     * @param {any} otherbools
     * @param {boolean} autocheck
     * @returns {object} Returns a holder object which returns the inputs with the added bonuses
     * @private
     */
    _getArmorConstruction(otherkeys, otherdice, othernames, otherbools, otherinputs, autocheck = true) {
        const data = this.data.data;
        let armors = this.items.filter(element => element.data.data.worn === true);
        for (let i = 0; i < armors.length && i < 3; ++i) {
            const foo = formDicePoolField(armors[i].data.data.armorArray, armors[i].data.name, `${armors[i].data.name}: ${reformDiceString(armors[i].data.data.armorArray, true)}`, autocheck, { "itemid": armors[i].id },
                { otherkeys, otherdice, othernames, otherbools, otherinputs });
            otherkeys = foo.otherkeys;
            otherdice = foo.otherdice;
            othernames = foo.othernames;
            otherbools = foo.otherbools;
            otherinputs = foo.otherinputs;
        }
        return { "otherkeys": otherkeys, "otherdice": otherdice, "othernames": othernames, "otherbools": otherbools, "otherinputs": otherinputs };
    }

    /**
     * Apply shield to roll dialog construction
     * @param {any} otherinputs
     * @param {any} otherkeys
     * @param {any} otherdice
     * @param {any} othernames
     * @param {any} otherbools
     * @param {boolean} autocheck
     * @returns {object} Returns a holder object which returns the inputs with the added bonuses
     * @private
     */
    _getShieldConstruction(otherkeys, otherdice, othernames, otherbools, otherinputs, autocheck = true) {
        const data = this.data.data;
        let shield = this.items.find(element => element.data.data.held === true);
        if (shield) {
            const foo = formDicePoolField(shield.data.data.coverArray, shield.data.name, `${shield.data.name}: ${reformDiceString(shield.data.data.coverArray, true)}`, autocheck, { "itemid": shield.id },
                { otherkeys, otherdice, othernames, otherbools, otherinputs });
            otherkeys = foo.otherkeys;
            otherdice = foo.otherdice;
            othernames = foo.othernames;
            otherbools = foo.otherbools;
            otherinputs = foo.otherinputs;
        }
        return { "otherkeys": otherkeys, "otherdice": otherdice, "othernames": othernames, "otherbools": otherbools, "otherinputs": otherinputs };
    }

    /**
     * Apply guarding or aiming bonus to roll dialog construction
     * @param {any} otherinputs
     * @param {any} otherkeys
     * @param {any} otherdice
     * @param {any} otherbools
     * @param {object} bonustype Whether the bonus is of "aim" or "guard" type
     * @param {boolean} skipcheck Whether to skip the "Guarding" condition check
     * @returns {object} Returns a holder object which returns the inputs with the added bonuses
     * @private
     */
    _getStatusBonusConstruction(otherkeys, otherdice, othernames, otherbools, otherinputs, bonustype, skipcheck = false) {
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
                return { "otherkeys": otherkeys, "otherdice": otherdice, "othernames": othernames, "otherbools": otherbools, "otherinputs": otherinputs };
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
            return { "otherkeys": otherkeys, "otherdice": otherdice, "othernames": othernames, "otherbools": otherbools, "otherinputs": otherinputs };
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

        const foo = formDicePoolField(bonusArray, bonusLabel, `${bonusLabel}: ${reformDiceString(bonusArray, true)}`, true, {},
            { otherkeys, otherdice, othernames, otherbools, otherinputs });

        return (foo ? foo : { "otherkeys": otherkeys, "otherdice": otherdice, "othernames": othernames, "otherbools": otherbools, "otherinputs": otherinputs });
    }

    /* -------------------------------------------- */
    /*  Actor Change Functions                      */
    /* -------------------------------------------- */

    /**
     * Change which illumination item the actor is using, or turn them all off
     * @param {Ironclaw2EItem} lightsource
     */
    async changeLightSource(lightsource) {
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
            await lightsource.update({ "_id": lightsource.id, "data.lighted": true });
        }

        let doused = [];
        for (let l of lightsources) { // Douse all other light sources, including the caller if it was previously lighted
            doused.push({ "_id": l.id, "data.lighted": false });
        }
        await this.updateEmbeddedDocuments("Item", doused);
        await this._updateTokenLighting(updatedlightdata);
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

        return this._updateTokenLighting(updatedlightdata);
    }

    /**
     * @typedef {{
     *   conditionArray: string[],
     *   wardDamage: number,
     *   wardDestroyed: boolean
     * }} DamageReturn
     */

    /**
     * Apply damage conditions to the actor
     * @param {number} damage
     * @param {boolean} knockout
     * @param {boolean} nonlethal
     * @returns {Promise<DamageReturn>}
     */
    async applyDamage(damage, attack = true, knockout = false, nonlethal = false, applyWard = true) {
        const conditionRemoval = game.settings.get("ironclaw2e", "autoConditionRemoval");
        let wardDamage = -1;
        let wardDestroyed = false;
        if (applyWard && damage > 0) {
            const cond = getSingleConditionIronclaw("temporaryward", this);
            if (cond) {
                let ward = getTargetConditionQuota(cond, this);
                if (ward > 0) {
                    if (ward > damage) {
                        // If there is more ward than damage, reduce the damage from ward, set damage to zero and update the ward with the reduced value
                        ward -= damage;
                        wardDamage = damage;
                        damage = 0;
                        await this.updateEffectQuota(cond, ward);
                    } else {
                        // Else, reduce the damage by the ward and either remove the ward condition or reduce it to zero
                        damage -= ward;
                        wardDamage = ward;
                        ward = 0;
                        if (conditionRemoval)
                            await this.deleteEffect(cond.id, true);
                        else
                            await this.updateEffectQuota(cond, ward);
                        wardDestroyed = true;
                    }
                }
            }
        }

        // Only an attack gives Reeling
        let adding = (attack ? ["reeling"] : []);
        // Actual damage and knockout effects
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
        // If the attack is marked as non-lethal, prevent outright immediate death
        if (damage >= 5 && !nonlethal) adding.push("dead");
        if (damage >= 6 && !nonlethal) adding.push("overkilled");
        await this.addEffect(adding);
        return { "conditionArray": adding, wardDamage, wardDestroyed };
    }

    /**
     * Add a given condition to the actor
     * @param {string | [string]} condition 
     */
    async addEffect(condition) {
        return await addConditionsIronclaw(condition, this);
    }

    /**
     * Update the quota of the condition
     * @param {ActiveEffect | string} condition
     * @param {number} value
     */
    async updateEffectQuota(condition, value) {
        const usedcond = (typeof (condition) === "string" ? getSingleConditionIronclaw(condition, this) : condition);
        return await setTargetConditionQuota(usedcond, value);
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

    /**
     * Apply a template item to this actor
     * @param {object | Ironclaw2EItem} item
     */
    async applyTemplate(item, { wait = -1, confirm = true } = {}) {
        const actorData = this.data;
        const data = actorData.data;
        const itemData = (item instanceof Ironclaw2EItem ? item.data : item);
        let updateData = {};

        // Optional sleep to help avert race conditions
        if (wait > 0) await game.ironclaw2e.sleep(wait);

        // Simple stat updates
        const usedName = (itemData.data.forcedName ? itemData.data.forcedName : itemData.name);
        if (itemData.type === "speciesTemplate") {
            if (confirm && data.traits.species.name) {
                // Confirmation on whether to replace the existing data
                const confirmation = await popupConfirmationBox("ironclaw2e.dialog.templateReplacementSpecies.title", "ironclaw2e.dialog.templateReplacementSpecies.note", "ironclaw2e.dialog.replace",
                    { "actorname": actorData.name, "itemname": usedName });
                if (confirmation.confirmed === false) return;
            }
            updateData = {
                "data.traits.species.name": usedName,
                "data.traits.species.speciesSkill1": itemData.data.skill1,
                "data.traits.species.speciesSkill2": itemData.data.skill2,
                "data.traits.species.speciesSkill3": itemData.data.skill3,

                "data.attributes.habitat": itemData.data.attributes.habitat,
                "data.attributes.diet": itemData.data.attributes.diet,
                "data.attributes.cycle": itemData.data.attributes.cycle,
                "data.attributes.senses": itemData.data.attributes.senses,
            };
            // Increased Trait handling
            if (itemData.data.traitIncreases.increase1) {
                const trait = makeCompareReady(itemData.data.traitIncreases.increase1);
                if (data.traits[trait]?.dice) {
                    const betterDice = reformDiceString(diceFieldUpgrade(findTotalDice(data.traits[trait].dice), 1));
                    const fieldName = "data.traits." + trait + ".dice";
                    updateData[fieldName] = betterDice;
                }
            }
            if (itemData.data.traitIncreases.increase2) {
                const trait = makeCompareReady(itemData.data.traitIncreases.increase2);
                if (data.traits[trait]?.dice) {
                    const betterDice = reformDiceString(diceFieldUpgrade(findTotalDice(data.traits[trait].dice), 1));
                    const fieldName = "data.traits." + trait + ".dice";
                    updateData[fieldName] = betterDice;
                }
            }
            if (itemData.data.traitIncreases.increase3) {
                const trait = makeCompareReady(itemData.data.traitIncreases.increase3);
                if (data.traits[trait]?.dice) {
                    const betterDice = reformDiceString(diceFieldUpgrade(findTotalDice(data.traits[trait].dice), 1));
                    const fieldName = "data.traits." + trait + ".dice";
                    updateData[fieldName] = betterDice;
                }
            }
        } else if (itemData.type === "careerTemplate") {
            if (confirm && data.traits.career.name) {
                // Confirmation on whether to replace the existing data
                const confirmation = await popupConfirmationBox("ironclaw2e.dialog.templateReplacementCareer.title", "ironclaw2e.dialog.templateReplacementCareer.note", "ironclaw2e.dialog.replace",
                    { "actorname": actorData.name, "itemname": usedName });
                if (confirmation.confirmed === false) return;
            }
            updateData = {
                "data.traits.career.name": usedName,
                "data.traits.career.careerSkill1": itemData.data.skill1,
                "data.traits.career.careerSkill2": itemData.data.skill2,
                "data.traits.career.careerSkill3": itemData.data.skill3
            };
        }

        // Actual update
        await this.update(updateData);

        // Getting and making the embedded documents, if the actor doesn't yet have them
        let itemIds = [];
        if (itemData.data.gifts.gift1) itemIds.push(itemData.data.gifts.gift1);
        if (itemData.data.gifts.gift2) itemIds.push(itemData.data.gifts.gift2);
        if (itemData.data.gifts.gift3) itemIds.push(itemData.data.gifts.gift3);
        if (itemData.type === "speciesTemplate") {
            if (itemData.data.weapons?.weapon1) itemIds.push(itemData.data.weapons.weapon1);
            if (itemData.data.weapons?.weapon2) itemIds.push(itemData.data.weapons.weapon2);
            if (itemData.data.weapons?.weapon3) itemIds.push(itemData.data.weapons.weapon3);
        }

        let itemCreateData = [];
        for (let foo of itemIds) {
            // Find if anything matches, either by id or name
            let bar = null;
            if (game.items.has(foo)) {
                bar = game.items.get(foo);
            } else {
                bar = game.items.getName(foo);
            }
            // If something was found, make sure the actor does not already have it, then add it to the list to make
            if (bar && bar.data) {
                if (!this.items.getName(bar.name))
                    itemCreateData.push(bar.data);
            } else {
                console.warn("Template item creation failed for id: " + foo);
            }
        }

        // Actually create them
        if (itemCreateData.length > 0)
            await this.createEmbeddedDocuments("Item", itemCreateData);
    }

    /* -------------------------------------------- */
    /*  Actor Information Getters                   */
    /* -------------------------------------------- */

    /**
     * Get the degree of range penalty reduction this actor has for the given item
     * @param {Ironclaw2EItem} item
     * @returns {{reduction: number, autocheck: boolean}}
     */
    getRangePenaltyReduction(item = null, rallycheck = false) {
        const data = this.data.data;
        const itemData = item?.data?.data;
        let reduction = 0;
        let autocheck = true;
        // Grab the penalty reduction degree from the special settings
        if (data.processingLists?.rangePenaltyReduction) { // Check if range penalty reduction bonuses even exist
            for (let setting of data.processingLists.rangePenaltyReduction) { // Loop through them
                if (checkApplicability(setting, item, this, { rallycheck })) { // Check initial applicability
                    let used = setting; // Store the setting in a temp variable
                    let replacement = this._checkForReplacement(used); // Store the potential replacement if any in a temp variable
                    while (replacement && checkApplicability(replacement, item, this, { rallycheck })) { // As long as the currently used one could be replaced by something applicable
                        used = replacement; // Store the replacement as the one to be used
                        replacement = this._checkForReplacement(used); // Check for a new replacement
                    }
                    if (used) { // Sanity check that the used still exists
                        // Apply the used setting
                        if (reduction < used.penaltyReductionNumber) reduction = used.penaltyReductionNumber;
                    } else { // If used somehow turns out unsuable, send an error
                        console.error("Somehow, the used setting came up unusable: " + used);
                    }
                }
            }
        }

        // Check whether the attack 'item' is representing is magical, and whether the character has a wand readied, in which case, toggle the auto-check off
        if (itemData?.descriptorsSplit?.includes("magic") && this.items.some(element => element.data.data.readied === true && element.data.data.descriptorsSplit?.includes("wand"))) {
            autocheck = false;
        }

        return { reduction, autocheck };
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
        let constructionkeys = new Map();
        let constructionarray = new Map();
        let constructionnames = new Map();
        let constructionbools = new Map();
        let prechecked = CommonSystemInfo.initiativeBaseStats;
        const burdened = hasConditionsIronclaw("burdened", this);

        if (returntype === 0) {// Special case to roll initiative in an encounter through the sheet
            const activeCombatant = game.combat?.getCombatantByActor(this.id);
            if (activeCombatant?.isOwner && !activeCombatant?.initiative) { // If the actor is an active combatant in an encounter and has _not_ yet rolled initiative, roll initiative for it
                return this.rollInitiative();
            }
        }

        const bonuses = this._getGiftSpecialConstruction("initiativeBonus", prechecked, constructionkeys, constructionarray, constructionnames, constructionbools, formconstruction, null);
        prechecked = bonuses.prechecked;
        formconstruction = bonuses.otherinputs;
        constructionkeys = bonuses.otherkeys;
        constructionarray = bonuses.otherdice;
        constructionnames = bonuses.othernames;
        constructionbools = bonuses.otherbools;

        let foo, bar;
        switch (returntype) { // Yes, yes, the breaks are unnecessary
            case -1:
                foo = this._getAllDicePools(prechecked, burdened, constructionkeys, constructionarray, constructionnames, constructionbools);
                bar = foo.totalDice;
                return bar;
                break;
            case 0:
                this.basicRollSelector({
                    "prechecked": prechecked, "tnyes": true, "tnnum": tntouse, "otherkeys": constructionkeys, "otherdice": constructionarray, "otherinputs": formconstruction, "otherbools": constructionbools, "constructionnames": constructionnames,
                    "otherlabel": game.i18n.localize("ironclaw2e.chat.rollingInitiative")
                }, { directroll });
                return null;
                break;
            case 1:
                foo = this._getAllDicePools(prechecked, burdened, constructionkeys, constructionarray, constructionnames, constructionbools);
                bar = foo.totalDice;
                Ironclaw2EItem.giftSetExhaustArray(foo.giftsToExhaust, "true");
                return CardinalDiceRoller.rollHighestArray(bar, game.i18n.localize("ironclaw2e.chat.rollingInitiative") + ": " + foo.label, this, false);
                break;
            case 2:
                foo = this._getAllDicePools(prechecked, burdened, constructionkeys, constructionarray, constructionnames, constructionbools);
                bar = foo.totalDice;
                Ironclaw2EItem.giftSetExhaustArray(foo.giftsToExhaust, "true");
                return CardinalDiceRoller.rollTargetNumberArray(tntouse, bar, game.i18n.localize("ironclaw2e.chat.rollingInitiativeCheck") + ": " + foo.label, this, false);
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
        let constructionkeys = new Map();
        let constructionarray = new Map();
        let constructionnames = new Map();
        let constructionbools = new Map();
        let prechecked = CommonSystemInfo.sprintBaseStats;
        const burdened = hasConditionsIronclaw("burdened", this);

        const bonuses = this._getGiftSpecialConstruction("sprintBonus", prechecked, constructionkeys, constructionarray, constructionnames, constructionbools, formconstruction, null);
        prechecked = bonuses.prechecked;
        formconstruction = bonuses.otherinputs;
        constructionkeys = bonuses.otherkeys;
        constructionarray = bonuses.otherdice;
        constructionnames = bonuses.othernames;
        constructionbools = bonuses.otherbools;

        let foo, bar;
        switch (returntype) { // Yes, yes, the breaks are unnecessary
            case -1:
                foo = this._getAllDicePools(prechecked, burdened, constructionkeys, constructionarray, constructionnames, constructionbools);
                bar = foo.totalDice;
                return bar;
                break;
            case 0:
                this.basicRollSelector({
                    "prechecked": prechecked, "tnyes": false, "tnnum": 3, "otherkeys": constructionkeys, "otherdice": constructionarray, "otherinputs": formconstruction, "otherbools": constructionbools, "constructionnames": constructionnames,
                    "otherlabel": game.i18n.localize("ironclaw2e.chat.rollingSprint") + ", " + game.i18n.format("ironclaw2e.chat.rollingSprintExtra", { "stride": `+-${data.stride}` })
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
            return this.silentSelectRolled(holder, successfunc, autocondition);
        } else {
            return this.popupSelectRolled(holder, successfunc, autocondition);
        }
    }

    async popupRallyRoll({ prechecked = [], tnyes = true, tnnum = 3, extradice = "", otherkeys = new Map(), otherdice = new Map(), othernames = new Map(), otherbools = new Map(), otherinputs = "", otherlabel = "" } = {}, { directroll = false, targetpos = null } = {},
        successfunc = null) {
        const data = this.data.data;
        let checkedstats = [...prechecked];
        let constructionkeys = new Map(otherkeys);
        let constructionarray = new Map(otherdice);
        let constructionnames = new Map(othernames);
        let constructionbools = new Map(otherbools);
        let formconstruction = otherinputs;

        let usedTn = tnnum;
        // Distance penalty as the TN
        if (targetpos) {
            const foundToken = findActorToken(this);
            if (foundToken) {
                const dist = getDistanceBetweenPositions(foundToken.data, targetpos);
                const reduction = this.getRangePenaltyReduction(null, true).reduction;
                const penalty = getRangeDiceFromDistance(dist, reduction, false, true);
                // Check if the penalty even exists before popping up the roll field
                if (penalty?.rangeDice) {
                    const foundDice = findTotalDice(penalty.rangeDice);
                    const rangeLabel = game.i18n.format("ironclaw2e.dialog.dicePool.rangePenaltyDistance", { "range": penalty.rangeBandOriginal, "penalty": penalty.rangeDice });
                    const rangeTitle = game.i18n.format("ironclaw2e.dialog.dicePool.rangeRollTitle", { "range": penalty.rangeBandOriginal });
                    const rolled = await (directroll ? CardinalDiceRoller.rollHighestArray(foundDice, rangeLabel, this) : rollHighestOneLine(penalty.rangeDice, rangeLabel, rangeTitle, this));
                    if (rolled && usedTn < rolled.highest) usedTn = rolled.highest;
                }
            }
        }

        return this.basicRollSelector({
            "prechecked": checkedstats, tnyes, "tnnum": usedTn, extradice, "otherkeys": constructionkeys, "otherdice": constructionarray, "othernames": constructionnames, "otherbools": constructionbools, "otherinputs": formconstruction,
            otherlabel
        }, { directroll }, successfunc);
    }

    popupSoakRoll({ prechecked = [], tnyes = true, tnnum = 3, extradice = "", otherkeys = new Map(), otherdice = new Map(), othernames = new Map(), otherbools = new Map(), otherinputs = "", otherlabel = "" } = {}, { directroll = false, checkweak = false, checkarmor = true } = {}, successfunc = null) {
        const data = this.data.data;
        let checkedstats = [...prechecked];
        let constructionkeys = new Map(otherkeys);
        let constructionarray = new Map(otherdice);
        let constructionnames = new Map(othernames);
        let constructionbools = new Map(otherbools);
        let formconstruction = otherinputs;

        // Armor dice
        const armor = this._getArmorConstruction(constructionkeys, constructionarray, constructionnames, constructionbools, formconstruction, checkarmor);
        formconstruction = armor.otherinputs;
        constructionkeys = armor.otherkeys;
        constructionarray = armor.otherdice;
        constructionnames = armor.othernames;
        constructionbools = armor.otherbools;

        // Soak bonuses
        const bonuses = this._getGiftSpecialConstruction("soakBonus", checkedstats, constructionkeys, constructionarray, constructionnames, constructionbools, formconstruction, null);
        checkedstats = bonuses.prechecked;
        formconstruction = bonuses.otherinputs;
        constructionkeys = bonuses.otherkeys;
        constructionarray = bonuses.otherdice;
        constructionnames = bonuses.othernames;
        constructionbools = bonuses.otherbools;

        // Weak damage toggle
        formconstruction += `
      <div class="form-group">
       <label class="normal-label">${game.i18n.localize("ironclaw2e.dialog.dicePool.soakWeak")}</label>
       <input type="checkbox" id="doubledice" name="doubledice" value="1" ${(checkweak ? "checked" : "")}></input>
      </div>`;

        return this.basicRollSelector({
            "prechecked": checkedstats, tnyes, tnnum, extradice, "otherkeys": constructionkeys, "otherdice": constructionarray, "othernames": constructionnames, "otherbools": constructionbools, "otherinputs": formconstruction,
            "doubledice": checkweak, otherlabel
        }, { directroll }, successfunc);
    }

    popupDefenseRoll({ prechecked = [], tnyes = false, tnnum = 3, extradice = "", otherkeys = new Map(), otherdice = new Map(), othernames = new Map(), otherbools = new Map(), otherinputs = "", otherlabel = "" } = {}, { directroll = false, isparry = false, isspecial = false, otheritem = null } = {},
        item = null, successfunc = null) {
        const data = this.data.data;
        let checkedstats = [...prechecked];
        let constructionkeys = new Map(otherkeys);
        let constructionarray = new Map(otherdice);
        let constructionnames = new Map(othernames);
        let constructionbools = new Map(otherbools);
        let formconstruction = otherinputs;

        // Shield cover die
        const shield = this._getShieldConstruction(constructionkeys, constructionarray, constructionnames, constructionbools, formconstruction);
        formconstruction = shield.otherinputs;
        constructionkeys = shield.otherkeys;
        constructionarray = shield.otherdice;
        constructionnames = shield.othernames;
        constructionbools = shield.otherbools;

        // Guarding bonus
        const guard = this._getStatusBonusConstruction(constructionkeys, constructionarray, constructionnames, constructionbools, formconstruction, "guard");
        formconstruction = guard.otherinputs;
        constructionkeys = guard.otherkeys;
        constructionarray = guard.otherdice;
        constructionnames = guard.othernames;
        constructionbools = guard.otherbools;

        // Attacker range penalty
        if (otheritem) {
            const foundToken = findActorToken(this);
            if (foundToken && otheritem.attackerPos) {
                const dist = getDistanceBetweenPositions(otheritem.attackerPos, foundToken.data, { usecombatrules: true });
                const range = getDistancePenaltyConstruction(constructionkeys, constructionarray, constructionnames, constructionbools, formconstruction, dist, { "reduction": otheritem.attackerRangeReduction, "autocheck": otheritem.attackerRangeAutocheck });
                formconstruction = range.otherinputs;
                constructionkeys = range.otherkeys;
                constructionarray = range.otherdice;
                constructionnames = range.othernames;
                constructionbools = range.otherbools;
            }
        }

        // Defense bonuses
        const defensetype = (isparry ? "parry" : (isspecial ? "special" : "dodge"));
        const bonuses = this._getGiftSpecialConstruction("defenseBonus", checkedstats, constructionkeys, constructionarray, constructionnames, constructionbools, formconstruction, item, otheritem, true, defensetype);
        checkedstats = bonuses.prechecked;
        formconstruction = bonuses.otherinputs;
        constructionkeys = bonuses.otherkeys;
        constructionarray = bonuses.otherdice;
        constructionnames = bonuses.othernames;
        constructionbools = bonuses.otherbools;

        return this.basicRollSelector({
            "prechecked": checkedstats, tnyes, tnnum, extradice, "otherkeys": constructionkeys, "otherdice": constructionarray, "othernames": constructionnames, "otherbools": constructionbools, "otherinputs": formconstruction,
            otherlabel
        }, { directroll }, successfunc);
    }

    popupAttackRoll({ prechecked = [], tnyes = true, tnnum = 3, extradice = "", otherkeys = new Map(), otherdice = new Map(), othernames = new Map(), otherbools = new Map(), otherinputs = "", otherlabel = "" } = {}, { directroll = false, target = null } = {}, item = null, successfunc = null) {
        const data = this.data.data;
        let checkedstats = [...prechecked];
        let constructionkeys = new Map(otherkeys);
        let constructionarray = new Map(otherdice);
        let constructionnames = new Map(othernames);
        let constructionbools = new Map(otherbools);
        let formconstruction = otherinputs;

        // Aiming bonus
        const aim = this._getStatusBonusConstruction(constructionkeys, constructionarray, constructionnames, constructionbools, formconstruction, "aim");
        formconstruction = aim.otherinputs;
        constructionkeys = aim.otherkeys;
        constructionarray = aim.otherdice;
        constructionnames = aim.othernames;
        constructionbools = aim.otherbools;

        // Attack bonuses
        const bonuses = this._getGiftSpecialConstruction("attackBonus", checkedstats, constructionkeys, constructionarray, constructionnames, constructionbools, formconstruction, item);
        checkedstats = bonuses.prechecked;
        formconstruction = bonuses.otherinputs;
        constructionkeys = bonuses.otherkeys;
        constructionarray = bonuses.otherdice;
        constructionnames = bonuses.othernames;
        constructionbools = bonuses.otherbools;

        // Combat Advantage
        if (target) {
            const advantage = getCombatAdvantageConstruction(constructionkeys, constructionarray, constructionnames, constructionbools, formconstruction, target);
            formconstruction = advantage.otherinputs;
            constructionkeys = advantage.otherkeys;
            constructionarray = advantage.otherdice;
            constructionnames = advantage.othernames;
            constructionbools = advantage.otherbools;
        }

        // Aiming auto-remove
        const actor = this;
        const autoremove = (x => { actor.deleteEffect("aiming"); });

        return this.basicRollSelector({
            "prechecked": checkedstats, tnyes, tnnum, extradice, "otherkeys": constructionkeys, "otherdice": constructionarray, "othernames": constructionnames, "otherbools": constructionbools, "otherinputs": formconstruction,
            otherlabel
        }, { directroll }, successfunc, autoremove);
    }

    popupCounterRoll({ prechecked = [], tnyes = false, tnnum = 3, extradice = "", otherkeys = new Map(), otherdice = new Map(), othernames = new Map(), otherbools = new Map(), otherinputs = "", otherlabel = "" } = {}, { directroll = false, otheritem = null } = {}, item = null, successfunc = null) {
        const data = this.data.data;
        let checkedstats = [...prechecked];
        let constructionkeys = new Map(otherkeys);
        let constructionarray = new Map(otherdice);
        let constructionnames = new Map(othernames);
        let constructionbools = new Map(otherbools);
        let formconstruction = otherinputs;

        // Guarding bonus
        const guard = this._getStatusBonusConstruction(constructionkeys, constructionarray, constructionnames, constructionbools, formconstruction, "guard");
        formconstruction = guard.otherinputs;
        constructionkeys = guard.otherkeys;
        constructionarray = guard.otherdice;
        constructionnames = guard.othernames;
        constructionbools = guard.otherbools;

        // Counter bonuses
        const bonuses = this._getGiftSpecialConstruction("counterBonus", checkedstats, constructionkeys, constructionarray, constructionnames, constructionbools, formconstruction, item, otheritem);
        checkedstats = bonuses.prechecked;
        formconstruction = bonuses.otherinputs;
        constructionkeys = bonuses.otherkeys;
        constructionarray = bonuses.otherdice;
        constructionnames = bonuses.othernames;
        constructionbools = bonuses.otherbools;

        return this.basicRollSelector({
            "prechecked": checkedstats, tnyes, tnnum, extradice, "otherkeys": constructionkeys, "otherdice": constructionarray, "othernames": constructionnames, "otherbools": constructionbools, "otherinputs": formconstruction,
            otherlabel
        }, { directroll }, successfunc);
    }

    popupResistRoll({ prechecked = [], tnyes = true, tnnum = 3, extradice = "", otherkeys = new Map(), otherdice = new Map(), othernames = new Map(), otherbools = new Map(), otherinputs = "", otherlabel = "" } = {}, { directroll = false, otheritem = null } = {}, item = null, successfunc = null) {
        const data = this.data.data;
        let checkedstats = [...prechecked];
        let constructionkeys = new Map(otherkeys);
        let constructionarray = new Map(otherdice);
        let constructionnames = new Map(othernames);
        let constructionbools = new Map(otherbools);
        let formconstruction = otherinputs;

        if (otheritem) {
            // Explosion shield cover
            if (otheritem.multiAttack === "explosion") {
                const shield = this._getShieldConstruction(constructionkeys, constructionarray, constructionnames, constructionbools, formconstruction);
                formconstruction = shield.otherinputs;
                constructionkeys = shield.otherkeys;
                constructionarray = shield.otherdice;
                constructionnames = shield.othernames;
                constructionbools = shield.otherbools;
            }

            // Attacker range penalty
            const foundToken = findActorToken(this);
            if (foundToken && otheritem.attackerPos) {
                // Use either the template if it exists, or the token data if the attack explosion spot is not indicated, or the attack is direct
                const dist = getDistanceBetweenPositions(otheritem.attackerPos, otheritem.templatePos || foundToken.data, { usecombatrules: true });
                const range = getDistancePenaltyConstruction(constructionkeys, constructionarray, constructionnames, constructionbools, formconstruction, dist, { "reduction": otheritem.attackerRangeReduction, "autocheck": otheritem.attackerRangeAutocheck });
                formconstruction = range.otherinputs;
                constructionkeys = range.otherkeys;
                constructionarray = range.otherdice;
                constructionnames = range.othernames;
                constructionbools = range.otherbools;

                // Potential extra range penalty from explosion
                if (otheritem.templatePos) {
                    const exploDist = getDistanceBetweenPositions(otheritem.templatePos, foundToken.data, { usecombatrules: true });
                    const exploRange = getDistancePenaltyConstruction(constructionkeys, constructionarray, constructionnames, constructionbools, formconstruction, exploDist, { "autocheck": otheritem.attackerRangeAutocheck, "explosionpenalty": true });
                    formconstruction = exploRange.otherinputs;
                    constructionkeys = exploRange.otherkeys;
                    constructionarray = exploRange.otherdice;
                    constructionnames = exploRange.othernames;
                    constructionbools = exploRange.otherbools;

                }
            }
        }

        // Resist bonuses
        const bonuses = this._getGiftSpecialConstruction("resistBonus", checkedstats, constructionkeys, constructionarray, constructionnames, constructionbools, formconstruction, item, otheritem);
        checkedstats = bonuses.prechecked;
        formconstruction = bonuses.otherinputs;
        constructionkeys = bonuses.otherkeys;
        constructionarray = bonuses.otherdice;
        constructionnames = bonuses.othernames;
        constructionbools = bonuses.otherbools;

        return this.basicRollSelector({
            "prechecked": checkedstats, tnyes, tnnum, extradice, "otherkeys": constructionkeys, "otherdice": constructionarray, "othernames": constructionnames, "otherbools": constructionbools, "otherinputs": formconstruction,
            otherlabel
        }, { directroll }, successfunc);
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
    async popupDamage(readydamage = 0, readysoak = 0, damageconditions = "") {
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
        const ward = getTargetConditionQuota("temporaryward", this);

        const templateData = {
            "actor": this,
            "addeddamage": addeddamage,
            "addedconditions": addedconditions,
            "confirmSend": confirmSend,
            "readydamage": readydamage,
            "readysoak": readysoak,
            "damageconditions": damageconditions,
            "temporaryWard": ward,
            "hasWard": ward >= 0
        };

        const contents = await renderTemplate("systems/ironclaw2e/templates/popup/damage-popup.html", templateData);

        let dlog = new Dialog({
            title: game.i18n.format("ironclaw2e.dialog.damageCalc.title", { "name": speaker.alias }),
            content: contents,
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
                    let ATTACK = html.find('[name=attack]')[0];
                    let attack = ATTACK.checked;
                    let KNOCKOUT = html.find('[name=knockout]')[0];
                    let knockout = KNOCKOUT.checked;
                    let ALLOW = html.find('[name=nonlethal]')[0];
                    let allow = ALLOW.checked;
                    let WARD = html.find('[name=reduceward]')[0];
                    let ward = WARD?.checked ?? false;
                    let COND = html.find('[name=cond]')[0].value;
                    let conds = ""; if (COND.length > 0) conds = COND;
                    let SEND = html.find('[name=send]')[0];
                    let send = SEND.checked;

                    let statuses = await this.applyDamage(damage + (hurt ? addeddamage : 0) - soak, attack, knockout, allow, ward);
                    let conditions = splitStatString(conds);
                    if (conditions.length > 0) await this.addEffect(conditions);

                    if (send) {
                        Ironclaw2EActor.sendDamageToChat(statuses, speaker);
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
            Ironclaw2EActor.sendDamageToChat(statuses, speaker);
        }
    }

    /** Special condition adding popup */
    async popupAddCondition(readyname = "", readyquota = "") {
        let confirmed = false;
        let speaker = getMacroSpeaker(this);

        const templateData = {
            "actor": this,
            "readySelected": readyname || "focused",
            "readyQuota": readyquota || "",
            "systemConditions": getConditionSelectObject(),
            "translateLabel": game.ironclaw2e.useCUBConditions
        };
        const contents = await renderTemplate("systems/ironclaw2e/templates/popup/condition-popup.html", templateData);

        let dlog = new Dialog({
            title: game.i18n.format("ironclaw2e.dialog.addCondition.title", { "name": speaker.alias }),
            content: contents,
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
            render: html => { document.getElementById("condition").focus(); },
            close: async html => {
                if (confirmed) {
                    let QUOTA = html.find('[name=quota]')[0].value;
                    let quota = 0; if (QUOTA.length > 0) quota = parseInt(QUOTA);
                    let COND = html.find('[name=condition]')[0]?.value;
                    if (COND?.length > 0) {
                        await this.addEffect(COND);
                        if (quota > 0) await this.updateEffectQuota(COND, quota);
                    }
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
     * @param {Map<string,object>} [otherkeys] An array of keys, used to identify what gift each 'other dice' field came from, and whether the gift should be exhausted
     * @param {Map<string,number[]>} [otherdice] An array of dice arrays, with matching id's with the otherkeys iteration
     * @param {Map<string,string>} [othernames] An array of names for the fields, to be used for UI information
     * @param {string} [otherinputs] HTML string to add to the dialog
     * @param {string} [extradice] Default extra dice to use for the bottom one-line slot
     * @param {string} [otherlabel] Text to postpend to the label
     * @param successfunc Callback to execute after going through with the macro, will not execute if cancelled out
     * @param autocondition Callback to a condition auto-removal function, executed if the setting is on, will not execute if cancelled out
     * @returns {Promise<DiceReturn> | Promise<null>}
     */
    popupSelectRolled({ tnyes = false, tnnum = 3, prechecked = [], otherkeys = new Map(), otherdice = new Map(), othernames = new Map(), otherinputs = "", extradice = "", otherlabel = "" } = {}, successfunc = null, autocondition = null) {
        const data = this.data.data;
        let formconstruction = ``;
        let firstelement = "";
        const hastraits = data.hasOwnProperty("traits");
        const hasskills = data.hasOwnProperty("skills");
        const conditionRemoval = game.settings.get("ironclaw2e", "autoConditionRemoval");
        const giftUseToChat = game.settings.get("ironclaw2e", "sendGiftUseExhaustMessage");

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
        let labelNotice = "";
        if (otherlabel) {
            labelNotice = `<span class="normal-text">${game.i18n.format("ironclaw2e.dialog.dicePool.labelNotice", { "label": otherlabel })}</span><br>`;
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

        // Actual dialog handling
        let confirmed = false;
        let resolvedroll = new Promise((resolve) => {
            let rollreturn = null;
            let dlog = new Dialog({
                title: game.i18n.localize("ironclaw2e.dialog.dicePool.title"),
                content: `
     <form class="ironclaw2e">
     <h1>${game.i18n.format("ironclaw2e.dialog.dicePool.header", { "name": this.data.name })}</h1>
     ${labelNotice}
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
                render: html => {
                    if (tnyes)
                        document.getElementById("tn").focus();
                    else
                        document.getElementById("iftn").focus();
                },
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
                        let LIMIT = html.find('[name=limit]')[0].value?.trim();
                        let limit = 0;
                        // If there's something in the limit
                        if (LIMIT?.length > 0) {
                            const limitskill = makeCompareReady(LIMIT);
                            const limitdicepool = this._getDicePools([limitskill], [limitskill], isburdened).totalDice; // See if the actor can get any dice pools from the limit
                            const limitparsed = parseSingleDiceString(LIMIT); // Check if the limit field is a die, in which case, parse what value it's meant to limit to
                            const limitnumber = parseInt(LIMIT); // Just parse the limit as a number
                            // If the dice pool has stuff, use it as the limit, else use the parsed dice side, else try and use the parsed limit
                            if (Array.isArray(limitdicepool) && checkDiceArrayEmpty(limitdicepool)) limit = checkDiceArrayIndex(getDiceArrayMaxValue(limitdicepool));
                            else if (Array.isArray(limitparsed)) limit = checkDiceArrayIndex(limitparsed[1]);
                            else if (!isNaN(limitnumber)) limit = limitnumber;
                        }

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
                        if (otherkeys?.size > 0) {
                            for (let [key, info] of otherkeys.entries()) { // Check whether the listed bonus dice are checked into the roll, then add those to the roll
                                let OTHER = html.find(`[name=${key}]`);
                                let otherchecked = (OTHER.length > 0 ? OTHER[0].checked : false);
                                if (otherchecked) {
                                    totaldice = addArrays(totaldice, otherdice.get(key));
                                    if (labelgiven)
                                        label += " + ";
                                    label += othernames.get(key);
                                    labelgiven = true;

                                    // Check whether the item is a gift that should be exhausted
                                    if (info.itemId && info.exhaustOnUse) {
                                        const item = this.items.get(info.itemId);
                                        if (item?.type === 'gift') {
                                            await item.giftToggleExhaust("true", giftUseToChat);
                                        }
                                    }
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

                        if (IFTN) // Do and get the actual roll
                            rollreturn = await CardinalDiceRoller.rollTargetNumberArray(TN, totaldice, label, this);
                        else
                            rollreturn = await CardinalDiceRoller.rollHighestArray(totaldice, label, this);

                        if (successfunc && typeof (successfunc) == "function") {
                            successfunc(rollreturn); // Then do the special callback function of the roll if it is set
                        }

                        // The automated condition removal callback
                        if (conditionRemoval && autocondition && typeof (autocondition) == "function") {
                            autocondition(); // Automatic condition removal after a successful roll
                        }
                    }
                    resolve(rollreturn);
                }
            }, { width: 600 });
            dlog.render(true);
        });
        return resolvedroll;
    }

    /** Function to silently roll the given prechecked dice pools and extra dice, instead of popping a dialog for it
     * @param {boolean} [tnyes] Whether to use a TN, true for yes
     * @param {number} [tnnum] TN to use
     * @param {string[]} [prechecked] Traits and skills to roll
     * @param {Map<string,object>} [otherkeys] An array of keys, used to identify what gift each 'other dice' field came from, and whether the gift should be exhausted
     * @param {Map<string,number[]>} [otherdice] An array of dice arrays, with matching id's with the otherkeys iteration
     * @param {Map<string,string>} [othernames] An array of names for the fields, to be used for UI information
     * @param {Map<string,boolean>} [otherbools] An array of booleans that determine which modifiers should actually be used for quick rolls by default
     * @param {string} [extradice] Extra dice to roll
     * @param {string} [otherlabel] Text to postpend to the label
     * @param {boolean} [doubledice] Whether to roll the dice pool twice
     * @param successfunc Callback to execute after going through with the macro, executed unless an error happens
     * @param autocondition Callback to a condition auto-removal function, executed if the setting is on, executed unless an error happens
     * @returns {Promise<DiceReturn> | Promise<null>}
     */
    async silentSelectRolled({ tnyes = false, tnnum = 3, prechecked = [], otherkeys = new Map(), otherdice = new Map(), otherbools = new Map(), othernames = new Map(), extradice = "", otherlabel = "", doubledice = false } = {}, successfunc = null, autocondition = null) {
        const burdened = hasConditionsIronclaw("burdened", this);
        const conditionRemoval = game.settings.get("ironclaw2e", "autoConditionRemoval");
        // Get the total of all the dice pools
        const all = this._getAllDicePools(prechecked, burdened, otherkeys, otherdice, othernames, otherbools, extradice);

        // Set the label
        let label = all.label + (doubledice ? ", " + game.i18n.localize("ironclaw2e.chat.doubleDice") : "") + ".";
        // If it exists, set the separate label
        if (typeof (otherlabel) === 'string' && otherlabel.length > 0)
            label += `<p style="color:black">${otherlabel}</p>`;

        if (doubledice) { // See if the dicepool will be rolled twice (doubled dicepool), like in case of a Weak Soak
            totaldice = addArrays(totaldice, totaldice);
        }

        // Exhaust the gifts returned from the dice pools
        await Ironclaw2EItem.giftSetExhaustArray(all.giftsToExhaust, "true");

        let rollreturn = null;
        if (tnyes) // Do the actual roll, either TN or Highest based on tnyes
            rollreturn = await CardinalDiceRoller.rollTargetNumberArray(tnnum, all.totalDice, label, this);
        else
            rollreturn = await CardinalDiceRoller.rollHighestArray(all.totalDice, label, this);

        // The success callback function
        if (successfunc && typeof (successfunc) == "function") {
            successfunc(rollreturn);
        }

        // The condition callback function
        if (conditionRemoval && autocondition && typeof (autocondition) == "function") {
            autocondition();
        }

        return rollreturn;
    }
}

// Actual Hooks
Hooks.on("preCreateItem", Ironclaw2EActor.onActorPreCreateItem);