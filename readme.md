# twitch-chat-cli

## Usage

First generate an [OAuth token](https://twitchapps.com/tmi/) to connect to the Twitch IRC.

Add your OAuth token:

```
node cli.js add <username> <token>
```

Connect to a channel to start reading chat:

```
node cli.js connect <channel-name>
```