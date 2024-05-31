module.exports = async (client, oldRole, newRole) => {
    const logger = require('../util/logger');
    try {
        const Discord = require("discord.js");
        const { LogChannels } = require('../database/dbServices/server.api');

        let logChannel = await LogChannels.findOne({ where: { server_id: newRole.guild.id } });
        if (!logChannel) return;
        let log = newRole.guild.channels.cache.find(channel => channel.id == logChannel.channel_id);
        if (!log) return;

        let botMember = newRole.guild.members.me;
        if (log.permissionsFor(botMember).has(Discord.PermissionFlagsBits.SendMessages) && log.permissionsFor(botMember).has(Discord.PermissionFlagsBits.EmbedLinks)) {
            const fetchedLogs = await newRole.guild.fetchAuditLogs({
                limit: 1,
                type: Discord.AuditLogEvent.RoleUpdate
            });
            let updateLog = fetchedLogs.entries.first();
            if (updateLog && updateLog.createdTimestamp < (Date.now() - 5000)) updateLog = null;
            let executor;
            if (updateLog) {
                const { executor: updateExecutor, target } = updateLog;
                if (target.id !== newRole.id) return;
                executor = updateExecutor;
            };
            // Role color
            let embedColor = newRole.hexColor;
            if (embedColor == "#000000") embedColor = client.globalVars.embedColor;
            let updateDescription = `${newRole} (${newRole.id})`;

            const updateEmbed = new Discord.EmbedBuilder()
                .setColor(embedColor)
                .setTitle(`Role Updated ⚒️`)
                .setFooter({ text: newRole.id })
                .setTimestamp();
            if (oldRole.name !== newRole.name) {
                updateEmbed.addFields([
                    { name: `Name:`, value: `Old: ${oldRole.name}\nNew: ${newRole.name}`, inline: true }
                ]);
            };
            if (oldRole.rawPosition !== newRole.rawPosition) {
                updateEmbed.addFields([
                    { name: `Position:`, value: `Old: ${oldRole.rawPosition}\nNew: ${newRole.rawPosition}`, inline: true }
                ]);
            };
            if (oldRole.color !== newRole.color) {
                updateEmbed.addFields([
                    { name: `Color:`, value: `Old: ${oldRole.hexColor}\nNew: ${newRole.hexColor}`, inline: true }
                ]);
            };
            if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
                // Only change that's seperated into two fields for better readability and to avoid hitting character limit on a field
                if (oldRole.permissions.toArray().length > 0 && newRole.permissions.toArray().length > 0) {
                    updateEmbed.addFields([
                        { name: `Old Permissions:`, value: oldRole.permissions.toArray().join(', '), inline: false },
                        { name: `New Permissions:`, value: newRole.permissions.toArray().join(', '), inline: false }
                    ]);
                };
            };
            if (oldRole.icon !== newRole.icon) {
                let oldIcon = oldRole.iconURL(client.globalVars.displayAvatarSettings);
                let newIcon = newRole.iconURL(client.globalVars.displayAvatarSettings);
                updateDescription += "\nIcon updated.";
                updateEmbed
                    .setThumbnail(oldIcon)
                    .setImage(newIcon);
            };
            updateEmbed.setDescription(updateDescription);
            if (executor) updateEmbed.addFields([{ name: 'Updated By:', value: `${executor} (${executor.id})`, inline: false }]);
            return log.send({ embeds: [updateEmbed] });
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