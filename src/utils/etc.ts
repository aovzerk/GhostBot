import { Message } from "discord.js";

export function deleteMsgAfterTimeout(msg: Message, ms: number) {
	return setTimeout(async () => {
		try {
			await msg.delete();
		} catch (_) { }
	}, ms);
}