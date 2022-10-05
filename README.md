# JS Badge Example
Steps required for the badge notifications from the App Service:
* In the config.json enable presence subscription for the App
* in the innovaphone-jsbadgeexampleservice.js implement following functionality:
	* create registration to the PBX from App Service ( { "api": "PbxSignal", "mt": "Register", "flags": "NO_MEDIA_CALL" } )
	* connect incoming presence_subscribe calls ({ "mt": "Signaling", "api": "PbxSignal", "call": obj.call, "sig": { "type": "conn" } })
	* send badge notifications on connected calls (see function updateBadge)
