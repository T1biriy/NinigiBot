import {
    EmbedBuilder,
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder
} from "discord.js";
import logger from "../../util/logger.js";
import sendMessage from "../../util/sendMessage.js";
import isOwner from "../../util/isOwner.js";
import globalVars from "../../objects/globalVars.json" with { type: "json" };
import config from "../../config.json" with { type: "json" };

export default async (client, interaction, ephemeral) => {
    try {
        let ownerBool = await isOwner(client, interaction.user);
        if (!ownerBool) return sendMessage({ client: client, interaction: interaction, content: globalVars.lackPermsString });

        ephemeral = true;

        const entitlementEmbed = new EmbedBuilder()
            .setColor(globalVars.embedColor)
            .setTitle("SKUs & Entitlements");

        let SKUs = await client.application.fetchSKUs();
        let entitlements = await client.application.entitlements.fetch({ excludeEnded: true });

        for await (let [SKUID, SKU] of SKUs) {
            let userList = [];
            let entitlementsSKU = entitlements.filter(entitlement => entitlement.skuId == SKU.id);
            if (entitlementsSKU.length < 1) continue;
            for await (let [entitlementID, entitlement] of (entitlementsSKU)) {
                let entitlementUser = await entitlement.fetchUser();
                userList.push(`${entitlementUser.username} (${entitlementUser.id})`);
            };
            if (userList.length > 0) entitlementEmbed.addFields([{ name: SKU.name, value: userList.join("\n") }]);
        };

        return sendMessage({ client: client, interaction: interaction, embeds: entitlementEmbed, ephemeral: ephemeral });

    } catch (e) {
        logger(e, client, interaction);
    };
};

export const guildIDs = [config.devServerID];

// Subcommands
const infoSubcommand = new SlashCommandSubcommandBuilder()
    .setName("info")
    .setDescription("See info.");
// Final command
export const commandObject = new SlashCommandBuilder()
    .setName("sku")
    .setDescription("Interact with SKUs.")
    .setDMPermission(false)
    .addSubcommand(infoSubcommand);