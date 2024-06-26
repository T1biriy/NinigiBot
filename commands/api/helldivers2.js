import {
    EmbedBuilder,
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder
} from "discord.js";
import globalVars from "../../objects/globalVars.json" with { type: "json" };
import logger from "../../util/logger.js";
import sendMessage from "../../util/sendMessage.js";
import axios from "axios";

let api = "https://helldiverstrainingmanual.com/api/v1/";
let liberationString = "Liberation";
let defenseString = "Defense";

export default async (client, interaction, ephemeral) => {
    try {
        let ephemeralArg = interaction.options.getBoolean("ephemeral");
        if (ephemeralArg !== null) ephemeral = ephemeralArg;
        let campaignStatus = null;

        await interaction.deferReply({ ephemeral: ephemeral });
        let helldiversEmbed = new EmbedBuilder()
            .setColor(globalVars.embedColor);

        switch (interaction.options.getSubcommand()) {
            case "planet":
                let inputPlanet = interaction.options.getString("planet");
                let planetsResponse = await axios.get(`${api}planets`);
                let planetsData = planetsResponse.data;
                let planetObject = Object.entries(planetsData).find(([key, value]) => value.name.toLowerCase() == inputPlanet.toLowerCase());
                if (!planetObject) return sendMessage({ client: client, interaction: interaction, content: "Could not find the specified planet." });
                let planetIndex = planetObject[0];
                planetObject = planetObject[1];
                let planetSector = `${planetObject.sector} Sector`;
                // Campaign status data is of all planets, so always requested and then checked if requested planet is in the data
                campaignStatus = await axios.get(`${api}war/campaign`);
                let campaignStatusPlanet = campaignStatus.data.find(planet => planet.planetIndex == planetIndex);
                let campaignStatusString = "";
                if (campaignStatusPlanet) {
                    campaignStatusString = `${liberationString} vs. ${campaignStatusPlanet.faction}`;
                    if (campaignStatusPlanet.defense == true) campaignStatusString = campaignStatusString.replace(liberationString, defenseString);
                    campaignStatusString += `\nProgress: ${Math.round(campaignStatusPlanet.percentage * 100) / 100}%\nHelldivers: ${campaignStatusPlanet.players}`;
                    if (campaignStatusPlanet.expireDateTime) campaignStatusString += `\nWithdrawal <t:${Math.floor(campaignStatusPlanet.expireDateTime)}:R>`;
                };
                let planetBiome = null;
                if (planetObject.biome) {
                    planetBiome = planetObject.biome.slug.charAt(0).toUpperCase() + planetObject.biome.slug.slice(1); // Capitalize first letter
                    helldiversEmbed.addFields([{ name: `${planetBiome} Biome:`, value: planetObject.biome.description, inline: false }]);
                };
                // Environmental effects like earthquakes, extreme weather effects etc.
                let environmentals = "None.";
                if (planetObject.environmentals && planetObject.environmentals.length > 0) {
                    environmentals = "";
                    planetObject.environmentals.forEach(environmental => {
                        environmentals += `**${environmental.name}**: ${environmental.description}\n`;
                    });
                };
                helldiversEmbed
                    .setTitle(`${planetObject.name} - ${planetSector}`)
                    .addFields([{ name: "Environmentals:", value: environmentals, inline: true }]);
                if (campaignStatusPlanet) helldiversEmbed.addFields([{ name: "Campaign Status:", value: campaignStatusString, inline: false }]);
                break;
            case "campaign":
                campaignStatus = await axios.get(`${api}war/campaign`);
                campaignStatus = campaignStatus.data;
                await campaignStatus.forEach(async planet => {
                    let planetStatusTitle = planet.name;
                    if (planet.majorOrder) planetStatusTitle += ` (Major Order)`;
                    let planetStatusString = `${liberationString} vs. ${planet.faction}`;
                    if (planet.defense == true) planetStatusString = planetStatusString.replace(liberationString, defenseString);
                    planetStatusString += `\nProgress: ${Math.round(planet.percentage * 100) / 100}%\nHelldivers: ${planet.players}`;
                    if (planet.expireDateTime) planetStatusString += `\nWithdrawal <t:${Math.floor(planet.expireDateTime)}:R>`;
                    helldiversEmbed.addFields([{ name: `${planet.name}`, value: planetStatusString, inline: true }]);
                });
                helldiversEmbed.setTitle("Campaign Status");
                break;
        };
        return sendMessage({ client: client, interaction: interaction, embeds: helldiversEmbed, ephemeral: ephemeral });

    } catch (e) {
        logger(e, client, interaction);
    };
};

// String options
const planetOption = new SlashCommandStringOption()
    .setName("planet")
    .setDescription("Specify planet by name.")
    .setAutocomplete(true)
    .setRequired(true);
// Boolean options
const ephemeralOption = new SlashCommandStringOption()
    .setName("ephemeral")
    .setDescription(globalVars.ephemeralOptionDescription);
// Subcommands
const planetSubcommand = new SlashCommandSubcommandBuilder()
    .setName("planet")
    .setDescription("Get info on a planet.")
    .addStringOption(planetOption)
    .addBooleanOption(ephemeralOption);
const campaignSubcommand = new SlashCommandSubcommandBuilder()
    .setName("campaign")
    .setDescription("Get info on current campaigns.")
    .addBooleanOption(ephemeralOption);
// Full command
export const config = new SlashCommandBuilder()
    .setName("helldivers2")
    .setDescription("Shows Helldivers 2 info.")
    .addSubcommand(planetSubcommand)
    .addSubcommand(campaignSubcommand);