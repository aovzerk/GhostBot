export const config = {
	"lavaLinkNodes": [
		{
			"id": "1",
			"host": "10.100.2.195",
			"port": 2333,
			"password": "youshallnotpass",
			"resuming": true
		}
	],
	"advCommand": [
		{
			"name": "enabalarmmemebers",
			"description": "Включить оповещения о входе выходе с сервера",
			"default_member_permissions": 8,
			"type": 1, // chat command
			"options": [
				{
					"type": 7, // channel
					"name": "chan",
					"required": true,
					"description": "Канал"
				}
			]
		},
		{
			"name": "disabalarmmemebers",
			"description": "Выключить оповещения о входе выходе с сервера",
			"default_member_permissions": 8,
			"type": 1 // chat command
		}
	]
};