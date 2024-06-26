module.exports = async (client, member) => {
    const logger = require('../util/logger');
    try {
        const Discord = require("discord.js");
        const { LogChannels, PersonalRoles, PersonalRoleServers } = require('../database/dbServices/server.api');

        let logChannel = await LogChannels.findOne({ where: { server_id: member.guild.id } });
        if (!logChannel) return;
        let log = member.guild.channels.cache.find(channel => channel.id == logChannel.channel_id);
        if (!log) return;

        let serverID = await PersonalRoleServers.findOne({ where: { server_id: member.guild.id } });
        let roleDB = await PersonalRoles.findOne({ where: { server_id: member.guild.id, user_id: member.id } });
        if (serverID && roleDB) await deleteBoosterRole();
        let botMember = member.guild.members.me;

        if (log.permissionsFor(botMember).has(Discord.PermissionFlagsBits.SendMessages) && log.permissionsFor(botMember).has(Discord.PermissionFlagsBits.EmbedLinks)) {
            let memberLeaveObject = {};
            let embedAuthor = `Member Left 💔`;
            let reasonText = "Not specified.";
            let kicked = false;
            let leaveEmbed = new Discord.EmbedBuilder()
                .setColor(client.globalVars.embedColor)
                .setDescription(`**${member.guild.name}** now has ${member.guild.memberCount} members.`)
                .setTimestamp();
            if (member) {
                let avatar = member.user.displayAvatarURL(client.globalVars.displayAvatarSettings);
                const fetchedLogs = await member.guild.fetchAuditLogs({
                    limit: 1,
                    type: Discord.AuditLogEvent.MemberKick
                });
                let kickLog = fetchedLogs.entries.first();
                // Return if ban exists
                const banLogs = await member.guild.fetchAuditLogs({
                    limit: 1,
                    type: Discord.AuditLogEvent.MemberBanAdd
                });
                if (kickLog && kickLog.createdTimestamp < (Date.now() - 5000)) kickLog = null;
                let banLog = banLogs.entries.first();
                if (banLog && banLog.createdTimestamp < (Date.now() - 5000) && member.id == banLog.target.id) return;
                if (kickLog && kickLog.createdAt > member.joinedAt) {
                    var { executor, target, reason } = kickLog; // Make this cleaner at some point to avoid using var
                    if (target.id !== member.id) return;
                    kicked = true;
                    if (reason) reasonText = reason;
                    embedAuthor = `Member Kicked 💔`;
                };
                let leaveButtons = new Discord.ActionRowBuilder()
                    .addComponents(new Discord.ButtonBuilder({ label: 'Profile', style: Discord.ButtonStyle.Link, url: `discord://-/users/${member.id}` }));
                leaveEmbed
                    .setTitle(embedAuthor)
                    .setThumbnail(avatar)
                    .addFields([{ name: `User:`, value: `${member} (${member.id})`, inline: false }]);
                if (member.joinedAt) leaveEmbed.addFields([{ name: "Joined:", value: `<t:${Math.floor(member.joinedAt.valueOf() / 1000)}:f>`, inline: true }]);
                leaveEmbed
                    .addFields([{ name: "Created:", value: `<t:${Math.floor(member.user.createdAt.valueOf() / 1000)}:f>`, inline: true }])
                    .setFooter({ text: member.user.username });
                if (kicked == true) {
                    leaveEmbed.addFields([{ name: `Reason:`, value: reasonText, inline: false }]);
                    if (executor) leaveEmbed.addFields([{ name: `Executor:`, value: `${executor.username} (${executor.id})`, inline: false }]);
                };
                memberLeaveObject['components'] = [leaveButtons];
            };
            memberLeaveObject['embeds'] = [leaveEmbed];
            return log.send(memberLeaveObject);

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

        async function deleteBoosterRole() {
            let oldRole = member.guild.roles.cache.find(r => r.id == roleDB.role_id);
            if (oldRole) await oldRole.delete();
            await roleDB.destroy();
        };

    } catch (e) {
        // Log error
        logger(e, client);
    };
};