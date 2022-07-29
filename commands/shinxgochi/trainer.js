

exports.run = async (client, interaction) => {
    const logger = require('../../util/logger');
    // Import globals
    let globalVars = require('../../events/ready');
    try {
        const sendMessage = require('../../util/sendMessage');
        const Discord = require("discord.js");
        const userApi = require('../../database/dbServices/user.api');
        const shinxApi = require('../../database/dbServices/shinx.api');

        let ephemeral = false;
        let ephemeralArg = interaction.options.getBoolean("ephemeral");
        let emotesAllowed = true;
        if (ephemeral == true && !interaction.guild.roles.everyone.permissions.has("USE_EXTERNAL_EMOJIS")) emotesAllowed = false;
        await interaction.deferReply({ ephemeral: ephemeral });
        let embed,avatar;

        let master = interaction.user

        let user, badges;
        switch (interaction.options.getSubcommand()) {
            case "card":
                if (ephemeralArg === false) ephemeral = false;
                user = await userApi.getUser(master.id);
                avatar = client.user.displayAvatarURL(globalVars.displayAvatarSettings);
                embed = new Discord.MessageEmbed()
                .setColor(globalVars.embedColor)
                .setThumbnail(avatar)
                .addFields(
                    { name: "Money:", value: user.money.toString(), inline: true},
                    { name: "Food:", value: user.food.toString(), inline: true},
                )  
                badges = await user.getShopBadges();
                badge_string = '';
                badges.forEach(badge=>{
                    badge_string += ':'+badge.icon+': ';
                })
                badges = await user.getEventBadges();
                badges.forEach(badge=>{
                    badge_string += ':'+badge.icon+': ';
                })
                if (badge_string.length > 0) {
                    embed.addFields(
                        { name: "Badges:", value: badge_string},
                    )
                }
                return sendMessage({ 
                    client: client, 
                    interaction: interaction, 
                    embeds: [embed],  
                    ephemeral: ephemeral });
            case "swapgender":
                if (ephemeralArg === false) ephemeral = false;
                const shinx = await shinxApi.getShinx(master.id)
                return sendMessage({ 
                    client: client, 
                    interaction: interaction, 
                    content: `Your character is now ${shinx.swapAndGetTrainerGender() ? 'male' : 'female'}, ${master}!`})

        };

    } catch (e) {
        // Log error
        logger(e, client, interaction);
    };
};

// Level and Shiny subcommands are missing on purpose
module.exports.config = {
    name: "trainer",
    description: "Check your trainer stats.",
    options: [{
        name: "card",
        type: "SUB_COMMAND",
        description: "Check your trainer card!",
        options: [{
            name: "ephemeral",
            type: "BOOLEAN",
            description: "Whether this command is only visible to you."
        }]
    },{
        name: "swapgender",
        type: "SUB_COMMAND",
        description: "Swap your trainer's gender.",
        options: [{
            name: "ephemeral",
            type: "BOOLEAN",
            description: "Whether this command is only visible to you."
        }]
    }]
};