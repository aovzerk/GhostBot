import { BotCLient } from "./src/Client";

const myBot = new BotCLient("g!", false);

async function main() {
	await myBot.startBot();
}
main();