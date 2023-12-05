import { BotCLient } from "./src/Client";

const myBot = new BotCLient("!", false);

async function main() {
	await myBot.startBot();
}
main();