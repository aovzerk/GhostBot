/* eslint-disable @typescript-eslint/no-explicit-any */
import { BotCLient } from "../../Client";
import { BaseModule } from "../../baseClasses/BaseModule";
import { config } from "../../../config/config";
import fetch from "node-fetch";


export class SendSDCBotStat extends BaseModule {
	isLoad: boolean = false;
	botId: string;
	interval: NodeJS.Timeout | undefined;
	constructor(client: BotCLient) {
		super(client, "SendSDCBotStat");
		this.botId = this.client.isDevBot ? config.dev_botId : config.botId;
	}
	public async init(): Promise<boolean> {
		if (this.isLoad) {
			this.interval = setInterval(async () => {
				const body = {
					"servers": this.client.guilds.cache.size,
					"shards": 1
				};
				const res = await fetch(`https://api.server-discord.com/v2/bots/${this.botId}/stats`, {
					"method": "POST",
					"headers": {
						"Authorization": config.SDC_api_key
					},
					"body": JSON.stringify(body)
				});
				if (res.status === 200) {
					this.client.logger.addLog({
						"data": "Статистика на SDC bots опубликована",
						"guildId": "null",
						"guildName": "null",
						"mdoule_name": this.moduleName
					});
				} else {
					const text = await res.text();
					this.client.logger.addLog({
						"data": `Ошибка отправки статистики на SDC bots status: ${res.status} text: ${text}`,
						"guildId": "null",
						"guildName": "null",
						"mdoule_name": this.moduleName
					});
				}
			}, 1 * 60 * 1000);
		}

		return true;
	}
}