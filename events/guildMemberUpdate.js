module.exports = async (client, member, newMember) => {
    const logger = require('../util/logger');
    try {
        const Discord = require("discord.js");
        const { LogChannels } = require('../database/dbServices/server.api');
        let logChannel = await LogChannels.findOne({ where: { server_id: member.guild.id } });
        if (!logChannel) return;
        let log = member.guild.channels.cache.find(channel => channel.id == logChannel.channel_id);
        if (!log) return;
        let botMember = member.guild.members.me;

        if (log.permissionsFor(botMember).has(Discord.PermissionFlagsBits.SendMessages) && log.permissionsFor(botMember).has(Discord.PermissionFlagsBits.EmbedLinks)) {
            if (newMember) newMember = await newMember.fetch({ force: true });
            let user = await client.users.fetch(member.id);
            let oldAvatar = member.displayAvatarURL(client.globalVars.displayAvatarSettings);
            let avatar = newMember.displayAvatarURL(client.globalVars.displayAvatarSettings);

            let updateCase = null;
            let topText = null;
            let changeText = null;
            let image = null;
            if (!member.premiumSince && newMember.premiumSince) {
                // Nitro boost start
                updateCase = "nitroStart";
            } else if (member.premiumSince && !newMember.premiumSince) {
                // Nitro boost end
                updateCase = "nitroEnd";
            } else if (member.roles.cache.size !== newMember.roles.cache.size) {
                // Roles updated
                updateCase = null; // TODO
            } else if (member.pending !== newMember.pending) {
                // Pending?
                updateCase = null; // TODO
            } else if (member.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
                // Timeout, check if there's a difference in the timestamps for other actions, might have to add a minimum gap
                updateCase = null; // TODO
            } else if (member.guild !== newMember.guild || member.user !== newMember.user) {
                // I assume this does nothing but I want to be sure because of the weird nickname updates firing
                updateCase = null;
            } else if (oldAvatar !== avatar) {
                // Update server avatar
                updateCase = "guildAvatar";
            } else if (member.nickname !== newMember.nickname) {
                // Nickname change
                updateCase = "nickname";
            };
            if (!updateCase) return;

            let fetchedLogs;
            let executor = null;
            try {
                fetchedLogs = await member.guild.fetchAuditLogs({
                    limit: 1,
                    type: Discord.AuditLogEvent.MemberUpdate
                });
                let memberUpdateLog = fetchedLogs.entries.first();
                if (memberUpdateLog) executor = memberUpdateLog.executor;
                if (executor.id == member.id || (memberUpdateLog && memberUpdateLog.createdTimestamp < (Date.now() - 5000))) executor = null;
            } catch (e) {
                // console.log(e);
                if (e.toString().includes("Missing Permissions")) executor = null;
            };

            const { PersonalRoles, PersonalRoleServers } = require('../database/dbServices/server.api');
            let serverID = await PersonalRoleServers.findOne({ where: { server_id: member.guild.id } });
            let roleDB = await PersonalRoles.findOne({ where: { server_id: member.guild.id, user_id: member.id } });
            if (!newMember.premiumSince && serverID && roleDB && member.permissions && !member.permissions.has(Discord.PermissionFlagsBits.ManageRoles)) await deleteBoosterRole();

            switch (updateCase) {
                case "nickname":
                    topText = "Nickname Changed ⚒️";
                    if (member.nickname && newMember.nickname) {
                        changeText = `Old: **${member.nickname}**\nNew: **${newMember.nickname}**`;
                    } else if (newMember.nickname) {
                        changeText = `New: **${newMember.nickname}**`;
                    } else {
                        changeText = `Removed: **${member.nickname}**`;
                    };
                    break;
                case "nitroStart":
                    topText = "Started Nitro Boosting ⚒️";
                    changeText = `**${member.guild.name}** now has ${member.guild.premiumSubscriptionCount} Nitro Boosts.`;
                    break;
                case "nitroEnd":
                    topText = "Stopped Nitro Boosting ⚒️";
                    changeText = `**${member.guild.name}** will lose this Nitro Boost in 3 days.`;
                    break;
                case "guildAvatar":
                    topText = "Updated Server Avatar ⚒️";
                    image = avatar;
                    break;
                default:
                    return;
            };
            const updateEmbed = new Discord.EmbedBuilder()
                .setColor(client.globalVars.embedColor)
                .setTitle(topText)
                .setThumbnail(oldAvatar);
            if (changeText) updateEmbed.setDescription(changeText);
            updateEmbed.addFields([{ name: `User:`, value: `${user} (${user.id})`, inline: true }]);
            if (executor) updateEmbed.addFields([{ name: `Executor:`, value: `${executor} (${executor.id})`, inline: true }]);
            updateEmbed
                .setImage(image)
                .setFooter({ text: user.username })
                .setTimestamp();
            return log.send({ embeds: [updateEmbed] });

            async function deleteBoosterRole() {
                let oldRole = member.guild.roles.cache.find(r => r.id == roleDB.role_id);
                if (oldRole) {
                    try {
                        await oldRole.delete();
                    } catch (e) {
                        // console.log(e);
                    };
                };
                await roleDB.destroy();
            };

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