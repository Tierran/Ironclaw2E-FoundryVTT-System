/**
 * Unified function to get whether the target(s) has any of the select conditions for Ironclaw2e, right now here in case CUB is not installed
 * @param {String[] | String} conditions Conditions to check for
 * @param {(Actor[] | Token[] | Actor | Token)} target The actor(s) or token(s) in question
 * @param {boolean} warn Whether to use CUB's warnings
 * @returns {boolean} Whether the target has any of the conditions
 */
export function hasConditionsIronclaw(conditions, target, warn = false) {
    if (!game.ironclaw2e.useCUBConditions) {
        ui.notifications.info("Combat Utility Belt not installed, condition check failed.");
        return false;
    }

    return game.cub.hasCondition(conditions, target, { "warn": warn });
}

/**
 * Unified function to get all condition names the target has for Ironclaw2e, right now here in case CUB is not installed
 * @param {Actor | Token} target The actor or token in question
 * @param {boolean} warn Whether to use CUB's warnings
 * @returns {string[]} Array of conditions the target has
 */
export function getConditionNamesIronclaw(target, warn = false) {
    if (!game.ironclaw2e.useCUBConditions) {
        ui.notifications.info("Combat Utility Belt not installed, condition check failed.");
        return;
    }

    let raw = game.cub.getConditions(target, { "warn": warn });
    let names = [];

    if (raw?.conditions) {
        if (Array.isArray(raw.conditions)) {
            raw.conditions.forEach(x => names.push(x.name));
        }
        else {
            names.push(raw.conditions.name);
        }
    }

    return names;
}

/**
 * Unified function to get all conditions the target has for Ironclaw2e, right now here in case CUB is not installed
 * @param {Actor | Token} target The actor or token in question
 * @param {boolean} warn Whether to use CUB's warnings
 * @returns {Object[]} Array of conditions the target has
 */
export function getConditionsIronclaw(target, warn = false) {
    if (!game.ironclaw2e.useCUBConditions) {
        ui.notifications.info("Combat Utility Belt not installed, condition check failed.");
        return;
    }

    let raw = game.cub.getConditions(target, { "warn": warn });
    let conds = [];

    if (raw?.conditions) {
        if (Array.isArray(raw.conditions)) {
            raw.conditions.forEach(x => conds.push(x));
        }
        else {
            conds.push(raw.conditions);
        }
    }

    return conds;
}

/**
 * Unified function to add conditions for Ironclaw2e, right now here in case CUB is not installed
 * @param {String[] | String} conditions Conditions to add
 * @param {(Actor[] | Token[] | Actor | Token)} target The actor(s) or token(s) in question
 * @param {boolean} warn Whether to use CUB's warnings
 */
export async function addConditionsIronclaw(conditions, target, warn = false) {
    if (!game.ironclaw2e.useCUBConditions) {
        ui.notifications.info("Combat Utility Belt not installed, adding condition failed.");
        return;
    }

    return game.cub.addCondition(conditions, target, { "warn": warn });
}

/**
 * Unified function to remove conditions for Ironclaw2e, right now here in case CUB is not installed
 * @param {String[] | String} conditions Conditions to remove
 * @param {(Actor[] | Token[] | Actor | Token)} target The actor(s) or token(s) in question
 * @param {boolean} checkfirst First check if the target has any of the conditions
 * @param {boolean} warn Whether to use CUB's warnings
 */
export async function removeConditionsIronclaw(conditions, target, checkfirst = true, warn = false) {
    if (!game.ironclaw2e.useCUBConditions) {
        ui.notifications.info("Combat Utility Belt not installed, removing condition failed.");
        return;
    }

    if (checkfirst == false || (hasConditionsIronclaw(conditions, target)))
        return game.cub.removeCondition(conditions, target, { "warn": warn });
}

/**
 * Unified function to get a specific condition for Ironclaw2e, right now here in case CUB is not installed
 * @param {string | ActiveEffect} condition The name or the ActiveEffect of the condition
 * @param {boolean} warn Whether to use CUB's warnings
 * @returns {Object} Array of conditions the target have
 */
export function getConditionByNameIronclaw(condition, warn = false) {
    if (!game.ironclaw2e.useCUBConditions) {
        ui.notifications.info("Combat Utility Belt not installed, condition check failed.");
        return;
    }

    let name = condition?.label || condition;
    let raw = game.cub.getCondition(name, null, { "warn": warn });

    return raw;
}