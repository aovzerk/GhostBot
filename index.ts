import { BotCLient } from "./src/Client";

const myBot = new BotCLient("g!", true);

async function main() {
	await myBot.startBot();
}
main();