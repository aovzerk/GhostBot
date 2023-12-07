/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { GuildMember } from "discord.js";
import { BotCLient } from "../../Client";
import { BaseModule } from "../../baseClasses/BaseModule";
import { getGuildDb } from "../../../libs/GuildDB";


export class AutoSetRolesNewMembers extends BaseModule {
	constructor(client: BotCLient) {
		super(client, "AutoSendMessageAfterJoinMember");
	}
	async addRole(member: GuildMember, role: string) {
		try {
			await member.roles.add(role);
		} catch (_) {}
	}
	setHandlers() {
		const callbackMemberAdd = async (member: GuildMember) => {
			const guildDB = await getGuildDb(member.guild!.id);
			if (guildDB !== null) {
				if (guildDB.guildInfo.rolesNewUsers === null) return;
				const promises = [];
				for (const role of guildDB.guildInfo.rolesNewUsers) {
					promises.push(this.addRole(member, role));
				}
				await Promise.all(promises);
			}
			return;
		};
		this.regCallback("guildMemberAdd", callbackMemberAdd);
	}
	public async init(): Promise<boolean> {
		this.setHandlers();
		return true;
	}
}