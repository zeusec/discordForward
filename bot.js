const { Client } = require('discord.js-selfbot-v13');
const axios = require('axios');
const fs = require('fs');

// Load configuration from config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const TOKEN = config.token;
const WEBHOOK_URL = config.webhook;
const SOURCE_SERVER = config.source_channels;
const TARGET_THREAD_ID = config.thread_id;
const DESTINATION_ROLE_ID = config.destination_role_id;
const POST_LAST_MESSAGE_ON_STARTUP = config.post_last_message_on_startup;
const USE_THREAD = config.use_thread;

const client = new Client();

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.username}`);

    if (POST_LAST_MESSAGE_ON_STARTUP === 1) {
        try {
            for (const channelId of SOURCE_SERVER) {
                const channel = await client.channels.fetch(channelId);
                if (!channel || !channel.isText()) {
                    console.log(`Invalid or inaccessible channel: ${channelId}`);
                    continue;
                }

                const messages = await channel.messages.fetch({ limit: 1 });
                const lastMessage = messages.first();

                if (lastMessage) {
                    await forwardMessage(lastMessage);
                    console.log(`Last message from channel ${channelId} forwarded.`);
                } else {
                    console.log(`No messages found in channel ${channelId}.`);
                }
            }
        } catch (error) {
            console.error(`Error fetching or forwarding messages: ${error}`);
        }
    }
});

// Helper function to split message content into chunks
function splitMessage(content, maxLength = 2000) {
    if (content.length <= maxLength) {
        return [content];
    }

    const splitText = [];
    let currentIndex = 0;

    while (currentIndex < content.length) {
        let splitIndex = currentIndex + maxLength;

        if (splitIndex < content.length) {
            let lastSpaceIndex = content.lastIndexOf('\n', splitIndex);
            if (lastSpaceIndex === -1 || lastSpaceIndex < currentIndex) {
                lastSpaceIndex = content.lastIndexOf(' ', splitIndex);
            }
            if (lastSpaceIndex === -1 || lastSpaceIndex < currentIndex) {
                lastSpaceIndex = splitIndex;
            }
            splitIndex = lastSpaceIndex;
        }

        splitText.push(content.substring(currentIndex, splitIndex).trim());
        currentIndex = splitIndex;
    }

    return splitText;
}

// Function to forward a message to the webhook
async function forwardMessage(message, isEdit = false) {
    try {
        let content = message.content ? message.content : '';

        // Replace any role mention with the destination role mention
        const roleMentionRegex = /<@&\d+>/g;
        content = content.replace(roleMentionRegex, `<@&${DESTINATION_ROLE_ID}>`);

        // Include embed details if available
        if (message.embeds.length > 0) {
            message.embeds.forEach((embed, index) => {
                content += `\n**Embed ${index + 1} Title:** ${embed.title || ''}\n`;
                content += `**Embed Description:** ${embed.description || ''}\n`;
                content += `**Fields:**\n`;

                embed.fields.forEach(field => {
                    content += `**${field.name}:** ${field.value}\n`;
                });
            });
        }

        // Check for attachments (images)
        const attachments = Array.from(message.attachments.values());
        const imageUrls = attachments.map(attachment => attachment.url);

        // Indicate if the message is an edit
        if (isEdit) {
            content = `**[Edited]** ${content}`;
        }

        // Split the message into chunks
        const chunks = splitMessage(content, 2000);

        for (const chunk of chunks) {
            // Use the thread if enabled
            const webhookURL = USE_THREAD === 1 
                ? `${WEBHOOK_URL}?thread_id=${TARGET_THREAD_ID}` 
                : WEBHOOK_URL;

            const data = {
                content: chunk,
                username: message.author.username,
                avatar_url: message.author.displayAvatarURL({ format: 'png', dynamic: true }),
                allowed_mentions: {
                    parse: [], // Do not parse @everyone or @here
                    roles: [DESTINATION_ROLE_ID], // Allow mentioning only the specific destination role
                    users: [] // No user mentions
                },
                embeds: imageUrls.map(url => ({
                    image: { url } // Attach images as embeds
                }))
            };

            await axios.post(webhookURL, data);
        }
    } catch (error) {
        console.error(`Failed to forward message from channel ${message.channel.id}. Error: ${error}`);
    }
}

// Event listener for new messages
client.on('messageCreate', async (message) => {
    if (message.author.id === client.user.id) return;

    // Check if the message is in one of the monitored channels
    if (SOURCE_SERVER.includes(message.channel.id)) {
        await forwardMessage(message);
        console.log(`New message from channel ${message.channel.id} forwarded.`);
    }
});

// Event listener for message edits
client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (newMessage.author.id === client.user.id) return;

    // Check if the edited message is in one of the monitored channels
    if (SOURCE_SERVER.includes(newMessage.channel.id)) {
        await forwardMessage(newMessage, true);
        console.log(`Edited message from channel ${newMessage.channel.id} forwarded.`);
    }
});

// Log in with the self-bot token
client.login(TOKEN);