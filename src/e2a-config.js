/* =========================================================
 * Event2Action Learning Card Configuration
 * ========================================================= */

// Entity domains shown by default in the learning/edit target selector - if active in the HA configuration.
export const ENTITY_DOMAIN_LIST = [
	"switch",
	"light",
	"cover",
	"script",
	"automation",
	"scene",
	"input_boolean",
	"button",
	"fan",
	"media_player",
	"climate"
];

/* Other common action domains (selectable when present in Home Assistant):
*   "lock",         // Smart locks - security-sensitive, use with caution
*   "input_select", // Select helpers - requires specific option values
*   "vacuum",       // Robot vacuums - usually needs zones/modes
*   "camera",       // Cameras - limited remote-button use cases
*   "alarm_control_panel", // Alarm systems - security-sensitive
*/

/* Custom common service data for specific entity/service combinations allowing wildcard '*'
*   Format: { '<entity>|<service>': [ { label: '<label>', value: '<service_data_key>', default: <default_value> }, ... ] }
*  Example structure:
*   {
*      'light.turn_on': [ { label: 'custom_param', value: 'custom_param', default: 42 } ],
*      'switch.toggle': [ ... ]
*   }
*/
export const CUSTOM_COMMON_SERVICE_DATA_KEYS = {
	// Optional example for dimmer-control support from Dschuli/rf433-esphome-sniffer:
	'*dimmer_control|script.turn_on': [
		{ label: 'light_entity', value: 'light_entity', default: '' },
		{ label: 'steps', value: 'steps', default: 5 },
		{ label: 'bounce_at_top', value: 'bounce_at_top', default: false },
		{ label: 'min_val', value: 'min_val', default: 0 },
		{ label: 'max_val', value: 'max_val', default: 100 },
	],
};

/* Prefill service data for specific entity/service combinations allowing wildcard '*'
*   Format: {'<entity_id>|<service>': '<prefill string>',......}// Add more prefill entries as needed
*	  Example structure: {
*   'light.living_room|light.turn_on': '{"brightness":128}',
*   'switch.garden_lights|switch.turn_on': '{"duration":60}'
*   }
*/
export const PREFILL_SERVICE_DATA = {
	// Optional example for dimmer-control support from Dschuli/rf433-esphome-sniffer:
	'*dimmer_control|script.turn_on': '{"light_entity":" ","steps":5,"bounce_at_top":false}'
};



// Default configuration values

/* Auto-unblock when the last card disconnects, after a backend grace period.
 * Switching Event2Action views preserves the shared block and learning state.
 */
export const AUTO_UNBLOCK = true;
export const DEFAULT_BLOCK_SECONDS = 60;	// Initial default seconds to block event actions

// Logging levels: 0 = off, 1 = error only, 2 = error + warn, 3 = error + warn + info, 4 = all (debug)
export const LOG_LEVEL = 2;

