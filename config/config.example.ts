import { IntentsBitField } from "discord.js";


const intetns = [...new Set((Object.values(IntentsBitField.Flags).filter(el => !isNaN(Number(el))) as number[]))];

export const config = {
	"botId": "",
	"token": "",
	"mongoUrl": "",
	"intents": intetns
};