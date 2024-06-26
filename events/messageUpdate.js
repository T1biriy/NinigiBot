module.exports = async (client, message, newMessage) => {
    const logger = require('../util/logger');
    try {
        const Discord = require("discord.js");
        const isAdmin = require('../util/isAdmin');

        if (!message || !message.guild || !message.author || message.author.bot || message.author.system) return;
        if (message.content === newMessage.content) return;

        await message.guild.fetch();
        // Get log
        const { LogChannels } = require('../database/dbServices/server.api');
        let logChannel = await LogChannels.findOne({ where: { server_id: message.guild.id } });
        if (!logChannel) return;
        let log = message.guild.channels.cache.find(channel => channel.id == logChannel.channel_id);
        if (!log) return;

        let botMember = message.guild.members.me;
        // Check message content
        let adminBool = isAdmin(client, botMember);

        if ((log.permissionsFor(botMember).has(Discord.PermissionFlagsBits.SendMessages) && log.permissionsFor(botMember).has(Discord.PermissionFlagsBits.EmbedLinks)) || adminBool) {
            let messageImage = null;
            if (message.attachments.size > 0) messageImage = message.attachments.first().url;
            if (!messageImage && !newMessage.content) return;

            let messageContent = message.content;
            let newMessageContent = newMessage.content
            if (messageContent.length > 1024) messageContent = `${messageContent.substring(0, 1021)}...`;
            if (newMessageContent.length > 1024) newMessageContent = `${newMessageContent.substring(0, 1021)}...`;

            let isReply = false;
            let replyMessage;
            if (message.reference) isReply = true;

            if (isReply) {
                try {
                    replyMessage = await message.channel.messages.fetch(message.reference.messageId);
                } catch (e) {
                    isReply = false;
                };
            };
            let avatar;
            if (newMessage.member) {
                avatar = newMessage.member.displayAvatarURL(client.globalVars.displayAvatarSettings);
            } else {
                avatar = newMessage.author.displayAvatarURL(client.globalVars.displayAvatarSettings);
            };
            let updateButtons = new Discord.ActionRowBuilder()
                .addComponents(new Discord.ButtonBuilder({ label: 'Context', style: Discord.ButtonStyle.Link, url: `discord://-/channels/${message.guild.id}/${message.channel.id}/${message.id}` }));

            const updateEmbed = new Discord.EmbedBuilder()
                .setColor(client.globalVars.embedColor)
                .setTitle(`Message Edited ⚒️`)
                .setThumbnail(avatar)
                .setDescription(`Author:${message.author} (${message.author.id})\nChannel: ${message.channel} (${message.channel.id})`);
            if (messageContent.length > 0) updateEmbed.addFields([{ name: `Before:`, value: messageContent, inline: false }]);
            updateEmbed.addFields([{ name: `After:`, value: newMessageContent, inline: false }]);
            if (isReply && replyMessage && replyMessage.author && replyMessage.content.length > 0) updateEmbed.addFields([{ name: `Replying to:`, value: `"${replyMessage.content.slice(0, 950)}"\n-${replyMessage.author}`, inline: false }]);
            updateEmbed
                .setImage(messageImage)
                .setFooter({ text: message.author.username })
                .setTimestamp(message.createdTimestamp);
            return log.send({ embeds: [updateEmbed], components: [updateButtons] });
        } else if (log.permissionsFor(botMember).has(Discord.PermissionFlagsBits.SendMessages) && !log.permissionsFor(botMember).has(Discord.PermissionFlagsBits.EmbedLinks)) {
            try {
                return log.send({ content: `I lack permissions to send embeds in ${log}.` });
            } catch (e) {
                // console.log(e);
                return;
            };
        } else {
            return;
        };

    } catch (e) {
        // Log error
        logger(e, client, message);
    };
};