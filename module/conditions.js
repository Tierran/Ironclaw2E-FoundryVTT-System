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

        return actor.data.effects.some(x => conditions.includes(x.data.flags?.core?.statusId));
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
        if (!actor) return false;

        actor.data.effects.forEach((value) => names.push(value.data.label));
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
        if (!actor) return false;

        actor.data.effects.forEach((value) => conds.push(value));
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
                cond = raw.find(x => usedname.includes(x?.data.label));
            }
            else {
                if (usedname.includes(raw?.data.label))
                    cond = raw;
            }
        }
    }
    else {
        let actor = getTargetActor(target);
        if (!actor) return false;

        cond = actor.data.effects.find((value) => value?.data.flags?.core?.statusId === name);
    }

    return cond ?? null;
}

/**
 * Unified function to add conditions for Ironclaw2E
 * @param {String[] | String} conditions Conditions to add
 * @param {(Actor | Token)} target The actor or token in question
 * @param {boolean} warn Whether to use CUB's warnings
 */
export async function addConditionsIronclaw(conditions, target, warn = false) {
    if (!game.ready) { // If the game isn't fully ready yet, wait until it is
        await game.ironclaw2e.waitUntilReady();
    }

    if (game.ironclaw2e.useCUBConditions) {
        let cubconditions = CommonConditionInfo.convertToCub(conditions);
        return game.cub.addCondition(cubconditions, target, { "warn": warn });
    }
    else {
        let actor = getTargetActor(target);
        if (!actor) return false;
        let usedconditions = Array.isArray(conditions) ? conditions : [conditions];
        if (hasConditionsIronclaw(conditions, target, warn)) {
            const existingeffects = getConditionsIronclaw(target, warn);
            usedconditions = usedconditions.filter(x => existingeffects.some(y => y.getFlag("core", "statusId") === x) == false);
        }
        const effects = prepareEffects(CommonConditionInfo.getMatchedConditions(usedconditions));
        if (effects.length > 0) {
            await actor.createEmbeddedDocuments("ActiveEffect", effects);
        }
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
            return game.cub.removeCondition(cubconditions, target, { "warn": warn });
        }
    }
    else {
        let actor = getTargetActor(target);
        if (!actor) return false;
        conditions = Array.isArray(conditions) ? conditions : [conditions];

        let removals = [];
        actor.data.effects.forEach((value) => { if (conditions.includes(value.getFlag("core", "statusId"))) removals.push(value.id); });
        if (removals.length > 0)
            await actor.deleteEmbeddedDocuments("ActiveEffect", removals);
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
    let name = iseffect ? condition?.data?.label : condition;

    if (game.ironclaw2e.useCUBConditions) {
        if (!iseffect) {
            name = CommonConditionInfo.convertToCub(makeCompareReady(name));
        }
        return game.cub.getCondition(name, null, { "warn": warn });
    } else {
        if (iseffect) {
            name = condition?.data?.flags?.core?.statusId || name;
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
    const usedcond = condition instanceof ActiveEffect ? condition.data : condition;
    if (game.ironclaw2e.useCUBConditions) {
        const tocheck = CommonConditionInfo.convertToCub(name);
        return tocheck.includes(usedcond?.label);
    } else {
        return usedcond?.flags?.core?.statusId === name;
    }
}

/**
 * Check whether the inputted condition should have a quota field
 * @param {ActiveEffectData | ActiveEffect} condition
 * @returns {boolean} Returns true if the quota field should be there
 */
export function checkConditionQuota(condition) {
    if (!condition) { // If nullable, just return false
        return false;
    }
    const usedcond = condition instanceof ActiveEffect ? condition.data : condition;
    if (game.ironclaw2e.useCUBConditions) {
        return CommonConditionInfo.quotaCubList.has(usedcond?.label);
    } else {
        return CommonConditionInfo.quotaList.has(usedcond?.flags?.core?.statusId);
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
    const usedcond = (typeof (condition) === "string" ? getSingleConditionIronclaw(condition, target) : condition)?.data;
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

function prepareEffects(effects) {
    let effectDatas = [];
    effects = Array.isArray(effects) ? effects : [effects];

    for (let effect of effects) {
        const createData = duplicate(effect);
        createData.label = game.i18n.localize(effect.label);
        createData["flags.core.statusId"] = effect.id;
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
    static conditionList = [{
        id: "focused",
        label: "ironclaw2e.effect.status.focused",
        icon: "icons/svg/upgrade.svg"
    },
    {
        id: "aiming",
        label: "ironclaw2e.effect.status.aiming",
        icon: "icons/svg/target.svg"
    },
    {
        id: "guarding",
        label: "ironclaw2e.effect.status.guarding",
        icon: "icons/svg/shield.svg"
    },
    {
        id: "reeling",
        label: "ironclaw2e.effect.status.reeling",
        icon: "icons/svg/daze.svg"
    },
    {
        id: "hurt",
        label: "ironclaw2e.effect.status.hurt",
        icon: "icons/svg/acid.svg"
    },
    {
        id: "afraid",
        label: "ironclaw2e.effect.status.afraid",
        icon: "systems/ironclaw2e/icons/status/afraid.svg"
    },
    {
        id: "injured",
        label: "ironclaw2e.effect.status.injured",
        icon: "icons/svg/blood.svg"
    },
    {
        id: "dying",
        label: "ironclaw2e.effect.status.dying",
        icon: "systems/ironclaw2e/icons/status/dying.svg"
    },
    {
        id: "dead",
        label: "ironclaw2e.effect.status.dead",
        icon: "icons/svg/skull.svg"
    },
    {
        id: "overkilled",
        label: "ironclaw2e.effect.status.overkilled",
        icon: "systems/ironclaw2e/icons/status/overkilled.svg"
    },
    {
        id: "asleep",
        label: "ironclaw2e.effect.status.asleep",
        icon: "icons/svg/sleep.svg"
    },
    {
        id: "unconscious",
        label: "ironclaw2e.effect.status.unconscious",
        icon: "icons/svg/unconscious.svg"
    },
    {
        id: "burdened",
        label: "ironclaw2e.effect.status.burdened",
        icon: "systems/ironclaw2e/icons/status/burdened.svg"
    },
    {
        id: "over-burdened",
        label: "ironclaw2e.effect.status.over-burdened",
        icon: "systems/ironclaw2e/icons/status/overburdened.svg"
    },
    {
        id: "cannotmove",
        label: "ironclaw2e.effect.status.cannotmove",
        icon: "systems/ironclaw2e/icons/status/cantmove.svg"
    },
    {
        id: "fatigued",
        label: "ironclaw2e.effect.status.fatigued",
        icon: "icons/svg/degen.svg"
    },
    {
        id: "sick",
        label: "ironclaw2e.effect.status.sick",
        icon: "icons/svg/poison.svg"
    },
    {
        id: "confused",
        label: "ironclaw2e.effect.status.confused",
        icon: "icons/svg/stoned.svg"
    },
    {
        id: "terrified",
        label: "ironclaw2e.effect.status.terrified",
        icon: "systems/ironclaw2e/icons/status/terrified.svg"
    },
    {
        id: "enraged",
        label: "ironclaw2e.effect.status.enraged",
        icon: "icons/svg/explosion.svg"
    },
    {
        id: "knockdown",
        label: "ironclaw2e.effect.status.knockdown",
        icon: "icons/svg/falling.svg"
    },
    {
        id: "berserk",
        label: "ironclaw2e.effect.status.berserk",
        icon: "icons/svg/hazard.svg"
    },
    {
        id: "blinded",
        label: "ironclaw2e.effect.status.blinded",
        icon: "icons/svg/blind.svg"
    },
    {
        id: "silenced",
        label: "ironclaw2e.effect.status.silenced",
        icon: "icons/svg/silenced.svg"
    },
    {
        id: "fulltilt",
        label: "ironclaw2e.effect.status.fulltilt",
        icon: "icons/svg/up.svg"
    },
    {
        id: "slowed",
        label: "ironclaw2e.effect.status.slowed",
        icon: "icons/svg/down.svg"
    },
    {
        id: "immobilized",
        label: "ironclaw2e.effect.status.immobilized",
        icon: "icons/svg/mountain.svg"
    },
    {
        id: "half-buried",
        label: "ironclaw2e.effect.status.half-buried",
        icon: "icons/svg/ruins.svg"
    },
    {
        id: "onfire",
        label: "ironclaw2e.effect.status.onfire",
        icon: "icons/svg/fire.svg"
    },
    {
        id: "mesmerized",
        label: "ironclaw2e.effect.status.mesmerized",
        icon: "icons/svg/sun.svg"
    },
    {
        id: "marionette",
        label: "ironclaw2e.effect.status.marionette",
        icon: "icons/svg/paralysis.svg"
    },
    {
        id: "controlled",
        label: "ironclaw2e.effect.status.controlled",
        icon: "icons/svg/statue.svg"
    },
    {
        id: "allfours",
        label: "ironclaw2e.effect.status.allfours",
        icon: "icons/svg/pawprint.svg"
    },
    {
        id: "flying",
        label: "ironclaw2e.effect.status.flying",
        icon: "icons/svg/wing.svg"
    },
    {
        id: "grappled",
        label: "ironclaw2e.effect.status.grappled",
        icon: "icons/svg/net.svg"
    },
    {
        id: "hiding",
        label: "ironclaw2e.effect.status.hiding",
        icon: "icons/svg/mystery-man.svg"
    },
    {
        id: "temporaryward",
        label: "ironclaw2e.effect.status.temporaryward",
        icon: "icons/svg/aura.svg"
    },
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
    ["allfours", "All Fours"], ["flying", "Flying"], ["grappled", "Grappled"], ["hiding", "Hiding"], ["temporaryward", "Temporary Ward"], ["misc-a", "Misc-A"], ["misc-b", "Misc-B"], ["misc-c", "Misc-C"],
    ["misc-d", "Misc-D"], ["misc-e", "Misc-E"], ["misc-f", "Misc-F"], ["misc-g", "Misc-G"]]);

    /**
     * Set of conditions that should have a quota field
     */
    static quotaList = new Set(["injured", "sick", "temporaryward"]);

    /**
     * Set of CUB condition names that should have a quota field
     */
    static quotaCubList = new Set(["Injured", "Sick", "Temporary Ward"]);

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