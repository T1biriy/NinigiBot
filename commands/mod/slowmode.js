module.exports.run = async (client, message, args) => {
    // Import globals
    let globalVars = require('../../events/ready');
    try {
        const isAdmin = require('../../util/isAdmin');
        let adminBool = await isAdmin(message.member, client);
        if (!message.member.permissions.has("MANAGE_CHANNELS") && !adminBool) return sendMessage(client, message, globalVars.lackPerms);

        let arg = args[0];
        if (!arg) arg = 0;
        if (isNaN(arg) || arg < 0) return message.channel.send(`> You need to provide a valid number (seconds) to change the slowmode to, ${message.author}.`);
        if (arg > 21600) arg = 21600;

        await message.channel.setRateLimitPerUser(arg);
        return message.channel.send(`> Slowmode changed to ${arg} seconds, ${message.author}.`);

    } catch (e) {
        // log error
        const logger = require('../../util/logger');

        logger(e, client, message);
    };
};

module.exports.config = {
    name: "slowmode",
    aliases: ["slow"]
};