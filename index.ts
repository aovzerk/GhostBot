import { BotCLient } from "./src/Client";

const myBot = new BotCLient("!");

async function main() {
	await myBot.startBot();
}
main();