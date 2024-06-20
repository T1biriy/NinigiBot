import Discord from "discord.js";
import logger from "../../util/logger.js";
import sendMessage from "../../util/sendMessage.js";
import globalVars from "../../objects/globalVars.json" with { type: "json" };
import isAdmin from "../../util/isAdmin.js";

const requiredPermission = Discord.PermissionFlagsBits.ManageMessages;

export default async (client, interaction, ephemeral) => {
    try {

        let adminBool = isAdmin(client, interaction.member);
        if (!interaction.member.permissions.has(requiredPermission) && !adminBool) return sendMessage({ client: client, interaction: interaction, content: globalVars.lackPerms });

        let ephemeralArg = interaction.options.getBoolean("ephemeral");
        if (ephemeralArg !== null) ephemeral = ephemeralArg;
        await interaction.deferReply({ ephemeral: ephemeral });

        let returnString = "";
        let amount = interaction.options.getInteger("amount");
        // Get users
        let user = null;
        let userArg = interaction.options.getUser("user");
        if (userArg) user = userArg;

        let deleteFailString = `An error occurred while bulk deleting.`;
        let missingMessagesString = `\nSome messages were not deleted, probably because they were older than 2 weeks.`;
        // Fetch 100 messages (will be filtered and lowered up to max amount requested), delete them and catch errors
        if (user) {
            try {
                let messagesAll = await interaction.channel.messages.fetch({ limit: amount });
                let messagesFiltered = await messagesAll.filter(m => m.author.id == user.id);
                let messages = Object.values(Object.fromEntries(messagesFiltered)).slice(0, amount);
                await interaction.channel.bulkDelete(messages, [true])
                    .then(messagesDeleted => {
                        returnString = `Deleted ${messagesDeleted.size} messages from ${user.username} within the last ${amount} messages.`;
                        if (messagesDeleted.size < amount) returnString += missingMessagesString;
                        sendMessage({ client: client, interaction: interaction, content: returnString });
                    });
                return;
            } catch (e) {
                if (e.toString().includes("Missing Permissions")) {
                    return logger(e, client, interaction);
                } else {
                    // console.log(e);
                    return sendMessage({ client: client, interaction: interaction, content: deleteFailString });
                };
            };
        } else {
            try {
                let messages = await interaction.channel.messages.fetch({ limit: amount });
                await interaction.channel.bulkDelete(messages, [true])
                    .then(messagesDeleted => {
                        returnString = `Deleted ${messagesDeleted.size} messages.`;
                        if (messagesDeleted.size < amount) returnString += missingMessagesString;
                        sendMessage({ client: client, interaction: interaction, content: returnString });
                    });
                return;
            } catch (e) {
                if (e.toString().includes("Missing Permissions")) {
                    return logger(e, client, interaction);
                } else {
                    if (e.toString().includes("Missing Permissions")) {
                        return logger(e, client, interaction);
                    } else {
                        // console.log(e);
                        return interaction.channel.send({ content: deleteFailString });
                    };
                };
            };
        };

    } catch (e) {
        logger(e, client, interaction);
    };
};

export const config = {
    name: "purge",
    description: "Bulk delete messages.",
    default_member_permissions: requiredPermission,
    options: [{
        name: "amount",
        type: Discord.ApplicationCommandOptionType.Integer,
        description: "The amount of messages to delete.",
        required: true,
        minValue: 0,
        maxValue: 100
    }, {
        name: "user",
        type: Discord.ApplicationCommandOptionType.User,
        description: "The user to delete messages from."
    }, {
        name: "ephemeral",
        type: Discord.ApplicationCommandOptionType.Boolean,
        description: "Whether the response should be ephemeral."
    }]
};