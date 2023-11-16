import { BotCLient } from "./src/Client";

const myAurora = new BotCLient("!");

async function main() {
	await myAurora.startBot();
}
main();