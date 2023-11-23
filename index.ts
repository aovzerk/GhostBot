import { BotCLient } from "./src/Client";

const myBot = new BotCLient("!", true);

async function main() {
	await myBot.startBot();
}
main();