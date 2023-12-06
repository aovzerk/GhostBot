import { IntentsBitField } from "discord.js";


// const intetns = [...new Set((Object.values(IntentsBitField.Flags).filter(el => !isNaN(Number(el))) as number[]))];


const intetns = [
	IntentsBitField.Flags.Guilds,
	IntentsBitField.Flags.GuildMembers,
	IntentsBitField.Flags.GuildBans,
	IntentsBitField.Flags.GuildEmojisAndStickers,
	IntentsBitField.Flags.GuildIntegrations,
	IntentsBitField.Flags.GuildWebhooks,
	IntentsBitField.Flags.GuildInvites,
	IntentsBitField.Flags.GuildVoiceStates,
	IntentsBitField.Flags.GuildMessages,
	IntentsBitField.Flags.GuildMessageReactions,
	IntentsBitField.Flags.GuildMessageTyping,
	IntentsBitField.Flags.DirectMessages,
	IntentsBitField.Flags.DirectMessageReactions,
	IntentsBitField.Flags.DirectMessageTyping,
	IntentsBitField.Flags.MessageContent
];

export const config = {
	"admin": "",
	"botId": "",
	"dev_botId": "",
	"dev_token": "",
	"token": "",
	"mongoUrl": "",
	"SDC_api_key": "",
	"intents": intetns
};