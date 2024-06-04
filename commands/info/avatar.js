import Discord from "discord.js";
import logger from "../../util/logger";
import sendMessage from "../../util/sendMessage";

export default async (client, interaction) => {
    try {
        let user = interaction.options.getUser("user");
        let member = interaction.options.getMember("user");
        // Get avatars
        let avatar = null;
        let serverAvatar = null;
        if (user.avatarURL()) avatar = await user.avatarURL(client.globalVars.displayAvatarSettings);
        if (member && member.avatarURL()) serverAvatar = await member.avatarURL(client.globalVars.displayAvatarSettings);
        if (!avatar && !serverAvatar) return sendMessage({ client: client, interaction: interaction, content: `${user.username} doesn't have an avatar.` });
        if (!serverAvatar) {
            serverAvatar = avatar;
            avatar = null;
        };
        const avatarEmbed = new Discord.EmbedBuilder()
            .setColor(client.globalVars.embedColor)
            .setThumbnail(avatar)
            .setTitle(`${user.username}'s avatar(s):`)
            .setImage(serverAvatar);
        return sendMessage({ client: client, interaction: interaction, embeds: avatarEmbed });

    } catch (e) {
        logger(e, client, interaction);
    };
};

module.exports.config = {
    name: "Avatar",
    type: Discord.ApplicationCommandType.User
};