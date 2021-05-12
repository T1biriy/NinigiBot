exports.run = async (client, message) => {
    // Import globals
    let globalVars = require('../../events/ready');
    try {
        const fs = require('fs');
        const PImage = require('pureimage');
        const getTime = require('../../util/getTime');

        let timestamp = await getTime();

        let args = message.content.split(` `);
        if (!args[1]) return message.channel.send(`> Please provide a hex to convert, ${message.author}.`);

        let hex = args[1];
        let formattingHash = "#";
        let rgb = hexToRgb(hex);
        if (hex.startsWith("#")) formattingHash = "";

        if (!rgb) return message.channel.send(`> Please provide a valid hex, ${message.author}.`);

        let imgWidth = 225;
        let imgHeight = 100;
        let img = PImage.make(imgWidth, imgHeight);
        let ctx = img.getContext('2d');
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
        ctx.fillRect(0, 0, imgWidth, imgHeight);

        let imgPath = `hexcolor-${message.author.id}.png`;

        await PImage.encodePNGToStream(img, fs.createWriteStream(imgPath)).then(() => {
            // console.log(`Wrote out image ${imgPath}. (${timestamp})`);
        }).catch((e) => {
            // console.log(e);
            console.log(`Failed to create ${imgPath}. (${timestamp})`);
        });

        await message.channel.send(`> Here's the color for ${formattingHash}${hex}:`, {
            files: [imgPath]
        });

        try {
            fs.unlinkSync(imgPath);
            // console.log(`Deleted image ${imgPath}. (${timestamp})`);
        } catch (e) {
            // console.log(e);
            console.log(`Failed to delete ${imgPath}. (${timestamp})`);
        };

        return;

        function hexToRgb(hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };

    } catch (e) {
        // log error
        const logger = require('../../util/logger');

        logger(e, client, message);
    };
};

module.exports.config = {
    name: "calculator",
    aliases: ["calc"]
};