exports.run = async (client, interaction) => {
    const logger = require('../../util/logger');
    // Import globals
    let globalVars = require('../../events/ready');
    try {
        const sendMessage = require('../../util/sendMessage');
        const Discord = require("discord.js");
        // Language JSON
        const chineseJSON = require("../../submodules/leanny.github.io/splat3/data/language/CNzh.json");
        const EUGermanJSON = require("../../submodules/leanny.github.io/splat3/data/language/EUde.json");
        const EUEnglishJSON = require("../../submodules/leanny.github.io/splat3/data/language/EUen.json");
        const EUSpanishJSON = require("../../submodules/leanny.github.io/splat3/data/language/EUes.json");
        const EUFrenchJSON = require("../../submodules/leanny.github.io/splat3/data/language/EUfr.json");
        const EUItalianJSON = require("../../submodules/leanny.github.io/splat3/data/language/EUit.json");
        const EUDutchJSON = require("../../submodules/leanny.github.io/splat3/data/language/EUnl.json");
        const EURussianJSON = require("../../submodules/leanny.github.io/splat3/data/language/EUru.json");
        const japaneseJSON = require("../../submodules/leanny.github.io/splat3/data/language/JPja.json");
        const koreanJSON = require("../../submodules/leanny.github.io/splat3/data/language/KRko.json");
        const taiwaneseJSON = require("../../submodules/leanny.github.io/splat3/data/language/TWzh.json");
        const USEnglishJSON = require("../../submodules/leanny.github.io/splat3/data/language/USen.json");
        const USSpanishJSON = require("../../submodules/leanny.github.io/splat3/data/language/USes.json");
        const USFrenchJSON = require("../../submodules/leanny.github.io/splat3/data/language/USfr.json");
        // Game data
        const GearInfoClothesJSON = require("../../submodules/leanny.github.io/splat3/data/mush/099/GearInfoClothes.json");
        const GearInfoHeadJSON = require("../../submodules/leanny.github.io/splat3/data/mush/099/GearInfoHead.json");
        const GearInfoShoesJSON = require("../../submodules/leanny.github.io/splat3/data/mush/099/GearInfoShoes.json");
        const WeaponInfoMainJSON = require("../../submodules/leanny.github.io/splat3/data/mush/099/WeaponInfoMain.json");
        const WeaponInfoSpecialJSON = require("../../submodules/leanny.github.io/splat3/data/mush/099/WeaponInfoSpecial.json");
        const WeaponInfoSubJSON = require("../../submodules/leanny.github.io/splat3/data/mush/099/WeaponInfoSub.json");

        let ephemeral = true;
        let ephemeralArg = interaction.options.getBoolean("ephemeral");
        if (ephemeralArg === false) ephemeral = false;
        await interaction.deferReply({ ephemeral: ephemeral });
        // Add language arg?
        let languageJSON = EUEnglishJSON;

        let inputID;
        let demoDisclaimer = `Note that this command currently uses data from [a datamine of the Splatoon 3 Splatfest World Premier](https://github.com/Leanny/leanny.github.io/tree/master/splat3/data).\nThis causes data to be unstable, incomplete and prone to error.`;
        let github = `https://github.com/Leanny/leanny.github.io/blob/master/splat3/`;
        let splat3Embed = new Discord.MessageEmbed()
            .setColor(globalVars.embedColor);

        switch (interaction.options.getSubcommand()) {
            case "clothing":
                inputID = interaction.options.getString("clothing");
                let allClothesJSON = GearInfoHeadJSON.concat(GearInfoClothesJSON, GearInfoShoesJSON); // Using concat on objects because the JSON files are actually an array of unnamed objects despite being typed as object. Don't worry about it.
                // Doesn't always find the correct item despite its existence
                let clothingObject = await Object.values(allClothesJSON).find(clothing => clothing.__RowId.includes(inputID));
                if (!clothingObject) return sendMessage({ client: client, interaction: interaction, content: `Couldn't find that piece of clothing. Make sure you select an autocomplete option.\n${demoDisclaimer}` });
                // Rarity
                let star = "⭐";
                let clothingAuthor = languageJSON["CommonMsg/Gear/GearName_Clothes"][inputID];
                if (clothingObject.__RowId.startsWith("Shs")) clothingAuthor = languageJSON["CommonMsg/Gear/GearName_Shoes"][inputID];
                if (clothingObject.__RowId.startsWith("Hed")) clothingAuthor = languageJSON["CommonMsg/Gear/GearName_Head"][inputID];
                let starRating = star.repeat(clothingObject.Rarity);
                if (starRating.length > 0) clothingAuthor = `${clothingAuthor} (${starRating})`;
                // Obtainability
                let ObtainMethod = clothingObject.HowToGet;
                if (ObtainMethod == "Shop") ObtainMethod = `${ObtainMethod} (${clothingObject.Price})`;

                let brandImage = `${github}images/brand/${clothingObject.Brand}.png?raw=true`;
                let clothingImage = `${github}images/gear/${clothingObject.__RowId}.png?raw=true`;

                splat3Embed
                    .setAuthor({ name: clothingAuthor })
                    .setThumbnail(brandImage)
                    .addField("Main Skill:", languageJSON["CommonMsg/Gear/GearPowerName"][clothingObject.Skill], true)
                    .addField("Slots:", (clothingObject.Rarity + 1).toString(), true)
                    .addField("Brand:", languageJSON["CommonMsg/Gear/GearBrandName"][clothingObject.Brand], true)
                    .addField("Obtain Method:", ObtainMethod, true)
                    .setImage(clothingImage);
                break;
            case "weapon":
                inputID = interaction.options.getString("weapon");
                let weaponObject = await Object.values(WeaponInfoMainJSON).find(weapon => weapon.GameActor.includes(inputID));
                if (!weaponObject) return sendMessage({ client: client, interaction: interaction, content: `Couldn't find that weapon. Make sure you select an autocomplete option.\n${demoDisclaimer}` });

                let weaponStats = "";
                let specialID = weaponObject.SpecialWeapon.split("/");
                specialID = specialID[specialID.length - 1].split(".")[0];
                let subID = weaponObject.SubWeapon.split("/");
                subID = subID[subID.length - 1].split(".")[0];

                await weaponObject.UIParam.forEach(stat => {
                    weaponStats += `\n${stat.Type}: ${stat.Value}`;
                });
                weaponStats += `\nSpecial Points: ${weaponObject.SpecialPoint}`;

                let subImage = `${github}images/subspe/Wsb_${subID}00.png?raw=true`;
                let specialImage = `${github}images/subspe/Wsp_${specialID}00.png?raw=true`;
                let weaponImage = `${github}images/weapon/Wst_${inputID}.png?raw=true`;

                splat3Embed
                    .setAuthor({ name: languageJSON["CommonMsg/Weapon/WeaponName_Main"][inputID], iconURL: subImage })
                    .setThumbnail(specialImage)
                    .addField("Subweapon:", languageJSON["CommonMsg/Weapon/WeaponName_Sub"][subID], true)
                    .addField("Special:", languageJSON["CommonMsg/Weapon/WeaponName_Special"][specialID], true)
                    .addField("Shop:", `${weaponObject.ShopPrice}  (Rank ${weaponObject.ShopUnlockRank}+)`, true)
                    .addField("Stats:", weaponStats, false)
                    .setImage(weaponImage);
                break;
            case "subweapon":
                inputID = interaction.options.getString("subweapon");
                let subweaponMatches = await Object.values(WeaponInfoMainJSON).filter(weapon => {
                    let weaponSubID = weapon.SubWeapon.split("/");
                    weaponSubID = weaponSubID[weaponSubID.length - 1].split(".")[0];
                    if (inputID == weaponSubID) return true;
                });
                if (subweaponMatches.length < 1) return sendMessage({ client: client, interaction: interaction, content: `Couldn't find that subweapon. Make sure you select an autocomplete option.\n${demoDisclaimer}` });
                let allSubweaponMatchesNames = "";
                subweaponMatches.forEach(subweapon => {
                    allSubweaponMatchesNames += `${languageJSON["CommonMsg/Weapon/WeaponName_Main"][subweapon.__RowId]}\n`;
                });
                let subThumbnail = `${github}images/subspe/Wsb_${inputID}00.png?raw=true`;

                splat3Embed
                    .setAuthor({ name: languageJSON["CommonMsg/Weapon/WeaponName_Sub"][inputID] })
                    .setThumbnail(subThumbnail)
                    .setDescription(languageJSON["CommonMsg/Weapon/WeaponExp_Sub"][inputID].replace("\\n", " "))
                    .addField("Weapons:", allSubweaponMatchesNames, false);
                break;
            case "special":
                inputID = interaction.options.getString("special");
                let specialWeaponMatches = await Object.values(WeaponInfoMainJSON).filter(weapon => {
                    let weaponSpecialID = weapon.SpecialWeapon.split("/");
                    weaponSpecialID = weaponSpecialID[weaponSpecialID.length - 1].split(".")[0];
                    if (inputID == weaponSpecialID) return true;
                });
                if (specialWeaponMatches.length < 1) return sendMessage({ client: client, interaction: interaction, content: `Couldn't find that special weapon. Make sure you select an autocomplete option.\n${demoDisclaimer}` });
                let allSpecialWeaponMatchesNames = "";
                specialWeaponMatches.forEach(specialweapon => {
                    allSpecialWeaponMatchesNames += `${languageJSON["CommonMsg/Weapon/WeaponName_Main"][specialweapon.__RowId]}\n`;
                });
                let specialThumbnail = `${github}images/subspe/Wsp_${inputID}00.png?raw=true`;

                splat3Embed
                    .setAuthor({ name: languageJSON["CommonMsg/Weapon/WeaponName_Special"][inputID] })
                    .setThumbnail(specialThumbnail)
                    .setDescription(languageJSON["CommonMsg/Weapon/WeaponExp_Special"][inputID].replace("\\n", " "))
                    .addField("Weapons:", allSpecialWeaponMatchesNames, false);
                break;
        };
        return sendMessage({ client: client, interaction: interaction, content: demoDisclaimer, embeds: splat3Embed });

    } catch (e) {
        // Log error
        logger(e, client, interaction);
    };
};

module.exports.config = {
    name: "splatoon3",
    description: `Shows Splatoon 3 data.`,
    options: [{
        name: "clothing",
        type: "SUB_COMMAND",
        description: "Get info on clothing.",
        options: [{
            name: "clothing",
            type: "STRING",
            description: "Specify a piece of clothing by name.",
            autocomplete: true,
            required: true
        }, {
            name: "ephemeral",
            type: "BOOLEAN",
            description: "Whether the reply will be private."
        }]
    }, {
        name: "weapon",
        type: "SUB_COMMAND",
        description: "Get info on a weapon.",
        options: [{
            name: "weapon",
            type: "STRING",
            description: "Specify a weapon by name.",
            autocomplete: true,
            required: true
        }, {
            name: "ephemeral",
            type: "BOOLEAN",
            description: "Whether the reply will be private."
        }]
    }, {
        name: "subweapon",
        type: "SUB_COMMAND",
        description: "Get info on a subweapon.",
        options: [{
            name: "subweapon",
            type: "STRING",
            description: "Specify a subweapon by name.",
            autocomplete: true,
            required: true
        }, {
            name: "ephemeral",
            type: "BOOLEAN",
            description: "Whether the reply will be private."
        }]
    }, {
        name: "special",
        type: "SUB_COMMAND",
        description: "Get info on a special weapon.",
        options: [{
            name: "special",
            type: "STRING",
            description: "Specify a special weapon by name.",
            autocomplete: true,
            required: true
        }, {
            name: "ephemeral",
            type: "BOOLEAN",
            description: "Whether the reply will be private."
        }]
    }]
};