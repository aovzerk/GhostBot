import { Message } from "discord.js";

export function deleteMsgAfterTimeout(msg: Message, ms: number, verbose = false) {
	return setTimeout(async () => {
		try {
			await msg.delete();
		} catch (error) {
			if (verbose) {
				console.log(error);
			}
		}
	}, ms);
}
export function getRandomInt(max: number) {
	return Math.floor(Math.random() * max);
}