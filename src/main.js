//*****************************************************************************
//*********************    JavaScript Source Code    **************************
//*****************************************************************************
//  DESIGNER NAME:  Alani, Hamzah
//        PROJECT:  Bean Bot
//    GITHUB DOCS:  TODO
//
//-----------------------------------------------------------------------------
//
// DESCRIPTION:
// Bean Bot is a discord bot programmed by I (Alani, the GREAT) to ... well, 
// help maintain the server while adding extra fun activities to the board.
// In other words DO MY JOB FOR ME.
// 
// I gave birt— *ahem* I meant.... bot created Dec. 18th, 2025.
// Release date: ...
//
//*****************************************************************************
//*****************************************************************************


////////////////
// MAIN SETUP //
////////////////

// main npm library
require('dotenv').config(); // env file
const { ApplicationCommand } = require('discord.js');
const { REST, Routes, ApplicationCommandOptionType, Application, Client, GatewayIntentBits, ActivityType, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder, quote, AttachmentBuilder } = require("discord.js");
const cron = require("node-cron");
const fs = require("fs");


// global variables
let trustedChannelID = "673923554856927284"; // TODO make sure we got a trusted channel
let loadingMessage = `\n <a:loading:1451198424236953683> Loading . . . `;
let commandCycle = 0;
let maxCycle = 0;

// Init discord bot perms
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // For guild-related events
        GatewayIntentBits.GuildMembers, // Required to detect new members
        GatewayIntentBits.GuildMessages,  // For message events in guilds
        GatewayIntentBits.MessageContent // To read the content of messages
    ]
});

// saved file system
const COMMANDS_FILE = "./storage/beangames-commands.json"
const BRAIN_FILE = "./storage/brain.json"

// read file
function readFile(FILE) {
    if (!fs.existsSync(FILE)) return {}
    return JSON.parse(fs.readFileSync(FILE, "utf8"))
}
// save to file
function writeFile(data, FILE){
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}


// quick functions, random num gen
let roll = (num)=> num-Math.ceil(Math.random()*num)+1;
let flipCoin = () => Math.random()>5?"heads":"tails";




//////////////////////
/// SLASH COMMANDS ///
//////////////////////

// registering slash commands
const initSlashCommands = async function (guildID) {
    
    // defining slash commands
    const commands = [
        {
            name: "eval",
            description: "Run JS code inside the interactions function",
            options: [{
                // CODE
                name: "javascript",
                description: "Enter JS Code to run",
                type: ApplicationCommandOptionType.String,
                required: true
            }]
        },{
            name: "roll",
            description: "roll a dice, get a random number",
            options: [{
                // SIDES
                name: "sides",
                description: "Number of sides",
                type: ApplicationCommandOptionType.Integer,
                required: false 
            }]
        },{
            name: "flip",
            description: "flip a coin!",
        },{
            name: "beangames",
            description: "Begin the BEAN GAMES!!",
            options: [{
                name: "members",
                description: "How many members will partake in the Bean Games",
                type: ApplicationCommandOptionType.Integer,
                required: true
            }]
        },{
            name: "beangames-commands",
            description: "View & manage all current commands in the bean games",
            options: [{
                name: "command-number",
                description: "Quickly select a command by index number",
                type: ApplicationCommandOptionType.Integer,
                required: false
            }]
        },{
            name: "add-beangames-command",
            description: "Select to add new BeanGames command",
            options: [{
                name: "command",
                description: "Describe the command; make sure to use player# as placeholder",
                type: ApplicationCommandOptionType.String,
                required: true
            },{
                name: "number-of-players",
                description: "Number of players command includes (highest player# used)",
                type: ApplicationCommandOptionType.Integer,
                required: true
            },{
                name: "first-killed-player",
                description: "Number of first player killed (if any)",
                type: ApplicationCommandOptionType.Integer,
                required: false
            },{
                name: "second-killed-player",
                description: "Number of second player killed (if any)",
                type: ApplicationCommandOptionType.Integer,
                required: false
            },{
                name: "third-killed-player",
                description: "Number of third player killed (if any)",
                type: ApplicationCommandOptionType.Integer,
                required: false
            },{
                name: "command-mode",
                description: "Under which mode is this command possible? (ex: \"day\" or \"night\")",
                type: ApplicationCommandOptionType.String,
                required: false
            },{
                name: "command-mode-2",
                description: "Under which mode is this command possible? (ex: \"day\" or \"night\")",
                type: ApplicationCommandOptionType.String,
                required: false
            }]
        }

    ];

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        // try to register the slash commands
        console.log("Registering slash commands...");

        await rest.put(
            Routes.applicationGuildCommands('1450980085581746238', guildID),
            {
                body: commands
            }
        );

        // if we made it thus far then slash commands have been registered
        console.log("Slash commands were registered successfully :D");
    } catch (error) {
        console.log(`There was an error, register commands file:\n${error}`);
    }
}

// START SERVER
client.on("clientReady", (c) => {
    console.info(`
        |==/   /====== ||\\ \\\\\\\\  ||
        | /    \\______ ||\\\\ \\\\ \\ ||
        | ====\\ \\----- ||_\\\\ \\\\ \\||
        |_=___=\\ \\==== ||  \\\\ \\\\ \\|

      ${c.user.tag} is alive!
    `);

    // client.user.setActivity({
    //     name: "Watching this epic video, check it out",
    //     type: ActivityType.Streaming,
    //     url: "https://www.youtube.com/watch?v=00WCEbKM_SE"
    // })


    // client.user.setAvatar('./assets/pfp/default.png')
    //   .then(user => console.log(`New avatar set!`))
    //   .catch(console.error);

    client.user.setPresence({ activities: [{ name: 'with your feelings >:)' }], status: 'online' });


    // default trusted guild ID (TODO)
    cron.schedule('* * * * *', async () => {
        console.log('BEEN A MINUTE!!', new Date().toISOString())
        const channel = await client.channels.fetch(trustedChannelID).catch(() => null);
        try {
            // await channel.send('cron ping ⏱')
        } catch (e) {
            console.error('cron send failed:', e.message)
        }
    })


    //   initSlashCommands('673923554315730966')

})




// call this before you start the bot
async function boot() {
    await client.login(process.env.TOKEN)
}
boot().catch(err => {
    console.error('oof, encountered boot error:', err);
})





////////////////
// MODERATION //
////////////////

// used for mute duration, minutes to milliseconds
const minToMS = (min)=> min * 60 * 1000;
// Arrays that reset every minute and hour
var spamTrack = [];
var muteHistory = [];
// every minute
cron.schedule("* * * * *", async () => {
    spamTrack = []; // Clear the array
});
// every hour
cron.schedule("0 * * * *", async () => {
    muteHistory = []; // Clear the mute history every hour

});
const unallowedWords = [
    'prn'
];
const unallowedTerms = [
    'porn','sex'
];
function moderationAlgo(text,author){
    spamTrack.push(author);
    let mute = {
        safe: true,
        duration: 0,
        reason: []
    }
    // check criminal record
    let cr = muteHistory.join(",").split(author).length +1;
    
    // checking for spam (sending over 10 messages per minute)
    if(spamTrack.join(",").split(author).length>10){
        mute.safe = false;
        mute.duration += 1 * cr;
        mute.reason.push("- spamming");

        muteHistory.push(author);
    }

    // PROFANITY CHECK
    text = (Object.entries({ 
        "@": "a", "3": "e", "$": "s", "0": "o"
    }).reduce((t, [k, v]) => t.replaceAll(k, v), text)).replace(/[().?!<>|{}[]`'";:]/g, '');
    
    // checking for general TEXT (less strict, needs to be more specific)
    unallowedTerms.forEach( element => {
        if(text.split(element).length>1){
            mute.safe = false;
            mute.duration += 3 * cr; // less forgiving as this is more specific
            mute.reason.push(`- language – watch it bro`);
        }
    })
    // checking for WORDS (more strict)
    if(mute.safe) // possibility we already caught the bad word with previous check
        text.split(" ").forEach(element => {
            // get rid of all vowels
            let wrd = element.replace(/[aeiouy]/g, '')
            if(unallowedWords.includes(wrd)){
                mute.safe = false;
                mute.duration += 2 * cr;
                mute.reason.push(`- language – ||${element}||`);
            }
        });


    return mute;
}





/////////////
// REPORTS //
/////////////

// sending report to a bot reporting channel
async function sendReport(guild, messageContent, attachment = false) {
    try {
        // Find the "bot" text channel
        let botChannel = guild.channels.cache.find(channel => channel.name.includes('bot-reports') && channel.isTextBased());
        // get the admin role
        const adminRole = guild.roles.cache.find(role => role.name.toLowerCase().includes('admin'));
        
        // If the channel doesn't exist, create it
        if (!botChannel){
            botChannel = await guild.channels.create({
                name: 'bot-reports',
                type: 0, // 0 for text channels in Discord.js v14+
                reason: 'Created to log bot reports',
                permissionOverwrites: [
                    { // prevent everyone from viewing channel
                        id: guild.roles.everyone.id,
                        deny: ['ViewChannel']
                    },
                    { // allow admins to view channel and send messages
                        id: adminRole.id,
                        allow: ['ViewChannel', 'SendMessages']
                    },
                    { // allow bot to send messages as well
                        id: guild.client.user.id,
                        allow: ['SendMessages', 'ViewChannel']
                    }
                ]
            });

            console.log('Bot channel created successfully.');
        }

        // Send the report to the "bot" channel
        botChannel.send(messageContent);
        if(attachment) // if attachment exists then send file
            botChannel.send({ files: [attachment.url] });
    } catch(err) {
        console.error('Error in sendReport function: ', err);
    }
}




//////////////////
// INTERACTIONS //
//////////////////

client.on('messageCreate', async (message) => {
    console.log(message.content);
    let text = message.content.toLowerCase().trim();
    let send = (M) => message.channel.send(M);
    let user = message.author;

    // ignore if it's a message we send (no need for dog tail chase)
    if(message.author.id == "1450980085581746238")
        return;

    // tell admin/ moderators apart from regular members
    try{
        await message.guild.members.fetch(user.id)
    }catch(err){
        console.warn(err);
        return;
    }
    const member = await message.guild.members.fetch(user.id)
    const isAdmin = (member.permissions.has('Administrator') || member.permissions.has('ManageMessages'));
    const roleHardRShame = message.guild.roles.cache.find(r => r.name.toLowerCase().includes("hard r"));
    const guildID = message.guild.id;
    const channelID = message.channel.id;

    // get all brain data right away
    var brainData = await readFile(BRAIN_FILE);

    // BINARY COUNTER
    if(brainData[`g${guildID}`] && brainData[`g${guildID}`].channel == channelID){
        var binaryCount = parseInt(text.replaceAll(" ",""), 2);
        if(binaryCount){
            if(binaryCount == brainData[`g${guildID}`].count+1){
                brainData[`g${guildID}`].count += 1;
                await writeFile(brainData,BRAIN_FILE); // <-- update brain data
                message.react("✅");
            }else{
                message.react("❌");
            }
        }
    }

    // INIT BINARY COUNTING CHANNEL
    if(text === "init binary counting"){
        // const channelKey = `g${guildID}-c${channelID}`;
        brainData[`g${guildID}`] = {channel: channelID, count: 0};
        await writeFile(brainData,BRAIN_FILE); // <-- update brain data
        send("✅ This channel has been set as the Binary Counting Channel!\nStart counting at 1 :D");
        return;
    }





    // await send(message.author.id);
    
    
    // // MODERATION STEPS
    // let modCheck = moderationAlgo(text,message.author.id);
    // console.log(modCheck)
    // if(!modCheck.safe){
    //     await message.reply(
    //         `wooooah !\nYou've been muted for ${modCheck.duration} minutes for \n${modCheck.reason.join("\n")}`
    //     );
    //     if(isAdmin)
    //         send("You're lucky you got perms")
    //     else{ // TODO: make sure we have the right permissions to mute people, ignore for admins, delete message
    //         member.timeout(minToMS(modCheck.duration), modCheck.reason.join(", ")); 
    //         sendReport(message.guild,
    //             `# User ${user} muted for ${modCheck.duration} minutes\n**Reason:**\n${modCheck.reason.join("\n")}\n\n***Last message send:***\n\`\`\`${message.content}\`\`\``
    //         )
    //         await message.delete();
    //         return;
    //     }
    // }


    // initializing slash commands
    if (text === "init") {
        message.reply("Initiating slash commands...");
        trustedChannelID = message.channel.id;
        await initSlashCommands(message.guild.id.toString());
        send("Initalized slash commands successfully ✅");
        console.info(":D");
        return;
    }



    // 



    // // simple hello :D
    // if (text === "hello" || text === "hi") {
    //     // send("Hey there!");
    //     send(`How are you ${user}`)
    // }

    // HARD R SHAME
    if((text.includes("nigger") || text.includes("nga")) && roleHardRShame){
        if (!member.roles.cache.has(roleHardRShame.id)){
            await member.roles.add(roleHardRShame);
            send(`YO YO YO ${user} *chill!*\nYou've been given the \`Hard R Shame role\` for that bro`);
        }else
            send(`yo ${user} WASSUP MY N—\n-# note i am black so im allowed to say it n🥚a`);
        return;
    }



    // COMMANDS
    if (text.includes("slap ")) {
        const slapGIFS = [ // slap GIFs
            "https://media.tenor.com/zXqvIewp3ToAAAAd/asobi-asobase.gif",
            "https://media.tenor.com/Ws6Dm1ZW_vMAAAAd/girl-slap.gif",
            "https://media.tenor.com/X2WGK2fbenEAAAAd/peak.gif",
            "https://media.tenor.com/XiYuU9h44-AAAAAd/anime-slap-mad.gif",
            "https://media.tenor.com/68_5cN3wpJcAAAAd/slap-anime-girl.gif",
            "https://media.tenor.com/wOCOTBGZJyEAAAAd/chikku-neesan-girl-hit-wall.gif",
            "https://media.tenor.com/eU5H6GbVjrcAAAAd/slap-jjk.gif",
            "https://media.tenor.com/cpWuWnOU64MAAAAd/bofetada.gif",
            "https://media.tenor.com/HTHoXnBc400AAAAd/in-your-face-slap.gif",
            "https://media.tenor.com/7xFcP1KWjY0AAAAd/no.gif",
            "https://media.tenor.com/nVvUhW4FBxcAAAAd/slap.gif",
            "https://media.tenor.com/sacuMyU4lkwAAAAd/anime-girl-anime.gif"

        ];

        const gif = slapGIFS[Math.floor(Math.random() * slapGIFS.length)];
        const embed = new EmbedBuilder()
        .setTitle(`${user.displayName.toUpperCase()} SLAPPED ${text.split("slap")[1].toUpperCase()}`)
        .setDescription("oof that looks like it hurt :0")
        .setColor("#BC6105")
        .setImage(gif)
    
        await message.channel.send({ embeds: [embed],allowedMentions: { users: [message.author.id] } })
        return;
    }

    // COMMANDS
    if (text.includes("punch ")) {
        const punchGIFS = [ // slap GIFs
            "https://media.tenor.com/6a42QlkVsCEAAAAd/anime-punch.gif",
            "https://media.tenor.com/gmvdv-e1EhcAAAAd/weliton-amogos.gif",
            "https://media.tenor.com/UH8Jnl1W3CYAAAAd/anime-punch-anime.gif",
            "https://media.tenor.com/p_mMicg1pgUAAAAd/anya-forger-damian-spy-x-family.gif",
            "https://media.tenor.com/o8RbiF5-9dYAAAAd/killua-hxh.gif",
            "https://media.tenor.com/ccdazTROjecAAAAd/one-punch-man-saitama.gif",

        ];

        const gif = punchGIFS[Math.floor(Math.random() * punchGIFS.length)];
        const embed = new EmbedBuilder()
        .setTitle(`${user.displayName.toUpperCase()} PUNCHED ${text.split("punch")[1].toUpperCase()}`)
        .setDescription("what did bro do to deserve this 🫣")
        .setColor("#BC6105")
        .setImage(gif)
    
        await message.channel.send({ embeds: [embed],allowedMentions: { users: [message.author.id] } })
        return;
    }

    // COMMANDS
    if (text.split(" ")[0]==="kiss") {
        if(text.includes("pante") || text.includes("moose") || text.includes("alani") || text.includes("aydan") || text.includes("epic beans")){
            send(`holdddup ${user} I won't let you kiss them, ${text.split(" ")[1].toUpperCase()} IS MINE`);
        }else{
            const kissGIFS = [ // slap GIFs
                "https://hamzah.page/files/gif15.gif",
                "https://hamzah.page/files/gif3.gif",
                "https://hamzah.page/files/gif4.gif",
                "https://hamzah.page/files/gif5.gif",
                "https://hamzah.page/files/gif1.gif",
                "https://hamzah.page/files/gif2.gif",
                "https://hamzah.page/files/gif6.gif",
                "https://hamzah.page/files/gif7.gif",
                "https://hamzah.page/files/gif8.gif",
                "https://hamzah.page/files/gif9.gif",
                "https://hamzah.page/files/gif10.gif",
                "https://hamzah.page/files/gif11.gif",
                "https://hamzah.page/files/gif14.gif",
                "https://hamzah.page/files/gif12.gif",
                "https://hamzah.page/files/gif13.gif",

            ];

            const gif = kissGIFS[Math.floor(Math.random() * kissGIFS.length)];
            const embed = new EmbedBuilder()
            .setTitle(`${user.displayName.toUpperCase()} KISSED ${text.split("kiss ")[1].toUpperCase()}`)
            .setDescription("oh my they're really going at it 🫣")
            .setColor("#BC6105")
            .setImage(gif)
        
            await message.channel.send({ embeds: [embed],allowedMentions: { users: [message.author.id] } })
        }
        return;
    }


})





////////////////////
// SLASH COMMANDS //
////////////////////

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand() && !interaction.isStringSelectMenu() && !interaction.isButton()) return;


    if (interaction.commandName === "eval") {
        // code
        // javascript
        let code = interaction.options.getString("javascript");
        await interaction.deferReply()
        await interaction.editReply(`evaling:\n\`\`\`javascript\n${code}\n\`\`\`\n${loadingMessage}`);
        let results="";
        try {
            results = eval(code);
            if(code.toLowerCase().includes("env")||code.toLowerCase().includes("token"))
                results = "// haha good try"
        } catch (err){
            results = err;
        }
        interaction.editReply(`evaling:\n\`\`\`javascript\n${code}\n\`\`\`\n`+`Results:\n\`\`\`javascript\n${JSON.stringify(results)}\n\`\`\``);
    }

    // DICE ROLL
    if(interaction.commandName == "roll"){
        let num = interaction.options.getInteger("sides") || 8;
        await interaction.deferReply()
        // await interaction.editReply(loadingMessage);
        let ans = roll(num);
        interaction.editReply(`# 🎲 ${interaction.user} rolled a ${num} sided die & got a ${ans}! 🎲`);
    }

    // flipCoin
    if(interaction.commandName == "flip"){
        await interaction.deferReply();
        let ans = flipCoin();
        interaction.editReply(`# 🪙 ${interaction.user} flipped & got ${ans.toUpperCase()} 🪙`);
    }

    // BEAN GAMES
    if(interaction.commandName == "beangames"){
        await interaction.deferReply();
        // 

    }



    // BEAN GAMES COMMANDS
    if (interaction.isButton()) {
        // let commandCycle = {row: 0, page: 0};
        switch(interaction.customId){
            case "button-beangames-right":
                commandCycle++;
                if(commandCycle>maxCycle)
                    commandCycle=0;
                break;
            case "button-beangames-delete":
                if(maxCycle===1)
                    break;
                var newData = await readFile(COMMANDS_FILE);
                newData.splice(commandCycle,1);
                await writeFile(newData,COMMANDS_FILE);
            case "button-beangames-left":
                commandCycle--;
                if(commandCycle<0)
                    commandCycle = maxCycle;
                break;
        }

    }

    if(interaction.commandName == "beangames-commands" || interaction.customId && interaction.customId.includes("button-beangames-")){
        if(interaction.isButton())
            await interaction.deferUpdate()
        else 
            await interaction.deferReply();

        var data = await readFile(COMMANDS_FILE);
        maxCycle = data.length-1;
        // commandCycle =  interaction.options.getInteger("command-number");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setCustomId("button-beangames-left")
            .setLabel("<")
            .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
            .setCustomId("button-beangames-right")
            .setLabel(">")
            .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
            .setCustomId("button-beangames-delete")
            .setLabel("x")
            .setStyle(ButtonStyle.Danger)
        )


        var contentMessage = "";
        data.forEach((val, index)=>{
            var iSel = commandCycle == index?"> **":"";
            // (val.players.concat(val.kills)).forEach((v)=> commandMessage.replaceAll(v,`\`${v}\``));
            contentMessage = `${contentMessage}\n${iSel}Command ${index}:\n${iSel}${val.command}\n\`\`\`\n${JSON.stringify(val)}\n\`\`\`\n`
        })

        // {"command":"player1 kills player2","players":[""],"kills":[""]}
        const embed = new EmbedBuilder()
                        .setTitle("BeanGames Commands")
                        .setDescription(contentMessage)
                        .setColor("#BC6105");

        await interaction.editReply({
            // content: contentMessage,
            embeds: [embed],
            components: [row]
        });
    }




    // ADDING BEANGAMES COMMAND
    if(interaction.commandName == "add-beangames-command"){
        await interaction.deferReply();
        let contentMessage = "";
        var data = await readFile(COMMANDS_FILE);
        var newData = {
            "command": interaction.options.getString("command"),
            "player": [],
            "kills": [],
            "mode": ["day","night"]
        };
        // set players
        let pn = interaction.options.getInteger("number-of-players") || 0;
        for(var i=1;i<=pn;i++)
            newData.player.push(`player${i}`);

        // define killed players
        ["first-killed-player","second-killed-player","third-killed-player"].forEach((val)=>{
            let nn = interaction.options.getInteger(val) || 0;
            if(nn)
                newData.kills.push(`player${nn}`);
        });

        // define mode
        let mode1 = interaction.options.getString("command-mode") || 0;
        let mode2 = interaction.options.getString("command-mode-2") || 0;
        if(mode1 || mode2)
            newData.mode = [mode1, mode2];

        // creating new data
        data.push(newData)
        await writeFile(data,COMMANDS_FILE);

        contentMessage = `Added in new command:\n\`\`\`javascript\n${JSON.stringify(newData)}\n\`\`\`\n-# See \`/beangames-commands\` to view all current commands`

        const embed = new EmbedBuilder()
                        .setTitle(`Bean Games NEW Command #${data.length-1}`)
                        .setDescription(contentMessage)
                        .setColor("#BC6105");

        await interaction.editReply({
            // content: contentMessage,
            embeds: [embed]
        });

    }

});

