exports.run = async (client, interaction, logger, globalVars) => {
    try {
        const sendMessage = require('../../util/sendMessage');
        const Discord = require("discord.js");
        const Minesweeper = require('discord.js-minesweeper');

        let correctionString = "";
        let rows = 5;
        let columns = 5;
        let minesFloor = 1;
        let minesCapPercentage = 50;
        let rowsArg = interaction.options.getInteger("rows");
        let columnsArg = interaction.options.getInteger("columns");
        if (rowsArg) rows = rowsArg;
        if (columnsArg) columns = columnsArg;

        let mines = Math.ceil((rows * columns) / 5); // ~20% mine ratio by default
        let minesArg = interaction.options.getInteger("mines");
        if (minesArg) {
            let minesCap = Math.ceil((rows * columns) / 2 - 1); // Cap at 50% mine ratio (otherwise board generation fails idk why)
            if (minesArg > minesCap || minesArg < minesFloor) {
                correctionString += `\nAmount of mines has to be between ${minesFloor} mine and ${minesCapPercentage}% (${minesCap} in this scenario) of the board.`;
                if (minesArg > minesCap) mines = minesCap;
                if (minesArg < minesFloor) mines = minesFloor;
            } else {
                mines = minesArg;
            };
        };
        const minesweeper = new Minesweeper({
            rows: rows,
            columns: columns,
            mines: mines,
            emote: 'bomb',
            returnType: 'matrix',
        });
        let bombEmote = "💣";
        let spoilerEmote = "⬛";
        let matrix = minesweeper.start();
        matrix.forEach(arr => {
            for (var i = 0; i < arr.length; i++) {
                arr[i] = arr[i].replace("|| :bomb: ||", bombEmote).replace("|| :zero: ||", "0️⃣").replace("|| :one: ||", "1️⃣").replace("|| :two: ||", "2️⃣").replace("|| :three: ||", "3️⃣").replace("|| :four: ||", "4️⃣").replace("|| :five: ||", "5️⃣").replace("|| :six: ||", "6️⃣").replace("|| :seven: ||", "7️⃣").replace("|| :eight: ||", "8️⃣");
            };
        });
        let buttonRowArray = [];
        let buttonIndex = 0;
        let rowIndex = 0;
        matrix.forEach(arr => {
            let buttonRow = new Discord.MessageActionRow();
            arr.forEach(element => {
                buttonRow.addComponents(new Discord.MessageButton({ customId: `minesweeper${rowIndex}-${buttonIndex}-${element}`, style: 'PRIMARY', emoji: spoilerEmote }));
                buttonIndex += 1;
            });
            rowIndex += 1;
            buttonRowArray.push(buttonRow);
        });

        let returnString = `Here is your minesweeper grid!`;
        if (correctionString.length > 0) returnString += `\n${correctionString}`;
        return sendMessage({ client: client, interaction: interaction, content: returnString, components: buttonRowArray });

    } catch (e) {
        // Log error
        logger(e, client, interaction);
    };
};

module.exports.config = {
    name: "minesweeper",
    aliases: [],
    description: "Play minesweeper.",
    options: [{
        name: "mines",
        type: "INTEGER",
        description: "Amount of mines.",
        minValue: 1
    }, {
        name: "rows",
        type: "INTEGER",
        description: "Amount of rows.",
        minValue: 2,
        maxValue: 5
    }, {
        name: "columns",
        type: "INTEGER",
        description: "Amount of columns.",
        minValue: 2,
        maxValue: 5
    }]
};