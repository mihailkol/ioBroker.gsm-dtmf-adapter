const utils = require('@iobroker/adapter-core'); // Импорт utils
const { SerialPort } = require('serialport'); // Импорт SerialPort
const { ReadlineParser } = require('@serialport/parser-readline'); // Импорт ReadlineParser

class GsmDtmfAdapter extends utils.Adapter {

    constructor(options) {
        super({
            ...options,
            name: 'gsm-dtmf-adapter',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    async onReady() {
        this.log.info('Adapter is ready');

        // Загрузка настроек
        const modemPort = this.config.modemPort;
        const baudRate = this.config.baudRate;

        // Инициализация модема
        this.modem = new SerialPort({
            path: modemPort,
            baudRate: baudRate,
        });

        // Используем ReadlineParser вместо Readline
        const parser = this.modem.pipe(new ReadlineParser({ delimiter: '\r\n' }));
        parser.on('data', this.handleModemData.bind(this));

        // Загрузка пользователей и устройств
        this.users = this.config.users || [];
        this.devices = this.config.devices || [];

        this.log.info('Adapter initialized');
    }

    onUnload(callback) {
        try {
            if (this.modem) {
                this.modem.close();
            }
            callback();
        } catch (e) {
            callback();
        }
    }

    handleModemData(data) {
        this.log.debug(`Received data from modem: ${data}`);

        // Обработка входящего звонка
        if (data.includes('RING')) {
            this.log.info('Incoming call detected');
            this.handleIncomingCall();
        }

        // Обработка DTMF-команд
        if (data.includes('+DTMF:')) {
            const dtmf = data.split(':')[1].trim();
            this.log.info(`DTMF command received: ${dtmf}`);
            this.handleDtmfCommand(dtmf);
        }
    }

    handleIncomingCall() {
        // Здесь можно добавить логику для идентификации звонящего по номеру телефона
        this.log.info('Handling incoming call');
    }

    handleDtmfCommand(dtmf) {
        const device = this.devices.find(d => d.dtmfCommand === dtmf);
        if (device) {
            this.log.info(`Device found: ${device.managedObject}`);
            this.controlDevice(device);
        } else {
            this.log.warn(`No device found for DTMF command: ${dtmf}`);
        }
    }

    controlDevice(device) {
        // Логика управления устройством
        this.log.info(`Controlling device: ${device.managedObject}`);
        // Здесь можно добавить код для управления устройством через IOBroker
    }
}

if (module.parent) {
    module.exports = (options) => new GsmDtmfAdapter(options);
} else {
    new GsmDtmfAdapter();
}
