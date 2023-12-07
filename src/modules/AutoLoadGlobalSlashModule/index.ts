/* eslint-disable @typescript-eslint/no-explicit-any */
import { REST, Routes } from "discord.js";
import { BotCLient } from "../../Client";
import { BaseModule } from "../../baseClasses/BaseModule";
import { config } from "../../../config/config";


export class AutoLoadGlobalSlashModule extends BaseModule {
	commands: any[];
	isLoad: boolean = true;
	rest: REST;
	constructor(client: BotCLient) {
		super(client, "AutoLoadGlobalSlashModule");
		this.rest = new REST().setToken(this.client.isDevBot ? config.dev_token : config.token);
		this.commands = [
			{
				"name": "ping",
				"description": "Пинг бота",
				"type": 1
			},
			{
				"name": "enabadvcommand",
				"description": "Включить дополнительные команды",
				"default_member_permissions": 8,
				"type": 1
			},
			{
				"name": "disabadvcommand",
				"description": "Выключить дополнительные команды",
				"default_member_permissions": 8,
				"type": 1
			},
			{
				"name": "help",
				"description": "Список команд",
				"type": 1
			},
			{
				"name": "getplayer",
				"description": "Получить плеер",
				"type": 1
			},
			{
				"name": "play",
				"description": "Воспроизвести музыку",
				"type": 1, // chat command
				"options": [
					{
						"type": 3, // string
						"name": "request",
						"required": true,
						"description": "Ссылка или текст"
					}
				]
			},
			{
				"name": "playlist",
				"description": "Воспроизвести плейлист",
				"type": 1, // chat command
				"options": [
					{
						"type": 3, // string
						"name": "request",
						"required": true,
						"description": "Ссылка"
					}
				]
			},
			{
				"name": "avatar",
				"description": "Показать аватар юзера",
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
				"description": "Сменить DJ",
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
			console.log("Slash global registered");
		}

		return true;
	}
}