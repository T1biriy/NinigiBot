exports.run = async (client, interaction) => {
    const logger = require('../../util/logger');
    // Import globals
    let globalVars = require('../../events/ready');
    try {
        const sendMessage = require('../../util/sendMessage');
        const textChannelTypes = require('../../objects/discord/textChannelTypes.json');
        const isAdmin = require('../../util/isAdmin');
        let adminBool = isAdmin(client, interaction.member);
        if (!interaction.member.permissions.has("MANAGE_CHANNELS") && !adminBool) return sendMessage({ client: client, interaction: interaction, content: globalVars.lackPerms });

        let ephemeral = true;
        await interaction.deferReply({ ephemeral: ephemeral });

        const { LogChannels } = require('../../database/dbServices/server.api');
        let oldChannel = await LogChannels.findOne({ where: { server_id: interaction.guild.id } });
        let newLogChannel = interaction.options.getChannel("channel");
        if (!Object.keys(textChannelTypes).includes(newLogChannel.type)) return sendMessage({ client: client, interaction: interaction, content: `No text can be sent to ${newLogChannel}'s type (${newLogChannel.type}) of channel. Please select a text channel.` })
        let disableBool = false;
        let disableArg = interaction.options.getBoolean("disable");
        if (disableArg === true) disableBool = disableArg;

        if (oldChannel) await oldChannel.destroy();
        if (disableBool) return sendMessage({ client: client, interaction: interaction, content: `Disabled logging functionality in **${interaction.guild.name}**.` });
        await LogChannels.upsert({ server_id: interaction.guild.id, channel_id: newLogChannel.id });
        return sendMessage({ client: client, interaction: interaction, content: `Logging has been added to ${newLogChannel}.` });

    } catch (e) {
        // Log error
        logger(e, client, interaction);
    };
};

module.exports.config = {
    name: "log",
    description: "Choose a channel to log to.",
    options: [{
        name: "channel",
        type: "CHANNEL",
        description: "Specify channel.",
        required: true
    }, {
        name: "disable",
        type: "BOOLEAN",
        description: "Disable logging."
    }]
};