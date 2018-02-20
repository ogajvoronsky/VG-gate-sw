// For light on gate
load('api_config.js');
load('api_rpc.js');
load('api_dht.js');
load('api_timer.js');
load('api_events.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');


// pins
let led_pin = 2;
let button_pin = 0;
let load_pin = 5;
let state = 0; // Initial state of light (OFF)
let cmd_topic = 'light/gate/command'; // command topic (receive)
let sta_topic = 'light/gate/state'; // status topic (publish)


// Initialize pins
GPIO.set_mode(led_pin, GPIO.MODE_OUTPUT);
GPIO.set_mode(load_pin, GPIO.MODE_OUTPUT);
GPIO.write(load_pin, !state);


// Functions


let sw_on = function() {
    GPIO.write(load_pin, 0); // low level turns relay ON
    MQTT.pub(sta_topic, 'ON', 1, 1);
    state = 1;
};

let sw_off = function() {
    GPIO.write(load_pin, 1); // high level turns relay OFF
    MQTT.pub(sta_topic, 'OFF', 1, 1);
    state = 0;
};

let sw_toggle = function() {
    state ? sw_off() : sw_on();
};


// Subscribe for incoming commands
MQTT.sub(cmd_topic, function(conn, topic, msg) {
    print('MQTT recieved topic:', topic, 'message:', msg);
    if (msg === 'ON') {
        print('MQTT switching ON...');
        sw_on();
    } else if (msg === 'OFF') {
        print('MQTT switching OFF...');
        sw_off();
    }
}, null);




// Toggle load on a button press. Button is wired to GPIO pin 0
GPIO.set_button_handler(button_pin, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200, function() {
    sw_toggle();
    print('Switch turned to', state ? 'ON' : 'OFF');
    state ? MQTT.pub(cmd_topic, 'ON', 1, 1) : MQTT.pub(cmd_topic, 'OFF', 1, 1);
}, null);


// Blink built-in LED every second
Timer.set(1000 /* 1 sec */ , Timer.REPEAT, function() {
    GPIO.toggle(led_pin);
}, null);



// Monitor network connectivity.
Event.addGroupHandler(Net.EVENT_GRP, function(ev, evdata, arg) {
    let evs = '???';
    if (ev === Net.STATUS_DISCONNECTED) {
        evs = 'DISCONNECTED';
    } else if (ev === Net.STATUS_CONNECTING) {
        evs = 'CONNECTING';
    } else if (ev === Net.STATUS_CONNECTED) {
        evs = 'CONNECTED';
    } else if (ev === Net.STATUS_GOT_IP) {
        evs = 'GOT_IP';
    }
    print('== Net event:', ev, evs);
}, null);