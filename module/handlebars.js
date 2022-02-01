import { makeCompareReady } from "./helpers.js";
import { checkConditionIronclaw, checkConditionQuota, hasConditionsIronclaw } from "./conditions.js";

/** Handlebars helper registration */
export function registerHandlebarsHelpers() {
    Handlebars.registerHelper('concat', function () {
        var outStr = '';
        for (var arg in arguments) {
            if (typeof arguments[arg] != 'object') {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });

    Handlebars.registerHelper('toLowerCase', function (str) {
        return str.toLowerCase();
    });

    Handlebars.registerHelper('equalOrNothing', function (str, compare) {
        return str.length == 0 || makeCompareReady(str) == compare;
    });

    Handlebars.registerHelper('valueRoundTo', function (val, roundto) {
        return isNaN(val) ? "NaN" : val.toFixed(roundto);
    });

    Handlebars.registerHelper('usableGift', function (gift) {
        return gift.data.exhaustWhenUsed || gift.data.useDice?.length > 0;
    });

    Handlebars.registerHelper('propertyExists', function (thing, str) {
        return (str in thing);
    });

    Handlebars.registerHelper('isCombatantNoInit', function (actorid) {
        // True if lacking an init, false if has an init or is not a combatant
        const foo = game.combat?.getCombatantByActor(actorid);
        if (!foo) return false;
        return foo.initiative == null;
    });

    Handlebars.registerHelper('typeCheck', function (foo, bar) {
        return foo == bar;
    });

    Handlebars.registerHelper('conditionCheck', function (cond, name) {
        return checkConditionIronclaw(cond, name);
    });

    Handlebars.registerHelper('conditionQuotaCheck', function (cond) {
        return checkConditionQuota(cond);
    });
}