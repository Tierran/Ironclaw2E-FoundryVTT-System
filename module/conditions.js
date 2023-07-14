import { makeCompareReady } from "./helpers.js";

/**
 * Unified function to get whether the target has any of the select conditions for Ironclaw2E
 * @param {String[] | String} conditions Conditions to check for, make sure they are comparison-ready
 * @param {(Actor | Token)} target The actor or token in question
 * @param {boolean} warn Whether to use CUB's warnings
 * @returns {boolean} Whether the target has any of the conditions
 */
export function hasConditionsIronclaw(conditions, target, warn = false) {
    if (!conditions || !target) {
        console.warn("hasConditionsIronclaw was given empty conditions or target: " + conditions.toString() + " " + target.toString());
        return false;
    }

    if (game.ironclaw2e.useCUBConditions) {
        let cubconditions = CommonConditionInfo.convertToCub(conditions);
        return game.cub.hasCondition(cubconditions, target, { "warn": warn });
    }
    else {
        let actor = getTargetActor(target);
        if (!actor) return false;
        conditions = Array.isArray(conditions) ? conditions : [conditions];

        return actor.effects.some(x => conditions.includes(makeCompareReady(x.name)));
    }
}

/**
 * Unified function to get all condition names the target has for Ironclaw2E
 * @param {Actor | Token} target The actor or token in question
 * @param {boolean} warn Whether to use CUB's warnings
 * @returns {string[]} Array of conditions the target has
 */
export function getConditionNamesIronclaw(target, warn = false) {
    let names = [];

    if (game.ironclaw2e.useCUBConditions) {
        let raw = game.cub.getConditions(target, { "warn": warn });
        if (raw?.conditions) {
            if (Array.isArray(raw.conditions)) {
                raw.conditions.forEach(x => names.push(x.name));
            }
            else {
                names.push(raw.conditions.name);
            }
        }
    }
    else {
        let actor = getTargetActor(target);
        if (!actor) return [];

        actor.effects.forEach((value) => names.push(value.name));
    }

    return names;
}

/**
 * Unified function to get all conditions the target has for Ironclaw2E
 * @param {Actor | Token} target The actor or token in question
 * @param {boolean} warn Whether to use CUB's warnings
 * @returns {Object[]} Array of conditions the target has
 */
export function getConditionsIronclaw(target, warn = false) {
    let conds = [];

    if (game.ironclaw2e.useCUBConditions) {
        let raw = game.cub.getConditionEffects(target, { "warn": warn });
        if (raw) {
            if (Array.isArray(raw)) {
                raw.forEach(x => conds.push(x));
            }
            else {
                conds.push(raw);
            }
        }
    }
    else {
        let actor = getTargetActor(target);
        if (!actor) return null;

        actor.effects.forEach((value) => conds.push(value));
    }

    return conds;
}

/**
 * Unified function to get a single condition the target has for Ironclaw2E
 * @param {string} name The name of the condition to get
 * @param {Actor | Token} target The actor or token in question
 * @param {boolean} warn Whether to use CUB's warnings
 * @returns {Object | null} The asked condition, or null if the asked condition does not exist in the actor
 */
export function getSingleConditionIronclaw(name, target, warn = false) {
    let cond = null;

    if (game.ironclaw2e.useCUBConditions) {
        let raw = game.cub.getConditionEffects(target, { "warn": warn });
        const usedname = CommonConditionInfo.convertToCub(name);
        if (raw) {
            if (Array.isArray(raw)) {
                cond = raw.find(x => usedname.includes(x?.name));
            }
            else {
                if (usedname.includes(raw?.name))
                    cond = raw;
            }
        }
    }
    else {
        let actor = getTargetActor(target);
        if (!actor) return null;

        cond = actor.effects.find((value) => makeCompareReady(value?.name) === name);
    }

    return cond ?? null;
}

/**
 * Unified function to add conditions for Ironclaw2E
 * @param {String[] | String} conditions Conditions to add
 * @param {(Actor | Token)} target The actor or token in question
 * @param {boolean} warn Whether to use CUB's warnings
 * @returns {Promise<Array>}
 */
export async function addConditionsIronclaw(conditions, target, warn = false) {
    if (!game.ready) { // If the game isn't fully ready yet, wait until it is
        await game.ironclaw2e.waitUntilReady();
    }

    if (game.ironclaw2e.useCUBConditions) {
        let cubconditions = CommonConditionInfo.convertToCub(conditions);
        return await game.cub.addCondition(cubconditions, target, { "warn": warn });
    }
    else {
        let actor = getTargetActor(target);
        if (!actor) return;
        let usedconditions = Array.isArray(conditions) ? conditions : [conditions];
        // Get rid of duplicate conditions
        if (hasConditionsIronclaw(conditions, target, warn)) {
            const existingeffects = getConditionsIronclaw(target, warn);
            usedconditions = usedconditions.filter(x => existingeffects.some(y => makeCompareReady(y.name) === x) === false);
        }
        const effects = prepareEffects(CommonConditionInfo.getMatchedConditions(usedconditions));
        if (effects.length > 0) {
            return await actor.createEmbeddedDocuments("ActiveEffect", effects);
        }
        return [];
    }
}

/**
 * Unified function to remove conditions for Ironclaw2E
 * @param {String[] | String} conditions Conditions to remove
 * @param {(Actor | Token)} target The actor or token in question
 * @param {boolean} checkfirst First check if the target has any of the conditions
 * @param {boolean} warn Whether to use CUB's warnings
 */
export async function removeConditionsIronclaw(conditions, target, checkfirst = true, warn = false) {
    if (!game.ready) { // If the game isn't fully ready yet, wait until it is
        await game.ironclaw2e.waitUntilReady();
    }

    if (game.ironclaw2e.useCUBConditions) {
        if (checkfirst === false || (hasConditionsIronclaw(conditions, target))) {
            let cubconditions = CommonConditionInfo.convertToCub(conditions);
            return await game.cub.removeCondition(cubconditions, target, { "warn": warn });
        }
    }
    else {
        let actor = getTargetActor(target);
        if (!actor) return;
        conditions = Array.isArray(conditions) ? conditions : [conditions];

        let removals = [];
        actor.effects.forEach((value) => { if (conditions.includes(makeCompareReady(value.name))) removals.push(value.id); });
        if (removals.length > 0)
            return await actor.deleteEmbeddedDocuments("ActiveEffect", removals);
    }
}

/**
 * Unified function to get the base condition for Ironclaw2E
 * @param {string | ActiveEffect} condition The name or the ActiveEffect of the condition
 * @param {boolean} warn Whether to use CUB's warnings
 * @returns {Object} The base condition
 */
export function getBaseConditionIronclaw(condition, warn = false) {
    const iseffect = condition instanceof ActiveEffect;
    let name = iseffect ? condition?.name : condition;

    if (game.ironclaw2e.useCUBConditions) {
        if (!iseffect) {
            name = CommonConditionInfo.convertToCub(makeCompareReady(name));
        }
        return game.cub.getCondition(name, null, { "warn": warn });
    } else {
        if (iseffect) {
            name = makeCompareReady(condition?.name || name);
        } else {
            name = makeCompareReady(name);
        }
        let cond = CommonConditionInfo.getMatchedConditions(name);
        return cond.length > 0 ? cond.shift() : null;
    }
}

/**
 * Unified function to check whether the given condition matches the given name
 * @param {ActiveEffectData | ActiveEffect} condition
 * @param {string} name The name to check for
 * @param {boolean} warn Whether to use CUB's warnings
 * @returns {boolean} Returns true if the effect matches
 */
export function checkConditionIronclaw(condition, name, warn = false) {
    const usedcond = condition;
    if (game.ironclaw2e.useCUBConditions) {
        const tocheck = CommonConditionInfo.convertToCub(name);
        return tocheck.includes(usedcond?.name);
    } else {
        return makeCompareReady(usedcond?.name) === name;
    }
}

/**
 * Check if the target is defeated
 * @param {Actor | Token} target
 * @returns {boolean} Returns true if the actor has a defeat condition
 */
export function checkIfDefeatedIronclaw(target) {

    if (game.ironclaw2e.useCUBConditions) {
        let raw = game.cub.getConditionEffects(target, { "warn": false });
        if (raw) {
            if (Array.isArray(raw)) {
                return raw.some(x => CommonConditionInfo.defeatedCubList.has(x?.name));
            }
            else {
                return CommonConditionInfo.defeatedCubList.has(raw?.name);
            }
        }
    }
    else {
        let actor = getTargetActor(target);
        if (!actor) return false;

        return actor.effects.some((value) => CommonConditionInfo.defeatedList.has(makeCompareReady(value?.name)));
    }

    return false;
}

/**
 * Check if the target gives others combat advantage
 * @param {Actor | Token} target
 * @returns {boolean} Returns true if the actor would give combat advantage
 */
export function checkIfDisadvantagedIronclaw(target) {

    if (game.ironclaw2e.useCUBConditions) {
        let raw = game.cub.getConditionEffects(target, { "warn": false });
        if (raw) {
            if (Array.isArray(raw)) {
                return raw.some(x => CommonConditionInfo.combatAdvantageCubList.has(x?.name));
            }
            else {
                return CommonConditionInfo.combatAdvantageCubList.has(raw?.name);
            }
        }
    }
    else {
        let actor = getTargetActor(target);
        if (!actor) return false;

        return actor.effects.some((value) => CommonConditionInfo.combatAdvantageList.has(makeCompareReady(value?.name)));
    }

    return false;
}

/**
 * Check whether the inputted condition should have a quota field
 * @param {ActiveEffectData | ActiveEffect | string} condition
 * @returns {boolean} Returns true if the quota field should be there
 */
export function checkConditionQuota(condition) {
    if (!condition) { // If nullable, just return false
        return false;
    }
    if (typeof (condition) === "string") {
        return CommonConditionInfo.quotaList.has(condition);
    }
    const usedcond = condition;
    if (game.ironclaw2e.useCUBConditions) {
        return CommonConditionInfo.quotaCubList.has(usedcond?.name);
    } else {
        return CommonConditionInfo.quotaList.has(makeCompareReady(usedcond?.name));
    }
}

/**
 * Get the current quota from a condition
 * @param {ActiveEffect | string} condition The condition or the name of the condition to get the quota for
 * @param {Actor | Token} target The target to get the condition from
 * @returns {number} Returns the current quota, or -1 if nothing found
 */
export function getTargetConditionQuota(condition, target) {
    if (typeof (condition) === "string") {
        if (!CommonConditionInfo.quotaList.has(condition)) {
            console.error("getTargetConditionQuota was asked to get the quota of a condition that has no quota: " + condition);
            return -1;
        }
    } else {
        if (!checkConditionQuota(condition)) {
            console.error("getTargetConditionQuota was asked to get the quota of a condition that has no quota: " + condition);
            return -1;
        }
    }

    // Get the used condition from either the name or the given condition
    const usedcond = (typeof (condition) === "string" ? getSingleConditionIronclaw(condition, target) : condition);
    if (usedcond) {
        return usedcond?.flags?.ironclaw2e?.quota ?? 0;
    }

    return -1;
}

/**
 * Set the current quota on a condition
 * @param {ActiveEffect} condition The condition which quota to update
 * @param {number} value The value to update the quota to
 */
export async function setTargetConditionQuota(condition, value) {
    if (!checkConditionQuota(condition)) {
        console.error("setTargetConditionQuota was asked to set the quota of a condition that has no quota: " + condition);
        return;
    }

    const inputvalue = Math.max(value, 0); // Clamp the input to zero and above
    return await condition.update({ "_id": condition.id, "flags.ironclaw2e.quota": inputvalue });
}

/**
 * Function to generate a Map for a select HTML element
 */
export function getConditionSelectObject() {
    let condMap = new Map();
    for (let fig of CommonConditionInfo.conditionList) {
        condMap[fig.id] = fig.label;
    }
    return condMap;
}

/* -------------------------------------------- */
/*  Condition Helpers                           */
/* -------------------------------------------- */

/**
 * Grab the actor instance from the given target
 * @param {Actor | Token} target
 * @returns {Actor | null}
 */
function getTargetActor(target) {
    return (target instanceof Actor ? target : (target instanceof Token ? target.actor : null));
}

/**
 * Make sure the effect data is given to Foundry's systems in the correct form
 * @param {any} effects
 * @returns {Array}
 */
function prepareEffects(effects) {
    let effectDatas = [];
    effects = Array.isArray(effects) ? effects : [effects];

    for (let effect of effects) {
        const createData = duplicate(effect);
        createData.name = game.i18n.localize(effect.label);
        createData.statuses = [effect.id];
        delete createData.id;
        effectDatas.push(createData);
    }

    return effectDatas;
}

/* -------------------------------------------- */
/*  Condition Static Information                */
/* -------------------------------------------- */

/** Common class for unified condition name referencing */
export class CommonConditionInfo {
    /**
     * List of conditions used to replace Foundry defaults for Ironclaw2E system
     * Condition id's are all in comparison-ready format, all lowercase and spaces removed
     */
    static conditionList = [
        // Personal-scale
        {
            id: "focused",
            label: "ironclaw2e.effect.status.focused",
            icon: "icons/svg/upgrade.svg",
            actorType: "personal"
        },
        {
            id: "aiming",
            label: "ironclaw2e.effect.status.aiming",
            icon: "icons/svg/target.svg",
            actorType: "personal"
        },
        {
            id: "guarding",
            label: "ironclaw2e.effect.status.guarding",
            icon: "icons/svg/shield.svg",
            actorType: "personal"
        },
        {
            id: "reeling",
            label: "ironclaw2e.effect.status.reeling",
            icon: "icons/svg/daze.svg",
            actorType: "personal"
        },
        {
            id: "hurt",
            label: "ironclaw2e.effect.status.hurt",
            icon: "icons/svg/acid.svg",
            actorType: "personal"
        },
        {
            id: "afraid",
            label: "ironclaw2e.effect.status.afraid",
            icon: "systems/ironclaw2e/icons/status/afraid.svg",
            actorType: "personal"
        },
        {
            id: "injured",
            label: "ironclaw2e.effect.status.injured",
            icon: "icons/svg/blood.svg",
            actorType: "personal"
        },
        {
            id: "dying",
            label: "ironclaw2e.effect.status.dying",
            icon: "systems/ironclaw2e/icons/status/dying.svg",
            actorType: "personal"
        },
        {
            id: "dead",
            label: "ironclaw2e.effect.status.dead",
            icon: "icons/svg/skull.svg"
            // Intentionally missing actorType
        },
        {
            id: "overkilled",
            label: "ironclaw2e.effect.status.overkilled",
            icon: "systems/ironclaw2e/icons/status/overkilled.svg",
            actorType: "personal"
        },
        {
            id: "asleep",
            label: "ironclaw2e.effect.status.asleep",
            icon: "icons/svg/sleep.svg",
            actorType: "personal"
        },
        {
            id: "unconscious",
            label: "ironclaw2e.effect.status.unconscious",
            icon: "icons/svg/unconscious.svg",
            actorType: "personal"
        },
        {
            id: "burdened",
            label: "ironclaw2e.effect.status.burdened",
            icon: "systems/ironclaw2e/icons/status/burdened.svg",
            actorType: "personal"
        },
        {
            id: "over-burdened",
            label: "ironclaw2e.effect.status.over-burdened",
            icon: "systems/ironclaw2e/icons/status/overburdened.svg",
            actorType: "personal"
        },
        {
            id: "cannotmove",
            label: "ironclaw2e.effect.status.cannotmove",
            icon: "systems/ironclaw2e/icons/status/cantmove.svg",
            actorType: "personal"
        },
        {
            id: "fatigued",
            label: "ironclaw2e.effect.status.fatigued",
            icon: "icons/svg/degen.svg",
            actorType: "personal"
        },
        {
            id: "sick",
            label: "ironclaw2e.effect.status.sick",
            icon: "icons/svg/poison.svg",
            actorType: "personal"
        },
        {
            id: "confused",
            label: "ironclaw2e.effect.status.confused",
            icon: "icons/svg/stoned.svg",
            actorType: "personal"
        },
        {
            id: "terrified",
            label: "ironclaw2e.effect.status.terrified",
            icon: "systems/ironclaw2e/icons/status/terrified.svg",
            actorType: "personal"
        },
        {
            id: "enraged",
            label: "ironclaw2e.effect.status.enraged",
            icon: "icons/svg/explosion.svg",
            actorType: "personal"
        },
        {
            id: "knockdown",
            label: "ironclaw2e.effect.status.knockdown",
            icon: "icons/svg/falling.svg",
            actorType: "personal"
        },
        {
            id: "berserk",
            label: "ironclaw2e.effect.status.berserk",
            icon: "icons/svg/hazard.svg",
            actorType: "personal"
        },
        {
            id: "blinded",
            label: "ironclaw2e.effect.status.blinded",
            icon: "icons/svg/blind.svg",
            actorType: "personal"
        },
        {
            id: "silenced",
            label: "ironclaw2e.effect.status.silenced",
            icon: "icons/svg/silenced.svg",
            actorType: "personal"
        },
        {
            id: "fulltilt",
            label: "ironclaw2e.effect.status.fulltilt",
            icon: "icons/svg/up.svg",
            actorType: "personal"
        },
        {
            id: "slowed",
            label: "ironclaw2e.effect.status.slowed",
            icon: "icons/svg/down.svg",
            actorType: "personal"
        },
        {
            id: "immobilized",
            label: "ironclaw2e.effect.status.immobilized",
            icon: "icons/svg/mountain.svg",
            actorType: "personal"
        },
        {
            id: "half-buried",
            label: "ironclaw2e.effect.status.half-buried",
            icon: "icons/svg/ruins.svg",
            actorType: "personal"
        },
        {
            id: "onfire",
            label: "ironclaw2e.effect.status.onfire",
            icon: "icons/svg/fire.svg",
            actorType: "personal"
        },
        {
            id: "mesmerized",
            label: "ironclaw2e.effect.status.mesmerized",
            icon: "icons/svg/sun.svg",
            actorType: "personal"
        },
        {
            id: "marionette",
            label: "ironclaw2e.effect.status.marionette",
            icon: "icons/svg/paralysis.svg",
            actorType: "personal"
        },
        {
            id: "controlled",
            label: "ironclaw2e.effect.status.controlled",
            icon: "icons/svg/statue.svg",
            actorType: "personal"
        },
        {
            id: "allfours",
            label: "ironclaw2e.effect.status.allfours",
            icon: "icons/svg/pawprint.svg",
            actorType: "personal"
        },
        {
            id: "flying",
            label: "ironclaw2e.effect.status.flying",
            icon: "icons/svg/wing.svg",
            actorType: "personal"
        },
        {
            id: "grappled",
            label: "ironclaw2e.effect.status.grappled",
            icon: "icons/svg/net.svg",
            actorType: "personal"
        },
        {
            id: "hiding",
            label: "ironclaw2e.effect.status.hiding",
            icon: "icons/svg/mystery-man.svg",
            actorType: "personal"
        },
        {
            id: "temporaryward",
            label: "ironclaw2e.effect.status.temporaryward",
            icon: "icons/svg/aura.svg",
            actorType: "personal"
        },

        // Vehicle-scale
        {
            id: "holed",
            label: "ironclaw2e.effect.status.holed",
            icon: "systems/ironclaw2e/icons/status/holed.svg",
            actorType: "vehicle"
        },
        {
            id: "swamped",
            label: "ironclaw2e.effect.status.swamped",
            icon: "systems/ironclaw2e/icons/status/swamped.svg",
            actorType: "vehicle"
        },
        {
            id: "sinking",
            label: "ironclaw2e.effect.status.sinking",
            icon: "systems/ironclaw2e/icons/status/sinking.svg",
            actorType: "vehicle"
        },
        {
            id: "listing",
            label: "ironclaw2e.effect.status.listing",
            icon: "systems/ironclaw2e/icons/status/listing.svg",
            actorType: "vehicle"
        },
        {
            id: "capsized",
            label: "ironclaw2e.effect.status.capsized",
            icon: "systems/ironclaw2e/icons/status/capsized.svg",
            actorType: "vehicle"
        },
        {
            id: "burning",
            label: "ironclaw2e.effect.status.burning",
            icon: "systems/ironclaw2e/icons/status/burning.svg",
            actorType: "vehicle"
        },
        {
            id: "run-aground",
            label: "ironclaw2e.effect.status.run-aground",
            icon: "systems/ironclaw2e/icons/status/run-aground.svg",
            actorType: "vehicle"
        },
        {
            id: "haunted",
            label: "ironclaw2e.effect.status.haunted",
            icon: "systems/ironclaw2e/icons/status/haunted.svg",
            actorType: "vehicle"
        },

        // Miscs
        {
            id: "misc-a",
            label: "ironclaw2e.effect.status.misc-a",
            icon: "icons/svg/eye.svg"
        },
        {
            id: "misc-b",
            label: "ironclaw2e.effect.status.misc-b",
            icon: "icons/svg/clockwork.svg"
        },
        {
            id: "misc-c",
            label: "ironclaw2e.effect.status.misc-c",
            icon: "icons/svg/castle.svg"
        },
        {
            id: "misc-d",
            label: "ironclaw2e.effect.status.misc-d",
            icon: "icons/svg/book.svg"
        },
        {
            id: "misc-e",
            label: "ironclaw2e.effect.status.misc-e",
            icon: "icons/svg/coins.svg"
        },
        {
            id: "misc-f",
            label: "ironclaw2e.effect.status.misc-f",
            icon: "icons/svg/sound.svg"
        },
        {
            id: "misc-g",
            label: "ironclaw2e.effect.status.misc-g",
            icon: "icons/svg/tower-flag.svg"
        }];

    /**
     * Map of standard names and their proper names in the CUB-provided condition-map
     */
    static cubList = new Map([["focused", "Focused"], ["aiming", "Aiming"], ["guarding", "Guarding"], ["reeling", "Reeling"], ["hurt", "Hurt"], ["afraid", "Afraid"],
    ["injured", "Injured"], ["dying", "Dying"], ["dead", "Dead"], ["overkilled", "Overkilled"], ["asleep", "Asleep"], ["unconscious", "Unconscious"],
    ["burdened", "Burdened"], ["over-burdened", "Over-Burdened"], ["cannotmove", "Cannot Move"], ["fatigued", "Fatigued"], ["sick", "Sick"],
    ["confused", "Confused"], ["terrified", "Terrified"], ["enraged", "Enraged"], ["knockdown", "Knockdown"], ["berserk", "Berserk"],
    ["blinded", "Blinded"], ["silenced", "Silenced"], ["fulltilt", "Full Tilt"], ["slowed", "Slowed"], ["immobilized", "Immobilized"],
    ["half-buried", "Half-Buried"], ["onfire", "On Fire"], ["mesmerized", "Mesmerized"], ["marionette", "Marionette"], ["controlled", "Controlled"],
    ["allfours", "All Fours"], ["flying", "Flying"], ["grappled", "Grappled"], ["hiding", "Hiding"], ["temporaryward", "Temporary Ward"],

    ["holed", "Holed"], ["swamped", "Swamped"], ["sinking", "Sinking"], ["listing", "Listing"], ["capsized", "Capsized  "], ["burning", "Burning"],
    ["run-aground", "Run-Aground"], ["haunted", "Haunted"],

    ["misc-a", "Misc-A"], ["misc-b", "Misc-B"], ["misc-c", "Misc-C"],
    ["misc-d", "Misc-D"], ["misc-e", "Misc-E"], ["misc-f", "Misc-F"], ["misc-g", "Misc-G"]]);

    /**
     * Set of conditions that should have a quota field
     */
    static quotaList = new Set(["injured", "sick", "temporaryward", "burning"]);

    /**
     * Set of CUB condition names that should have a quota field
     */
    static quotaCubList = new Set();

    /**
     * Set of conditions that mark the combatant as defeated
     */
    static defeatedList = new Set(["dying", "dead", "overkilled", "asleep", "unconscious", "wrecked"]);

    /**
     * Set of CUB conditions that mark the combatant as defeated
     */
    static defeatedCubList = new Set();

    /**
     * Set of conditions that give attackers combat advantage against the character
     */
    static combatAdvantageList = new Set(["reeling", "blinded", "knockdown", "slowed", "half-buried", "immobilized", "confused", "mesmerized", "onfire"]);

    /**
     * Set of CUB conditions that give attackers combat advantage against the character
     */
    static combatAdvantageCubList = new Set();


    /**
     * Prepare the Combat Utility Belt side sets for checking things
     */
    static prepareCUBLists() {
        this.quotaCubList = new Set(this.convertToCub(Array.from(this.quotaList)));
        this.defeatedCubList = new Set(this.convertToCub(Array.from(this.defeatedList)));
        this.combatAdvantageCubList = new Set(this.convertToCub(Array.from(this.combatAdvantageList)));
    }

    /**
     * Convert a single or a list of conditions from id's into CUB condition names
     * @param {string | string[]} conditions
     * @returns {string[]}
     */
    static convertToCub(conditions) {
        let cubconditions = [];
        if (Array.isArray(conditions)) {
            conditions.forEach(cond => {
                if (this.cubList.has(cond))
                    cubconditions.push(this.cubList.get(cond));
            });
        }
        else {
            if (this.cubList.has(conditions))
                cubconditions.push(this.cubList.get(conditions));
        }
        return cubconditions;
    }

    /**
     * Get the condition or all conditions from the list
     * @param {string | string[]} conditions The condition or array of conditions to get
     * @returns {Array}
     */
    static getMatchedConditions(conditions) {
        let matches = [];
        if (Array.isArray(conditions)) {
            matches = this.conditionList.filter(cond => conditions.includes(cond.id));
        } else {
            const foo = this.conditionList.find(cond => cond.id == conditions);
            if (foo) matches.push(foo);
        }
        return matches;
    }

    /**
     * Returns the translation identifier for a given condition
     * @param {string} condition
     * @returns {string}
     */
    static getConditionLabel(condition) {
        return this.conditionList.find(cond => cond.id == condition)?.label;
    }

    /**
     * Returns the translation for a given condition
     * @param {string} condition
     * @returns {string}
     */
    static getConditionTranslated(condition) {
        return game.i18n.localize(this.conditionList.find(cond => cond.id == condition)?.label);
    }
}