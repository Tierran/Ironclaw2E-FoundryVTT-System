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
// From the combat-utility-belt
import { hasConditionIronclaw } from "../unified.js";
import { addConditionIronclaw } from "../unified.js";
import { removeConditionIronclaw } from "../unified.js";
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
    }

    /**
     * Process baseSkills template data
     */
    _processSkills(actorData) {
        const data = actorData.data;

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
            if (data.traits.species.skills.includes(makeStatCompareReady(key))) {
                skill.diceArray = addArrays(skill.diceArray, data.traits.species.diceArray);
            }
            if (data.traits.career.skills.includes(makeStatCompareReady(key))) {
                skill.diceArray = addArrays(skill.diceArray, data.traits.career.diceArray);
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
            if (hasConditionIronclaw("All Fours", this)) {
                let allfours = findInItems(this.items, "allfours", "gift");
                if (allfours) {
                    stridebonus += 1;
                    dashbonus += 2;
                    runbonus += 6;
                }
            }
        }

        // Coward and Flight of the Prey bonuses
        if (hasConditionIronclaw(["Afraid", "Terrified"], this)) {
            let coward = findInItems(this.items, "coward", "gift");
            if (coward) {
                let flightofprey = findInItems(this.items, "flightoftheprey", "gift");
                if (flightofprey && hasConditionIronclaw("Afraid", this)) {
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

        let speedstr = data.traits.speed.dice.split("d");
        let speedint = parseInt(speedstr[speedstr.length - 1].trim());
        if (speedint > 8 && hasConditionIronclaw("Burdened", this)) speedint = 8;
        let bodystr = data.traits.body.dice.split("d");
        let bodyint = parseInt(bodystr[bodystr.length - 1].trim());

        // Stride setup
        data.stride = 1 + stridebonus;
        if (hasConditionIronclaw(["Slowed", "Immobilized", "Half-Buried", "Cannot Move"], this)) {
            data.stride = 0;
        }

        if (isNaN(speedint) || isNaN(bodyint)) {
            console.error("Battle data process failed, unable to parse dice for " + actorData.name);
            data.dash = 0;
            data.run = 0;
        }
        else {
            // Dash setup
            data.dash = Math.round(speedint / 2) + (bodyint > speedint ? 1 : 0) + dashbonus;
            if (hasConditionIronclaw(["Burdened", "Blinded", "Slowed", "Immobilized", "Half-Buried", "Cannot Move"], this)) {
                data.dash = 0;
            }

            // Run setup
            data.run = bodyint + speedint + data.dash + runbonus;
            if (hasConditionIronclaw(["Over-Burdened", "Immobilized", "Half-Buried", "Cannot Move"], this)) {
                data.run = 0;
            }
        }
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

        const bodystr = data.traits.body.dice.split("d");
        const bodyint = parseInt(bodystr[bodystr.length - 1].trim());

        data.encumbranceNone = (bodyint / 2) - 1 + strengthlevel + hasgiant;
        data.encumbranceBurdened = bodyint - 1 + strengthlevel * 2 + hasgiant * 2;
        data.encumbranceOverBurdened = (bodyint / 2) * 3 - 1 + strengthlevel * 3 + hasgiant * 3;

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
        addConditionIronclaw(adding, this);
    }

    async addEffect(condition) {
        addConditionIronclaw(condition, this);
    }

    async deleteEffect(condition, isid = false) {
        if (isid) {
            await this.deleteEmbeddedEntity("ActiveEffect", condition);
        }
        else {
            removeConditionIronclaw(condition, this);
        }
    }

    async resetEffects() {
        for (let effect of this.effects) {
            await effect.delete();
        }
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
            if (hasConditionIronclaw("Guarding", this)) {
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
        if (hasConditionIronclaw(["Afraid", "Terrified"], this)) {
            let coward = findInItems(this.items, "coward", "gift");
            let flightofprey = findInItems(this.items, "flightoftheprey", "gift");
            if (flightofprey && coward && hasConditionIronclaw("Afraid", this)) {
                constructionkeys.push(flightofprey.data.name);
                constructionarray.push(flightofprey.data.data.giftArray);
                formconstruction += `<div class="form-group flexrow">
                 <label class="normal-label">${flightofprey.data.name}: ${reformDiceString(flightofprey.data.data.coverArray, true)}</label>
	             <input type="checkbox" id="${makeStatCompareReady(flightofprey.data.name)}" name="${makeStatCompareReady(flightofprey.data.name)}" checked></input>
                </div>`+ "\n";
            }
            else if (coward && isparry == false && checkForPrechecked(prechecked, "dodge")) {
                constructionkeys.push(coward.data.name);
                constructionarray.push(coward.data.data.giftArray);
                formconstruction += `<div class="form-group flexrow">
                 <label class="normal-label">${coward.data.name}: ${reformDiceString(coward.data.data.coverArray, true)}</label>
	             <input type="checkbox" id="${makeStatCompareReady(coward.data.name)}" name="${makeStatCompareReady(coward.data.name)}" checked></input>
                </div>`+ "\n";
            }
        }

        // Guarding bonus
        if (hasConditionIronclaw("Guarding", this)) {
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
        if (hasConditionIronclaw("Focused", this)) {
            let focused = findInItems(this.items, "focusedfighter", "gift");
            if (focused) {
                constructionkeys.push(focused.data.name);
                constructionarray.push(focused.data.data.giftArray);
                formconstruction += `<div class="form-group flexrow">
                 <label class="normal-label">${focused.data.name}: ${reformDiceString(focused.data.data.coverArray, true)}</label>
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
        if (hasConditionIronclaw("Guarding", this)) {
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
        if (hasConditionIronclaw("Focused", this)) {
            let focused = findInItems(this.items, "focusedfighter", "gift");
            if (focused) {
                constructionkeys.push(focused.data.name);
                constructionarray.push(focused.data.data.giftArray);
                formconstruction += `<div class="form-group flexrow">
                 <label class="normal-label">${focused.data.name}: ${reformDiceString(focused.data.data.coverArray, true)}</label>
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
    popupDamage() {
        let confirmed = false;
        let speaker = getMacroSpeaker(this);
        let addeddamage = 0;
        if (hasConditionIronclaw("Hurt", this)) addeddamage++;
        if (hasConditionIronclaw("Injured", this)) addeddamage++;
        let dlog = new Dialog({
            title: "Damage Calculation for " + speaker.alias,
            content: `
     <form class="ironclaw2e">
      <h1>Set damage for ${this.data.name}</h1>
      <div class="form-group">
       <span class="normal-label">Additional Damage: ${addeddamage}</span>
      </div>
      <div class="form-group">
       <label>Damage received:</label>
	   <input id="damage" name="damage" value="" onfocus="this.select();"></input>
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
                    let DAMAGE = html.find('[name=damage]')[0];
                    let damage = 0; if (DAMAGE.length != 0) damage = parseInt(DAMAGE.value);
                    let KNOCKOUT = html.find('[name=knockout]')[0];
                    let knockout = KNOCKOUT.checked;
                    let ALLOW = html.find('[name=nonlethal]')[0];
                    let allow = ALLOW.checked;

                    this.applyDamage(damage + addeddamage, knockout, allow);
                }
            }
        });
        dlog.render(true);
    }

    /** Special condition adding popup */
    popupAddCondition() {
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
	   <input id="cond" name="cond" onfocus="this.select();"></input>
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

        let burdened = "";
        if (hasConditionIronclaw("Burdened", this)) {
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
       <label class="normal-label">${convertCamelCase(key)}:</label>
	   <input type="checkbox" id="${lowerkey}" name="trait" value="${lowerkey}" ${prechecked.includes(lowerkey) ? "checked" : ""}></input>
      </div>`+ "\n";
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
                formconstruction += `<div class="form-group flex-group-center flex-tight">
       <label class="normal-label">${convertCamelCase(key)}:</label>
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
                    let limit = 0; if (LIMIT.length != 0) limit = parseInt(LIMIT);

                    let IFTNSS = html.find('[name=iftn]')[0];
                    let IFTN = IFTNSS.checked;
                    let TNSS = html.find('[name=tn]')[0].value;
                    let TN = 0; if (TNSS.length != 0) TN = parseInt(TNSS);
                    let DICES = html.find('[name=dices]')[0].value;
                    let DICE = findTotalDice(DICES);

                    let labelgiven = false;
                    let label = "Rolling ";
                    if (IFTN)
                        label += "against TN: ";
                    else
                        label += "highest: ";

                    if (hastraits) {
                        for (let [key, trait] of Object.entries(data.traits)) {
                            if (traitvalues.includes(makeStatCompareReady(key))) {
                                if (labelgiven)
                                    label += " + ";
                                totaldice = addArrays(totaldice, (isburdened && burdenedLimitedStat(key) ? enforceLimit(trait.diceArray, 2) : trait.diceArray));
                                label += convertCamelCase(key);
                                labelgiven = true;
                            }
                        }
                    }
                    if (hasskills) {
                        for (let [key, skill] of Object.entries(data.skills)) {
                            if (skillvalues.includes(makeStatCompareReady(key))) {
                                if (labelgiven)
                                    label += " + ";
                                totaldice = addArrays(totaldice, (isburdened && burdenedLimitedStat(key) ? enforceLimit(skill.diceArray, 2) : skill.diceArray));
                                label += convertCamelCase(key);
                                labelgiven = true;
                            }
                        }
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
                        label += "<br>" + otherlabel;

                    if (uselimit) {
                        totaldice = enforceLimit(totaldice, limit);
                    }

                    if (IFTN)
                        rollTargetNumber(TN, totaldice[0], totaldice[1], totaldice[2], totaldice[3], totaldice[4], label, this);
                    else
                        rollHighest(totaldice[0], totaldice[1], totaldice[2], totaldice[3], totaldice[4], label, this);

                    if (successfunc && typeof (successfunc) == "function") {
                        successfunc();
                    }
                }
            }
        }, { width: 600 });
        dlog.render(true);
    }
}