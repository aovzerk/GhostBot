/* eslint-disable @typescript-eslint/no-explicit-any */
import { REST, Routes } from "discord.js";
import { BotCLient } from "../../Client";
import { BaseModule } from "../../baseClasses/BaseModule";
import { config } from "../../../config/config";
const rest = new REST().setToken(config.token);

export class AutoLoadGlobalSlashModule extends BaseModule {
	commands: any[];
	isLoad: boolean = false;
	constructor(client: BotCLient) {
		super(client, "AutoLoadGlobalSlashModule");
		this.commands = [
			{
				"name": "ping",
				"description": "Ping bot!",
				"type": 1
			},
			{
				"name": "play",
				"description": "Play music",
				"type": 1, // chat command
				"options": [
					{
						"type": 3, // string
						"name": "request",
						"required": true,
						"description": "Url or text"
					}
				]
			},
			{
				"name": "avatar",
				"description": "Show user avatar",
				"type": 1, // chat command
				"options": [
					{
						"type": 6, // string
						"name": "user",
						"required": false,
						"description": "Member"
					}
				]
			}
		];
	}
	public async init(): Promise<boolean> {
		if (this.isLoad) {
			await rest.put(
				Routes.applicationCommands(config.botId),
				{ "body": this.commands }
			);
		}

		return true;
	}
}