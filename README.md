# Discord Forward
Forward messages from one server to another

- Forward new messages from specific channels to a webhook.
- Detect and forward message edits with an `[Edited]` prefix.
- Support for forwarding attachments (images).
- Option to post messages to a specific thread instead of the webhook's main channel.
- Option to monitor for and alert on specific keywords.
- Fully configurable via `config.json`.
- If a message is too long for the webhook to post, it will split it into multiple messages.

# Monitoring Messages
Uses discord.js-selfbot-v13 for reading messages using Discord token. This is against ToS, use a burner account if you feel the need.

You can monitor multiple channels.

https://github.com/aiko-chan-ai/discord.js-selfbot-v13

# Forwarding Messages
This uses a webhook, so the account being used to monitor a server does not need to be in the server in which messages are sent to.

Webhooks on Discord are safe unlike bots, they cannot be used to read messages. They can only be used to post messages.

Discord imposes a webhook rate limit of 30 messages per minute. If the bot encounters rate limits it will wait and retry. It is not advised to use this bot on extremely active servers.

# Monitor Mode
Monitor mode can be enabled by switching `monitor_mode` to `1` in the config and entering keywords to alert on.

All messages will still post to the webhook, but messages with a keyword will be @mentioned. Keywords are not case sensitive.

`alert_role_id` is required and will be @mentioned in the destination server.

# Config
The `config.json` file contains everything you need to setup this bot.

You can set multiple source channels, but only 1 thread ID and only 1 rewrite role ID.

To post messages to a thread, be sure to change `use_thread` from 0 to 1.

For testing, to post the last message in the channel(s), change `post_last_message_on_startup` from 0 to 1.

`destination_role_id` must be set to a Role ID on the destination server. Without this you will get 400 errors.

# How to get Discord Token
This is the user token, not a bot token.
Login via browser, open dev tools, go to network, search for `/api` and look for `Authorization`. The value is your user token.

# Installation
1. Clone the repository or download the files
2. Navigate to the repo directory
3. Install dependencies: `npm install discord.js-selfbot-v13 axios`
4. Edit the `config.json` to meet your needs
5. run `node .\bot.js`

# Docker
- Edit `docker-compose.yml` as required.
- Create container `docker build --no-cache -t discord-forward .`
- Launch container `docker-compose up -d`