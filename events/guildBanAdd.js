module.exports = async (client, guildBan) => {
    const logger = require('../util/logger');
    try {
        const Discord = require("discord.js");
        const { LogChannels } = require('../database/dbServices/server.api');

        let logChannel = await LogChannels.findOne({ where: { server_id: guildBan.guild.id } });
        if (!logChannel) return;
        let log = guildBan.guild.channels.cache.find(channel => channel.id == logChannel.channel_id);
        if (!log) return;

        const fetchedLogs = await guildBan.guild.fetchAuditLogs({
            limit: 1,
            type: Discord.AuditLogEvent.MemberBanAdd
        });

        let botMember = guildBan.guild.members.me;

        if (log.permissionsFor(botMember).has(Discord.PermissionFlagsBits.SendMessages) && log.permissionsFor(botMember).has(Discord.PermissionFlagsBits.EmbedLinks)) {
            let banLog = fetchedLogs.entries.first();
            if (banLog && banLog.createdTimestamp < (Date.now() - 5000)) banLog = null;
            if (!banLog) return;
            let executor = banLog.executor;
            let target = banLog.target;
            let reason = banLog.reason;
            if (!executor || !target) return;
            if (reason == null) reason = "Not specified.";
            if (target.id !== guildBan.user.id) return;

            // let avatarExecutor = executor.displayAvatarURL(client.globalVars.displayAvatarSettings); // Unused
            let avatarTarget = target.displayAvatarURL(client.globalVars.displayAvatarSettings);

            let banButtons = new Discord.ActionRowBuilder()
                .addComponents(new Discord.ButtonBuilder({ label: 'Profile', style: Discord.ButtonStyle.Link, url: `discord://-/users/${target.id}` }));
            const banEmbed = new Discord.EmbedBuilder()
                .setColor(client.globalVars.embedColor)
                .setTitle(`Member Banned 💔`)
                .setThumbnail(avatarTarget)
                .setDescription(`**${guildBan.guild.name}** now has ${guildBan.guild.memberCount} members.`)
                .addFields([
                    { name: `User:`, value: `${target} (${target.id})`, inline: false },
                    { name: `Reason:`, value: reason, inline: false },
                    { name: `Executor:`, value: `${executor} (${executor.id})`, inline: false }
                ])
                .setFooter({ text: target.username })
                .setTimestamp();
            return log.send({ embeds: [banEmbed], components: [banButtons] });

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
        logger(e, client);
    };
};