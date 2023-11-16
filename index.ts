/* eslint-disable @typescript-eslint/ban-ts-comment */
// import { LavalinkNodeOptions, Manager, Rest } from "lavacord/dist/discord.js";
import { BotCLient } from "./src/Client";

const myAurora = new BotCLient("!");

/* let manager: null | Manager = null;
async function getSongs(search: string) {
	// This gets the best node available, what I mean by that is the idealNodes getter will filter all the connected nodes and then sort them from best to least beast.
	const node = manager!.idealNodes[0];
	return Rest.load(node, search).then(data => data)
		.catch(err => {
			console.error(err);
			return null;
		});
}*/

async function main() {
	await myAurora.startBot();


	/* const nodes: LavalinkNodeOptions[] = [
		{
			"id": "1",
			"host": "10.100.2.195",
			"port": 2333,
			"password": "youshallnotpass"
		}
	];
	console.log(myAurora.user!.id);
	manager = new Manager(myAurora, nodes, {
		"user": myAurora.user!.id
	});
	manager.on("error", (error) => {
		console.log(error);
	});
	await manager.connect();
	const tracks = await getSongs("ytsearch:doom music");

	console.log(tracks);
	//@ts-ignore
	const track = tracks.tracks[0].track;
	const player = await manager.join({
		"guild": "1112870450922528919",
		"channel": "1112870451564249101",
		"node": "1"
	});
	player.once("error", error => console.error(error));
	await player.play(track);*/
	// await manager.leave("1112870450922528919");
}
main();