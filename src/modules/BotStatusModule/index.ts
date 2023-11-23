/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActivityType } from "discord.js";
import { BotCLient } from "../../Client";
import { BaseModule } from "../../baseClasses/BaseModule";

export class BotStatusModule extends BaseModule {
	isLoad: boolean = false;
	interval: NodeJS.Timeout | undefined;
	constructor(client: BotCLient) {
		super(client, "BotStatusModule");
		this.interval = undefined;
	}
	setHandlers() {
		const callackReady = () => {
			this.setInterval();
			this.setActivity();
		};
		const callbackGuildCreate = () => {
			clearInterval(this.interval);
			this.setInterval();
			this.setActivity();
		};
		const callbackGuildDelete = () => {
			clearInterval(this.interval);
			this.setInterval();
			this.setActivity();
		};

		this.regCallback("ready", callackReady, true);
		this.regCallback("guildCreate", callbackGuildCreate);
		this.regCallback("guildDelete", callbackGuildDelete);
	}
	setActivity() {
		const servers = this.client.guilds.cache.size;
		this.client.user!.setActivity(`${servers} Серверов`, {
			"type": ActivityType.Watching
		});
	}
	setInterval() {
		clearInterval(this.interval);
		this.interval = setInterval(() => this.setActivity(), 10 * 60 * 1000);
	}
	public async init(): Promise<boolean> {
		this.setHandlers();
		return true;
	}
}