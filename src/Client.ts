import { Client } from "discord.js";
import { connectMongo } from "../db/mongo";
import { config } from "../config/config";
import { BaseHandler } from "./baseClasses/BaseHandler";
import { loadAllHandlers } from "./utils/Loaders";
import { ChatCommandModule } from "./modules/ChatCommandModule";
import { Logger } from "../libs/Logger";
import path from "path";
import { SlashCommandModule } from "./modules/SlashCommandModule";
import { AutoLoadGlobalSlashModule } from "./modules/AutoLoadGlobalSlashModule";
import { BotStatusModule } from "./modules/BotStatusModule";

export class BotCLient extends Client {
	isDevBot: boolean;
	botHandlers: BaseHandler[];
	chatCommandModule: ChatCommandModule;
	slashCommandModule: SlashCommandModule;
	autoLoadGlobalSlash: AutoLoadGlobalSlashModule;
	botStatusModule: BotStatusModule;
	logger: Logger;
	prefix: string;
	constructor(prefix: string, dev = false) {
		super({
			"intents": config.intents
		});
		this.chatCommandModule = new ChatCommandModule(this);
		this.slashCommandModule = new SlashCommandModule(this);
		this.autoLoadGlobalSlash = new AutoLoadGlobalSlashModule(this);
		this.botStatusModule = new BotStatusModule(this);
		this.botHandlers = [];
		this.logger = new Logger(`${path.resolve()}/logs`);
		this.prefix = prefix;
		this.isDevBot = dev;
	}
	public async initBot() {
		await Promise.all([
			this.logger.init(),
			connectMongo(),
			loadAllHandlers(this),
			this.chatCommandModule.load(),
			this.slashCommandModule.load(),
			this.autoLoadGlobalSlash.load(),
			this.botStatusModule.load()
		]);
	}
	public async loginBot() {
		const token = this.isDevBot ? config.dev_token : config.token;
		await this.login(token);
	}
	public async startBot() {
		await this.loginBot();
		await this.initBot();
	}
}