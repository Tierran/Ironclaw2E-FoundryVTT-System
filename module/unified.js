/**
 * Unified function to get whether the target has any of the select conditions for Ironclaw2e, right now here in case CUB is not installed
 * @param {String[] | String} conditions Conditions to check for
 * @param {(Actor[] | Token[] | Actor | Token)} target The actor(s) or token(s) in question
 * @param {boolean} warn Whether to use CUB's warnings
 * @returns {boolean} Whether the target has any of the conditions
 */
export function hasConditionIronclaw(conditions, target, warn = false) {
    if (!game.cub) {
        ui.notifications.info("Combat Utility Belt not installed, condition check failed.");
        return false;
    }

    return game.cub.hasCondition(conditions, target, { "warn": warn });
}

/**
 * Unified function to add conditions for Ironclaw2e, right now here in case CUB is not installed
 * @param {String[] | String} conditions Conditions to add
 * @param {(Actor[] | Token[] | Actor | Token)} target The actor(s) or token(s) in question
 * @param {boolean} warn Whether to use CUB's warnings
 */
export async function addConditionIronclaw(conditions, target, warn = false) {
    if (!game.cub) {
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
export async function removeConditionIronclaw(conditions, target, checkfirst = true, warn = false) {
    if (!game.cub) {
        ui.notifications.info("Combat Utility Belt not installed, removing condition failed.");
        return;
    }

    if (checkfirst == false || (hasConditionIronclaw(conditions, target)))
        return game.cub.removeCondition(conditions, target, { "warn": warn });
}