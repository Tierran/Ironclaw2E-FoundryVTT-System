import { findTotalDice } from "../helpers.js";
import { addArrays } from "../helpers.js";
import { makeStatCompareReady } from "../helpers.js";
import { reformDiceString } from "../helpers.js";
import { convertCamelCase } from "../helpers.js";
import { getMacroSpeaker } from "../helpers.js";
import { findActorToken } from "../helpers.js";
import { findInItems } from "../helpers.js";
import { checkForPrechecked } from "../helpers.js";
import { nullCheckConcat } from "../helpers.js";
import { parseSingleDiceString } from "../helpers.js";
import { checkDiceArrayIndex } from "../helpers.js";
import { formRoll } from "../dicerollers.js";
// For condition management
import { hasConditionsIronclaw } from "../unified.js";
import { getConditionNamesIronclaw } from "../unified.js";
import { addConditionsIronclaw } from "../unified.js";
import { removeConditionsIronclaw } from "../unified.js";
// The rest are for the supermassive function
import { rollTargetNumber } from "../dicerollers.js";
import { rollHighest } from "../dicerollers.js";
import { enforceLimit } from "../helpers.js";
import { burdenedLimitedStat } from "../helpers.js";

/**
 * Extend the base Actor entity by defining a custom data necessary for the Ironclaw system
 * @extends {Actor}
 */
export class Ironclaw2EActor extends Actor {

    /**
     * Augment the basic actor data with additional dynamic data.
     */
    prepareData() {
        super.prepareData();

        const actorData = this.data;
        const data = actorData.data;
        const flags = actorData.flags;

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
        const data = actorData.data;

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
        const data = actorData.data;

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
        const data = actorData.data;

        this._processTraits(actorData);
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
        }

        data.traits.species.skills = [makeStatCompareReady(data.traits.species.speciesSkill1), makeStatCompareReady(data.traits.species.speciesSkill2), makeStatCompareReady(data.traits.species.speciesSkill3)];
        data.traits.career.skills = [makeStatCompareReady(data.traits.career.careerSkill1), makeStatCompareReady(data.traits.career.careerSkill2), makeStatCompareReady(data.traits.career.careerSkill3)];

        // Extra Career additions
        const extraCareers = this.items.filter(element => element.data.type === 'extraCareer');
        extraCareers.sort((a, b) => a.data.sort - b.data.sort);
        if (extraCareers.length > 0) {
            data.hasExtraCareers = true;
            let ids = [];
            extraCareers.forEach(x => ids.push(x.data._id));
            data.extraCareerIds = ids;
        }
        else
            data.hasExtraCareers = false;
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
            if (skill.marks > 0) {
                let d12s = Math.floor(skill.marks / 5);
                let remainder = skill.marks % 5;
                skill.diceArray[0] += d12s;
                if (remainder > 0) {
                    skill.diceArray[5 - remainder] += 1;
                }
            }
            const comparekey = makeStatCompareReady(key);
            if (data.traits.species.skills.includes(comparekey)) {
                skill.diceArray = addArrays(skill.diceArray, data.traits.species.diceArray);
            }
            if (data.traits.career.skills.includes(comparekey)) {
                skill.diceArray = addArrays(skill.diceArray, data.traits.career.diceArray);
            }

            if (data.hasExtraCareers) {
                extracareers.forEach(element => {
                    if (element.data.data.skills.includes(comparekey)) {
                        skill.diceArray = addArrays(skill.diceArray, element.data.data.diceArray);
                    }
                });
            }
        }
    }

    /**
     * Process derived data for battle calculations
     */
    _processBattleData(actorData) {
        const data = actorData.data;
        let stridebonus = 0;
        let dashbonus = 0;
        let runbonus = 0;

        // Fast Mover and All Fours bonuses
        let fastmover = findInItems(this.items, "fastmover", "gift");
        if (fastmover) {
            stridebonus += 1;
            dashbonus += 2;
            runbonus += 6;
            if (hasConditionsIronclaw("All Fours", this)) {
                let allfours = findInItems(this.items, "allfours", "gift");
                if (allfours) {
                    stridebonus += 1;
                    dashbonus += 2;
                    runbonus += 6;
                }
            }
        }

        // Coward and Flight of the Prey bonuses
        if (hasConditionsIronclaw(["Afraid", "Terrified"], this)) {
            let coward = findInItems(this.items, "coward", "gift");
            if (coward) {
                let flightofprey = findInItems(this.items, "flightoftheprey", "gift");
                if (flightofprey && hasConditionsIronclaw("Afraid", this)) {
                    stridebonus += 1;
                    dashbonus += 4;
                    runbonus += 16;
                }
                else {
                    stridebonus += 1;
                    dashbonus += 3;
                    runbonus += 9;
                }
            }
        }

        let speedarr = parseSingleDiceString(data.traits.speed.dice);
        let bodyarr = parseSingleDiceString(data.traits.body.dice);

        if (!Array.isArray(speedarr) || !Array.isArray(bodyarr)) {
            console.error("Battle data process failed, unable to parse dice for " + actorData.name);
            data.stride = 0;
            data.dash = 0;
            data.run = 0;
        }

        let speedint = speedarr[1];
        let bodyint = bodyarr[1];
        if (speedint > 8 && hasConditionsIronclaw("Burdened", this)) speedint = 8;

        // Stride setup
        data.stride = 1 + stridebonus;
        if (hasConditionsIronclaw(["Slowed", "Immobilized", "Half-Buried", "Cannot Move"], this)) {
            data.stride = 0;
        }
        // Dash setup
        data.dash = Math.round(speedint / 2) + (bodyint > speedint ? 1 : 0) + dashbonus;
        if (hasConditionsIronclaw(["Burdened", "Blinded", "Slowed", "Immobilized", "Half-Buried", "Cannot Move"], this)) {
            data.dash = 0;
        }

        // Run setup
        data.run = bodyint + speedint + data.dash + runbonus;
        if (hasConditionsIronclaw(["Over-Burdened", "Immobilized", "Half-Buried", "Cannot Move"], this)) {
            data.run = 0;
        }


        // Initiative visual for the sheet
        data.initiativeString = reformDiceString(this.initiativeRoll(3), true);
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
        let strengthlevel = 0;
        let hasgiant = 0;
        for (let item of gear) {

            if (item.data.data.totalWeight && !isNaN(item.data.data.totalWeight)) {
                totalweight += item.data.data.totalWeight; // Check that the value exists and is not a NaN, then add it to totaled weight
            }

            if (item.data.type === 'armor' && item.data.data.worn === true) {
                totalarmors++;
            }

            // Encumbrance limit gift checks
            if (item.data.type === 'gift' && makeStatCompareReady(item.data.name) == "strength") {
                strengthlevel = strengthlevel > 1 ? strengthlevel : 1; // Check if improvedstrength has already been processed, in which case, keep it where it is
            }
            if (item.data.type === 'gift' && makeStatCompareReady(item.data.name) == "improvedstrength") {
                strengthlevel = 2;
            }
            if (item.data.type === 'gift' && makeStatCompareReady(item.data.name) == "giant") {
                hasgiant = 1;
            }
        }

        const bodyarr = parseSingleDiceString(data.traits.body.dice);
        if (!Array.isArray(bodyarr)) {
            console.error("Unable to parse body die for " + actorData.name);
            return;
        }

        data.encumbranceNone = Math.round(((bodyarr[1] / 2) - 1) * bodyarr[0] + strengthlevel + hasgiant);
        data.encumbranceBurdened = Math.round((bodyarr[1] - 1) * bodyarr[0] + strengthlevel * 2 + hasgiant * 2);
        data.encumbranceOverBurdened = Math.round(((bodyarr[1] / 2) * 3 - 1) * bodyarr[0] + strengthlevel * 3 + hasgiant * 3);

        const coinshaveweight = game.settings.get("ironclaw2e", "coinsHaveWeight");
        if (coinshaveweight === true && data.coinageWeight) {
            totalweight += data.coinageWeight;
        }
        data.totalWeight = totalweight;
        data.totalArmors = totalarmors;

        const manageburdened = game.settings.get("ironclaw2e", "manageEncumbranceAuto");
        if (manageburdened) {
            if (totalweight > data.encumbranceOverBurdened || totalarmors > 3) {
                this.addEffect(["Burdened", "Over-Burdened", "Cannot Move"]);
            }
            else if (totalweight > data.encumbranceBurdened || totalarmors == 3) {
                this.deleteEffect(["Cannot Move"], false);
                this.addEffect(["Burdened", "Over-Burdened"]);
            }
            else if (totalweight > data.encumbranceNone || totalarmors == 2) {
                this.deleteEffect(["Over-Burdened", "Cannot Move"], false);
                this.addEffect(["Burdened"]);
            }
            else {
                this.deleteEffect(["Burdened", "Over-Burdened", "Cannot Move"], false);
            }
        }
    }

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
        let totaldice = [];

        if (data.traits && Array.isArray(traitnames) && traitnames.length > 0) {
            for (let [key, trait] of Object.entries(data.traits)) {
                if (traitnames.includes(makeStatCompareReady(key))) {
                    if (labelgiven)
                        label += " + ";
                    totaldice = addArrays(totaldice, (isburdened && burdenedLimitedStat(key) ? enforceLimit(trait.diceArray, 2) : trait.diceArray));
                    label += convertCamelCase(key);
                    labelgiven = true;
                }
            }
            if (data.hasExtraCareers) {
                let extracareers = [];
                data.extraCareerIds.forEach(x => extracareers.push(this.items.get(x)));
                for (let [index, extra] of extracareers.entries()) {
                    let key = makeStatCompareReady(extra.data.data.careerName);
                    if (traitnames.includes(key)) {
                        if (labelgiven)
                            label += " + ";
                        totaldice = addArrays(totaldice, (isburdened && burdenedLimitedStat(key) ? enforceLimit(extra.data.data.diceArray, 2) : extra.data.data.diceArray));
                        label += extra.data.data.careerName;
                        labelgiven = true;
                    }
                }
            }
        }
        if (data.skills && Array.isArray(skillnames) && skillnames.length > 0) {
            for (let [key, skill] of Object.entries(data.skills)) {
                if (skillnames.includes(makeStatCompareReady(key))) {
                    if (labelgiven)
                        label += " + ";
                    totaldice = addArrays(totaldice, (isburdened && burdenedLimitedStat(key) ? enforceLimit(skill.diceArray, 2) : skill.diceArray));
                    label += convertCamelCase(key);
                    labelgiven = true;
                }
            }
        }

        return { "totalDice": totaldice, "label": label, "labelGiven": labelgiven };
    }

    /* -------------------------------------------- */
    /*  Actor Token Change Functions                */
    /* -------------------------------------------- */

    changeLightSource(lightsource) {
        if (!lightsource) {
            console.error("Attempted to change a light source without providing light source for actor: " + this);
            return;
        }
        let updatedlightdata = {
            "dimLight": 0, "brightLight": 0, "lightAngle": 360, "lightColor": "#ffffff", "lightAlpha": 0.25, "lightAnimation": {
                "type": "", "speed": 5, "intensity": 5
            }
        };

        let lightsources = this.items.filter(element => element.data.type == "illumination");

        if (!lightsource.data.data.lighted) { // Light the light source
            updatedlightdata = {
                "dimLight": lightsource.data.data.dimLight, "brightLight": lightsource.data.data.brightLight, "lightAngle": lightsource.data.data.lightAngle,
                "lightColor": lightsource.data.data.lightColor, "lightAlpha": lightsource.data.data.lightAlpha, "lightAnimation": {
                    "type": lightsource.data.data.lightAnimationType, "speed": lightsource.data.data.lightAnimationSpeed, "intensity": lightsource.data.data.lightAnimationIntensity
                }
            };
            const index = lightsources.findIndex(element => element.data._id == lightsource.data._id);
            if (index > -1)
                lightsources.splice(index, 1); // Exclude from dousing
            this.updateOwnedItem({ "_id": lightsource.data._id, "data.lighted": true });
        }

        for (let l of lightsources) { // Douse all other light sources, including the caller if it was previously lighted
            this.updateOwnedItem({ "_id": l._id, "data.lighted": false });
        }

        this._updateTokenLighting(updatedlightdata);
    }

    refreshLightSource() {
        let updatedlightdata = {
            "dimLight": 0, "brightLight": 0, "lightAngle": 360, "lightColor": "#ffffff", "lightAlpha": 0.25, "lightAnimation": {
                "type": "", "speed": 5, "intensity": 5
            }
        };

        let lightsources = this.items.filter(element => element.data.type == "illumination");
        let activesource = lightsources.find(element => element.data.data.lighted == true);
        if (activesource) {
            updatedlightdata = {
                "dimLight": activesource.data.data.dimLight, "brightLight": activesource.data.data.brightLight, "lightAngle": activesource.data.data.lightAngle,
                "lightColor": activesource.data.data.lightColor, "lightAlpha": activesource.data.data.lightAlpha, "lightAnimation": {
                    "type": activesource.data.data.lightAnimationType, "speed": activesource.data.data.lightAnimationSpeed, "intensity": activesource.data.data.lightAnimationIntensity
                }
            };
        }

        this._updateTokenLighting(updatedlightdata);
    }

    applyDamage(damage, knockout, nonlethal = false) {
        let adding = ["Reeling"];
        if (damage >= 1) {
            adding.push("Hurt");
            if (knockout) adding.push("Asleep");
        }
        if (damage >= 2) {
            adding.push("Afraid");
            if (knockout) adding.push("Unconscious");
        }
        if (damage >= 3) adding.push("Injured");
        if (damage >= 4) adding.push("Dying");
        if (damage >= 5 && !nonlethal) adding.push("Dead");
        if (damage >= 6 && !nonlethal) adding.push("Overkilled");
        this.addEffect(adding);
    }

    async addEffect(condition) {
        addConditionsIronclaw(condition, this);
    }

    async deleteEffect(condition, isid = false) {
        if (isid) {
            this.deleteEmbeddedEntity("ActiveEffect", condition);
        }
        else {
            removeConditionsIronclaw(condition, this);
        }
    }

    async resetEffects() {
        for (let effect of this.effects) {
            await effect.delete();
        }
    }

    /* -------------------------------------------- */
    /*  Non-popup Roll Functions                    */
    /* -------------------------------------------- */

    /**
     * Function to call initiative for an actor for the traditional initiative
     * @param {number} returntype The type of return to use: 0 for nothing as it launches a popup, 1 for a traditional initiative roll, 2 for the initiative check on combat start for side-based initiative, 3 to simply return the total initiative dice array
     * @param {number} tntouse The target number to use in case the mode uses target numbers
     * @returns {any} Exact return type depends on the returntype parameter, null if no normal return path
     */
    initiativeRoll(returntype, tntouse = 2) {
        const data = this.data.data;
        let formconstruction = ``;
        let constructionkeys = [];
        let constructionarray = [];
        let prechecked = ["speed", "mind"];
        const burdened = hasConditionsIronclaw("Burdened", this);

        // Danger Sense bonus
        let dangersense = findInItems(this.items, "dangersense", "gift");
        if (dangersense) {
            constructionkeys.push(dangersense.data.name);
            constructionarray.push(dangersense.data.data.giftArray);
            formconstruction += `<div class="form-group flexrow">
                 <label class="normal-label">${dangersense.data.name}: ${reformDiceString(dangersense.data.data.giftArray, true)}</label>
	             <input type="checkbox" id="${makeStatCompareReady(dangersense.data.name)}" name="${makeStatCompareReady(dangersense.data.name)}" checked></input>
                </div>`+ "\n";
        }
        let foo, bar;
        switch (returntype) { // Yes, yes, the breaks are unnecessary
            case 0:
                this.popupSelectRolled(prechecked, true, tntouse, "", formconstruction, constructionkeys, constructionarray);
                return;
                break;
            case 1:
                foo = this._getDicePools(prechecked, null, burdened);
                bar = dangersense ? addArrays(foo.totalDice, dangersense.data.data.giftArray) : foo.totalDice;
                return rollHighest(bar[0], bar[1], bar[2], bar[3], bar[4], "Rolling initiative: " + foo.label + (dangersense ? " + " + dangersense.data.name : ""), this, false);
                break;
            case 2:
                foo = this._getDicePools(prechecked, null, burdened);
                bar = dangersense ? addArrays(foo.totalDice, dangersense.data.data.giftArray) : foo.totalDice;
                return rollTargetNumber(tntouse, bar[0], bar[1], bar[2], bar[3], bar[4], "Rolling the initiative check: " + foo.label + (dangersense ? " + " + dangersense.data.name : ""), this, false);
                break;
            case 3:
                foo = this._getDicePools(prechecked, null, burdened);
                return (dangersense ? addArrays(foo.totalDice, dangersense.data.data.giftArray) : foo.totalDice);
                break;
        }

        console.warn("Initiative roll return type defaulted for actor: " + this.data.name);
        return null;
    }

    /* -------------------------------------------- */
    /*  Special Popup Macro Puukko Functions        */
    /* -------------------------------------------- */

    popupSoakRoll(prechecked = [], tnyes = false, tnnum = 3, extradice = "", otherinputs = "", otherkeys = [], otherdice = [], otherlabel = "", successfunc = null) {
        const data = this.data.data;
        let formconstruction = ``;
        let constructionkeys = [];
        let constructionarray = [];

        // Resolve
        if (findInItems(this.items, "resolve", "gift")) {
            if (!prechecked.includes("will")) {
                prechecked.push("will");
            }
        }

        // Armor
        let armors = this.items.filter(element => element.data.data.worn === true);
        for (let i = 0; i < armors.length && i < 3; ++i) {
            constructionkeys.push(armors[i].data.name);
            constructionarray.push(armors[i].data.data.armorArray);
            formconstruction += `<div class="form-group flexrow">
                 <label class="normal-label">${armors[i].data.name}: ${reformDiceString(armors[i].data.data.armorArray, true)}</label>
	             <input type="checkbox" id="${makeStatCompareReady(armors[i].data.name)}" name="${makeStatCompareReady(armors[i].data.name)}" checked></input>
                </div>`+ "\n";
        }

        // Shield Soak
        if (findInItems(this.items, "shieldsoak", "gift")) {
            let shield = this.items.find(element => element.data.data.held === true);
            if (shield) {
                constructionkeys.push(shield.data.name);
                constructionarray.push(shield.data.data.coverArray);
                formconstruction += `<div class="form-group flexrow">
                 <label class="normal-label">${shield.data.name}: ${reformDiceString(shield.data.data.coverArray, true)}</label>
	             <input type="checkbox" id="${makeStatCompareReady(shield.data.name)}" name="${makeStatCompareReady(shield.data.name)}" checked></input>
                </div>`+ "\n";
            }
        }

        // Guard Soak
        if (findInItems(this.items, "guardsoak", "gift")) {
            if (hasConditionsIronclaw("Guarding", this)) {
                let veteran = findInItems(this.items, "veteran", "gift");
                let guardbonus = [0, 0, 1, 0, 0];
                let guardlabel = "Guard soak";
                if (veteran) {
                    guardbonus = veteran.data.data.giftArray;
                    guardlabel = "Veteran guard soak";
                }

                constructionkeys.push(guardlabel);
                constructionarray.push(guardbonus);
                formconstruction += `<div class="form-group flexrow">
                 <label class="normal-label">${guardlabel}: ${reformDiceString(guardbonus, true)}</label>
	             <input type="checkbox" id="${makeStatCompareReady(guardlabel)}" name="${makeStatCompareReady(guardlabel)}" checked></input>
                </div>`+ "\n";
            }
        }

        // Natural Armor
        if (findInItems(this.items, "naturalarmor", "gift")) {
            if (!prechecked.includes("species")) {
                prechecked.push("species");
            }
        }

        this.popupSelectRolled(prechecked, tnyes, tnnum, extradice, formconstruction + otherinputs, nullCheckConcat(constructionkeys, otherkeys), nullCheckConcat(constructionarray, otherdice), otherlabel, successfunc);
    }

    popupDefenseRoll(prechecked = [], tnyes = false, tnnum = 3, extradice = "", otherinputs = "", otherkeys = [], otherdice = [], otherlabel = "", isparry = false, successfunc = null) {
        const data = this.data.data;
        let formconstruction = ``;
        let constructionkeys = [];
        let constructionarray = [];

        // Shield cover die
        let shield = this.items.find(element => element.data.data.held === true);
        if (shield) {
            constructionkeys.push(shield.data.name);
            constructionarray.push(shield.data.data.coverArray);
            formconstruction += `<div class="form-group flexrow">
                 <label class="normal-label">${shield.data.name}: ${reformDiceString(shield.data.data.coverArray, true)}</label>
	             <input type="checkbox" id="${makeStatCompareReady(shield.data.name)}" name="${makeStatCompareReady(shield.data.name)}" checked></input>
                </div>`+ "\n";
        }

        // Coward bonus when Afraid or Terrified
        if (hasConditionsIronclaw(["Afraid", "Terrified"], this)) {
            let coward = findInItems(this.items, "coward", "gift");
            let flightofprey = findInItems(this.items, "flightoftheprey", "gift");
            if (flightofprey && coward && hasConditionsIronclaw("Afraid", this)) {
                constructionkeys.push(flightofprey.data.name);
                constructionarray.push(flightofprey.data.data.giftArray);
                formconstruction += `<div class="form-group flexrow">
                 <label class="normal-label">${flightofprey.data.name}: ${reformDiceString(flightofprey.data.data.giftArray, true)}</label>
	             <input type="checkbox" id="${makeStatCompareReady(flightofprey.data.name)}" name="${makeStatCompareReady(flightofprey.data.name)}" checked></input>
                </div>`+ "\n";
            }
            else if (coward && isparry == false && checkForPrechecked(prechecked, "dodge")) {
                constructionkeys.push(coward.data.name);
                constructionarray.push(coward.data.data.giftArray);
                formconstruction += `<div class="form-group flexrow">
                 <label class="normal-label">${coward.data.name}: ${reformDiceString(coward.data.data.giftArray, true)}</label>
	             <input type="checkbox" id="${makeStatCompareReady(coward.data.name)}" name="${makeStatCompareReady(coward.data.name)}" checked></input>
                </div>`+ "\n";
            }
        }

        // Guarding bonus
        if (hasConditionsIronclaw("Guarding", this)) {
            let veteran = findInItems(this.items, "veteran", "gift");
            let guardbonus = [0, 0, 1, 0, 0];
            let guardlabel = "Guarding";
            if (veteran) {
                guardbonus = veteran.data.data.giftArray;
                guardlabel = "Veteran guarding";
            }

            constructionkeys.push(guardlabel);
            constructionarray.push(guardbonus);
            formconstruction += `<div class="form-group flexrow">
                 <label class="normal-label">${guardlabel}: ${reformDiceString(guardbonus, true)}</label>
	             <input type="checkbox" id="${makeStatCompareReady(guardlabel)}" name="${makeStatCompareReady(guardlabel)}" checked></input>
                </div>`+ "\n";
        }

        // Fencing Dodge bonus
        if (isparry) {
            let fencing = findInItems(this.items, "fencing", "gift");
            if (fencing && !prechecked.includes("dodge")) {
                prechecked.push("dodge");
            }
        }

        // Focused Fighter bonus
        if (hasConditionsIronclaw("Focused", this)) {
            let focused = findInItems(this.items, "focusedfighter", "gift");
            if (focused) {
                constructionkeys.push(focused.data.name);
                constructionarray.push(focused.data.data.giftArray);
                formconstruction += `<div class="form-group flexrow">
                 <label class="normal-label">${focused.data.name}: ${reformDiceString(focused.data.data.giftArray, true)}</label>
	             <input type="checkbox" id="${makeStatCompareReady(focused.data.name)}" name="${makeStatCompareReady(focused.data.name)}" checked></input>
                </div>`+ "\n";
            }
        }

        this.popupSelectRolled(prechecked, tnyes, tnnum, extradice, formconstruction + otherinputs, nullCheckConcat(constructionkeys, otherkeys), nullCheckConcat(constructionarray, otherdice), otherlabel, successfunc);
    }

    popupAttackRoll(prechecked = [], tnyes = false, tnnum = 3, extradice = "", otherinputs = "", otherkeys = [], otherdice = [], otherlabel = "", successfunc = null) {
        const data = this.data.data;
        let formconstruction = ``;
        let constructionkeys = [];
        let constructionarray = [];

        // Strength die
        if (checkForPrechecked(prechecked, ["meleecombat", "brawling", "throwing"])) {
            let strength = findInItems(this.items, "strength", "gift");
            if (strength) {
                let superstrength = findInItems(this.items, "improvedstrength", "gift");
                strength = superstrength ? superstrength : strength;
            }
            if (strength) {
                constructionkeys.push(strength.data.name);
                constructionarray.push(strength.data.data.giftArray);
                formconstruction += `<div class="form-group flexrow">
                 <label class="normal-label">${strength.data.name}: ${reformDiceString(strength.data.data.giftArray, true)}</label>
	             <input type="checkbox" id="${makeStatCompareReady(strength.data.name)}" name="${makeStatCompareReady(strength.data.name)}" checked></input>
                </div>`+ "\n";
            }
        }

        this.popupSelectRolled(prechecked, tnyes, tnnum, extradice, formconstruction + otherinputs, nullCheckConcat(constructionkeys, otherkeys), nullCheckConcat(constructionarray, otherdice), otherlabel, successfunc);
    }

    popupCounterRoll(prechecked = [], tnyes = false, tnnum = 3, extradice = "", otherinputs = "", otherkeys = [], otherdice = [], otherlabel = "", successfunc = null) {
        const data = this.data.data;
        let formconstruction = ``;
        let constructionkeys = [];
        let constructionarray = [];

        // Guarding bonus
        if (hasConditionsIronclaw("Guarding", this)) {
            let veteran = findInItems(this.items, "veteran", "gift");
            let guardbonus = [0, 0, 1, 0, 0];
            let guardlabel = "Guarding";
            if (veteran) {
                guardbonus = veteran.data.data.giftArray;
                guardlabel = "Veteran guarding";
            }

            constructionkeys.push(guardlabel);
            constructionarray.push(guardbonus);
            formconstruction += `<div class="form-group flexrow">
                 <label class="normal-label">${guardlabel}: ${reformDiceString(guardbonus, true)}</label>
	             <input type="checkbox" id="${makeStatCompareReady(guardlabel)}" name="${makeStatCompareReady(guardlabel)}" checked></input>
                </div>`+ "\n";
        }

        // Focused Fighter bonus
        if (hasConditionsIronclaw("Focused", this)) {
            let focused = findInItems(this.items, "focusedfighter", "gift");
            if (focused) {
                constructionkeys.push(focused.data.name);
                constructionarray.push(focused.data.data.giftArray);
                formconstruction += `<div class="form-group flexrow">
                 <label class="normal-label">${focused.data.name}: ${reformDiceString(focused.data.data.giftArray, true)}</label>
	             <input type="checkbox" id="${makeStatCompareReady(focused.data.name)}" name="${makeStatCompareReady(focused.data.name)}" checked></input>
                </div>`+ "\n";
            }
        }

        this.popupSelectRolled(prechecked, tnyes, tnnum, extradice, formconstruction + otherinputs, nullCheckConcat(constructionkeys, otherkeys), nullCheckConcat(constructionarray, otherdice), otherlabel, successfunc);
    }

    /* -------------------------------------------- */
    /*  Actual Popup Functions                      */
    /* -------------------------------------------- */

    /** Damage calculation popup */
    popupDamage(readydamage = "", readysoak = "") {
        let confirmed = false;
        let speaker = getMacroSpeaker(this);
        let addeddamage = 0;
        if (hasConditionsIronclaw("Hurt", this)) addeddamage++;
        if (hasConditionsIronclaw("Injured", this)) addeddamage++;
        let dlog = new Dialog({
            title: "Damage Calculation for " + speaker.alias,
            content: `
     <form class="ironclaw2e">
      <h1>Add damage to ${this.data.name}</h1>
      <div class="form-group">
       <label class="normal-label">Damage received:</label>
	   <input id="damage" name="damage" value="${readydamage}" onfocus="this.select();"></input>
      </div>
      <div class="form-group">
       <label class="normal-label">Soak:</label>
	   <input id="soak" name="soak" value="${readysoak}" onfocus="this.select();"></input>
      </div>
      <div class="form-group">
       <span class="normal-label">Additional Damage: ${addeddamage}</span>
       <input type="checkbox" id="added" name="added" value="1" checked></input>
      </div>
      <div class="form-group">
       <label>Knockout Strike?</label>
       <input type="checkbox" id="knockout" name="knockout" value="1"></input>
      </div>
      <div class="form-group">
       <label>Non-lethal attack?</label>
       <input type="checkbox" id="nonlethal" name="nonlethal" value="1"></input>
      </div>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Roll!",
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => confirmed = false
                }
            },
            default: "one",
            render: html => { document.getElementById("damage").focus(); },
            close: html => {
                if (confirmed) {
                    let DAMAGE = html.find('[name=damage]')[0].value;
                    let damage = 0; if (DAMAGE.length > 0) damage = parseInt(DAMAGE);
                    let SOAK = html.find('[name=soak]')[0].value;
                    let soak = 0; if (SOAK.length > 0) soak = parseInt(SOAK);
                    let ADDED = html.find('[name=added]')[0];
                    let added = ADDED.checked;
                    let KNOCKOUT = html.find('[name=knockout]')[0];
                    let knockout = KNOCKOUT.checked;
                    let ALLOW = html.find('[name=nonlethal]')[0];
                    let allow = ALLOW.checked;

                    this.applyDamage(damage + (added ? addeddamage : 0) - soak, knockout, allow);
                }
            }
        });
        dlog.render(true);
    }

    /** Special condition adding popup */
    popupAddCondition(readyname = "") {
        let confirmed = false;
        let speaker = getMacroSpeaker(this);
        let dlog = new Dialog({
            title: "Add Condition to " + speaker.alias,
            content: `
     <form>
      <h1>Add condition for ${this.data.name}</h1>
      <div class="form-group">
       <label>Condition to add:</label>
      </div>
	  <div class="form-group">
	   <input id="cond" name="cond" value="${readyname}" onfocus="this.select();"></input>
      </div>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Add",
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => confirmed = false
                }
            },
            default: "one",
            render: html => { document.getElementById("cond").focus(); },
            close: html => {
                if (confirmed) {
                    let COND = html.find('[name=cond]')[0].value;
                    this.addEffect(COND);
                }
            }
        });
        dlog.render(true);
    }

    /** Supermassive function to make a dynamic popup window asking about which exact dice pools should be included
     * @param {string[]} prechecked Skills to autocheck on the dialog
     * @param {boolean} tnyes Whether to use a TN, true for yes
     * @param {number} tnnum TN to use
     * @param {string} extradice Default extra dice to use for the bottom one-line slot
     * @param {string} otherinputs HTML string to add to the dialog
     * @param {[string]} otherkeys An array of keys, to be used for UI information and with the added HTML for checkboxes in case the other dice can be switched off
     * @param {[number[]]} otherdice An array of dice arrays, the items should match exactly with their counterparts at otherkeys
     * @param {string} otherlabel Text to postpend to the label
     * @param successfunc Callback to execute after going through with the macro, will not execute if cancelled out
     */
    popupSelectRolled(prechecked = [], tnyes = false, tnnum = 3, extradice = "", otherinputs = "", otherkeys = [], otherdice = [], otherlabel = "", successfunc = null) {
        const data = this.data.data;
        let formconstruction = ``;
        let firstelement = "";
        let hastraits = data.hasOwnProperty("traits");
        let hasskills = data.hasOwnProperty("skills");
        let hashtml = otherinputs.length > 0;

        let extracareers = [];
        if (data.hasExtraCareers) { // Check if the actor has any extra careers to show
            data.extraCareerIds.forEach(x => extracareers.push(this.items.get(x)));
        }

        let burdened = "";
        if (hasConditionsIronclaw("Burdened", this)) {
            burdened = `
     <div class="form-group">
       <label class="normal-label">Apply Burdened Limit automatically:</label>
       <input type="checkbox" id="burdened" name="burdened" value="1" checked></input>
     </div>`;
        }

        if (hastraits) {
            formconstruction += `<h2>Traits:</h2>
       <div class="grid-2row grid-minimal">` + "\n";;
            for (let [key, trait] of Object.entries(data.traits)) {
                let lowerkey = makeStatCompareReady(key);
                if (firstelement == "")
                    firstelement = lowerkey;
                formconstruction += `<div class="form-group flex-group-center flex-tight">
       <label class="normal-label">${(data.hasExtraCareers && key === "career" ? trait.name : convertCamelCase(key))}: ${reformDiceString(trait.diceArray)}</label>
	   <input type="checkbox" id="${lowerkey}" name="trait" value="${lowerkey}" ${prechecked.includes(lowerkey) ? "checked" : ""}></input>
      </div>`+ "\n";
            }
            // Extra Career additional boxes
            if (extracareers.length > 0) {
                for (let [index, extra] of extracareers.entries()) {
                    if (index >= 2)
                        break; // For UI reasons, only show up to two extra careers on dice pool selection, these should select themselves from the top of the list in the sheet
                    let lowerkey = makeStatCompareReady(extra.data.data.careerName);
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
            formconstruction += `<h2>Skills:</h2>
       <div class="grid grid-3col grid-minimal">` + "\n";
            for (let [key, skill] of Object.entries(data.skills)) {
                let lowerkey = makeStatCompareReady(key);
                if (firstelement == "")
                    firstelement = lowerkey;
                let usedname = convertCamelCase(key) + ": " + reformDiceString(skill.diceArray);
                formconstruction += `<div class="form-group flex-group-center flex-tight">
       <label class="${(usedname.length > 18 ? "small-label" : "normal-label")}">${usedname}</label>
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
            title: "Choose Pools",
            content: `
     <form class="ironclaw2e">
     <h1>Choose dice pools for ${this.data.name}</h1>
     <span class="small-text">Showing up in chat as ${getMacroSpeaker(this).alias}</span>
     <div class="form-group">
       <label class="normal-label">Check to use TN:</label>
       <input type="checkbox" id="iftn" name="iftn" value="1" ${tnyes ? "checked" : ""}></input>
	   <input id="tn" name="tn" value="${tnnum}" onfocus="this.select();"></input>
     </div>
      ${burdened}
      ${formconstruction}
      ${otherinputs}
	  <div class="form-group">
       <label class="normal-label">Extra dice:</label>
	   <input id="dices" name="dices" value="${extradice}" onfocus="this.select();"></input>
      </div>
     <div class="form-group">
       <label class="normal-label">Limit All Dice Pools:</label>
       <input type="checkbox" id="iflimit" name="iflimit" value="1"></input>
	   <input id="limit" name="limit" value="" onfocus="this.select();"></input>
     </div>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Roll!",
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => confirmed = false
                }
            },
            default: "one",
            render: html => { document.getElementById("iftn").focus(); },
            close: html => {
                if (confirmed) {
                    let traitchecks = html.find('input:checkbox[name=trait]:checked');
                    let skillchecks = html.find('input:checkbox[name=skill]:checked');
                    let traitvalues = [];
                    let skillvalues = [];
                    let totaldice = [0, 0, 0, 0, 0];

                    for (let i = 0; i < traitchecks.length; ++i) {
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

                    let labelgiven = false;
                    let label = "Rolling ";
                    if (IFTN)
                        label += "against TN: ";
                    else
                        label += "highest: ";

                    if (hastraits || hasskills) {
                        let statfoobar = this._getDicePools(traitvalues, skillvalues, isburdened, labelgiven);
                        totaldice = statfoobar.totalDice;
                        label += statfoobar.label;
                        labelgiven = statfoobar.labelGiven;
                    }
                    if (Array.isArray(otherdice) && Array.isArray(otherkeys) && otherdice.length > 0 && otherdice.length == otherkeys.length) {
                        for (let i = 0; i < otherdice.length; i++) {
                            let OTHER = html.find(`[name=${makeStatCompareReady(otherkeys[i])}]`);
                            let otherchecked = (hashtml && OTHER.length > 0 ? OTHER[0].checked : true);
                            if (otherchecked) {
                                if (labelgiven)
                                    label += " + ";
                                totaldice = addArrays(totaldice, otherdice[i]);
                                label += otherkeys[i];
                                labelgiven = true;
                            }
                        }
                    }
                    if (DICE.some(element => element != 0)) {
                        label += " + extra";
                        totaldice = addArrays(totaldice, DICE);
                    }
                    label += ".";
                    if (typeof (otherlabel) === 'string' && otherlabel.length > 0)
                        label += `<p style="color:black">${otherlabel}</p>`;

                    if (uselimit) {
                        totaldice = enforceLimit(totaldice, limit);
                    }

                    let rollmessage;
                    if (IFTN)
                        rollmessage = rollTargetNumber(TN, totaldice[0], totaldice[1], totaldice[2], totaldice[3], totaldice[4], label, this);
                    else
                        rollmessage = rollHighest(totaldice[0], totaldice[1], totaldice[2], totaldice[3], totaldice[4], label, this);

                    if (successfunc && typeof (successfunc) == "function") {
                        successfunc(rollmessage);
                    }
                }
            }
        }, { width: 600 });
        dlog.render(true);
    }
}