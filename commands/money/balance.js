exports.run = async (client, interaction, args = interaction.options._hoistedOptions) => {
    const logger = require('../../util/logger');
    // Import globals
    let globalVars = require('../../events/ready');
    try {
        const sendMessage = require('../../util/sendMessage');
        const { bank } = require('../../database/bank');

        let target;
        if (message.mentions && (message.mentions.members.size > 0 || message.mentions.repliedUser)) {
            target = message.mentions.users.first();
        };

        // Get user
        if (!target && args[0]) {
            let userID = args[0];
            try {
                target = await client.users.fetch(userID);
            } catch (e) {
                // console.log(e);
                target = message.member.user;
            };
        };

        if (!target) target = message.member.user;

        let member;
        try {
            member = await message.guild.members.fetch(target);
        } catch (e) {
            // console.log(e);
            return sendMessage({ client: client, message: message, content: `No member information could be found for this user.` });
        };

        let dbBalance = await bank.currency.getBalance(target.id);
        return sendMessage({ client: client, message: message, content: `**${target.tag}** has ${Math.floor(dbBalance)}${globalVars.currency}.` });

    } catch (e) {
        // Log error
        logger(e, client, interaction);
    };
};

module.exports.config = {
    name: "balance",
    description: "Sends how much money you have."
};