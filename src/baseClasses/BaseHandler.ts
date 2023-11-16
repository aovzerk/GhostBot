import { BotCLient } from "../Client";
import { funcArg } from "../types/types";
import { BaseCallbackWatcher } from "./BaseCallbackWatcher";

export class BaseHandler extends BaseCallbackWatcher {
	nameHandler: string;
	callbacks: Map<string, funcArg[]>;
	constructor(client: BotCLient) {
		super(client);
		this.nameHandler = "Default Handler name";
		this.callbacks = new Map();
	}
	public destroy() {
		this.destroyCallbacks();
	}
	public async init(): Promise<boolean> {
		return true;
	}
	public async load(): Promise<boolean> {
		await this.init();
		console.log(`Handler ${this.nameHandler} loaded`);
		return true;
	}
}