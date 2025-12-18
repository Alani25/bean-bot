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


// global variables
let trustedChannelID = "673923554856927284"; // TODO make sure we got a trusted channel
let loadingMessage = `\n <a:loading:1451198424236953683> Loading . . . `;

// Init discord bot perms
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // For guild-related events
        GatewayIntentBits.GuildMembers, // Required to detect new members
        GatewayIntentBits.GuildMessages,  // For message events in guilds
        GatewayIntentBits.MessageContent // To read the content of messages
    ]
});

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
        /--/    /====== ||\\ \\\\\\\\  ||
        /-/     \\______ ||\\\\ \\\\ \\ ||
        /_-  -\\  \\----- ||_\\\\ \\\\ \\||
        /_-_-_-\\  \\==== ||  \\\\ \\\\ \\|

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
    'nigger','porn','sex'
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

    // tell admin/ moderators apart from regular members
    const member = await message.guild.members.fetch(user.id)
    const isAdmin = (member.permissions.has('Administrator') || member.permissions.has('ManageMessages'));

    // ignore if it's a message we send (no need for dog tail chase)
    if(message.author.id == "1450980085581746238")
        return;

    // await send(message.author.id);
    
    
    // MODERATION STEPS
    let modCheck = moderationAlgo(text,message.author.id);
    console.log(modCheck)
    if(!modCheck.safe){
        await message.reply(
            `wooooah !\nYou've been muted for ${modCheck.duration} minutes for \n${modCheck.reason.join("\n")}`
        );
        if(isAdmin)
            send("You're lucky you got perms")
        else{ // TODO: make sure we have the right permissions to mute people, ignore for admins, delete message
            member.timeout(minToMS(modCheck.duration), modCheck.reason.join(", ")); 
            sendReport(message.guild,
                `# User ${user} muted for ${modCheck.duration} minutes\n**Reason:**\n${modCheck.reason.join("\n")}\n\n***Last message send:***\n\`\`\`${message.content}\`\`\``
            )
            await message.delete();
            return;
        }
    }


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



    // simple hello :D
    // if (text === "hello" || text === "hi") {
    //     send("Hey there!");
    //     send(`How are you ${user}`)
    // }

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

        let messageContent = `evaling:\n\`\`\`javascript\n${code}\n\`\`\`\n`;

        await interaction.deferReply()
        await interaction.editReply(messageContent + loadingMessage);


        try {

        } catch (err) {

        }
    }

    if(interaction.commandName == "roll"){

        let num = interaction.options.getInteger("sides") || 6;

        await interaction.deferReply()
        // await interaction.editReply(loadingMessage);
        
        let ans = roll(num);
        interaction.editReply(`# 🎲 Rolled a ${num} sided die, and got a ${ans}! 🎲`);

    }

    if(interaction.commandName == "flip"){
        // flipCoin
        await interaction.deferReply();

        // 

        let ans = flipCoin();
        interaction.editReply(`${interaction.user} flipped a coin and got ${ans}`);
    }

});

