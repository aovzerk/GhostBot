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

export class BotCLient extends Client {
	auroraHandlers: BaseHandler[];
	chatCommandModule: ChatCommandModule;
	slashCommandModule: SlashCommandModule;
	autoLoadGlobalSlash: AutoLoadGlobalSlashModule;
	logger: Logger;
	prefix: string;
	constructor(prefix: string) {
		super({
			"intents": config.intents
		});
		this.chatCommandModule = new ChatCommandModule(this);
		this.slashCommandModule = new SlashCommandModule(this);
		this.autoLoadGlobalSlash = new AutoLoadGlobalSlashModule(this);
		this.auroraHandlers = [];
		this.logger = new Logger(`${path.resolve()}/logs`);
		this.prefix = prefix;
	}
	public async initAurora() {
		await Promise.all([
			await this.logger.init(),
			await connectMongo(),
			await loadAllHandlers(this),
			await this.chatCommandModule.load(),
			await this.slashCommandModule.load(),
			await this.autoLoadGlobalSlash.load()
		]);
	}
	public async loginAurora() {
		await this.login(config.token);
	}
	public async startBot() {
		await this.initAurora();
		await this.loginAurora();
	}
}