/* eslint-disable @typescript-eslint/no-explicit-any */
import { REST, Routes } from "discord.js";
import { BotCLient } from "../../Client";
import { BaseModule } from "../../baseClasses/BaseModule";
import { config } from "../../../config/config";


export class AutoLoadGlobalSlashModule extends BaseModule {
	commands: any[];
	isLoad: boolean = false;
	rest: REST;
	constructor(client: BotCLient) {
		super(client, "AutoLoadGlobalSlashModule");
		this.rest = new REST().setToken(this.client.isDevBot ? config.dev_token : config.token);
		this.commands = [
			{
				"name": "ping",
				"description": "Ping bot!",
				"type": 1
			},
			{
				"name": "getplayer",
				"description": "Get music player",
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
				"name": "playlist",
				"description": "Play youtube playlist music",
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
						"type": 6, // member
						"name": "user",
						"required": false,
						"description": "Member"
					}
				]
			},
			{
				"name": "changedj",
				"description": "Change Dj",
				"type": 1, // chat command
				"options": [
					{
						"type": 6, // member
						"name": "user",
						"required": true,
						"description": "Member"
					}
				]
			}
		];
	}
	public async init(): Promise<boolean> {
		if (this.isLoad) {
			const botId = this.client.isDevBot ? config.dev_botId : config.botId;
			await this.rest.put(
				Routes.applicationCommands(botId),
				{ "body": this.commands }
			);
		}

		return true;
	}
}