import { BotCLient } from "../Client";
import { BaseHandler } from "../baseClasses/BaseHandler";

export default class ReadyEvent extends BaseHandler {
	constructor(client: BotCLient) {
		super(client);
		this.nameHandler = "ReadyEvent";
	}
	public async init(): Promise<boolean> {
		const readyFunc = () => {
			console.log("Bot login");
		};
		this.regCallback("ready", readyFunc);
		return true;
	}
}