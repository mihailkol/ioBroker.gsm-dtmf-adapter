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

        // Создаём папки и объекты
        await this.createFoldersAndObjects();

        // Инициализация модема
        await this.initializeModem();

        this.log.info('Adapter initialized');
    }

    async createFoldersAndObjects() {
        // Создаём папку для пользователей
        await this.setObjectNotExistsAsync('users', {
            type: 'folder',
            common: {
                name: 'Users',
                desc: 'Folder for storing users',
            },
            native: {},
        });

        // Создаём папку для устройств
        await this.setObjectNotExistsAsync('devices', {
            type: 'folder',
            common: {
                name: 'Devices',
                desc: 'Folder for storing devices',
            },
            native: {},
        });

        // Создаём объект для настроек модема
        await this.setObjectNotExistsAsync('modemSettings', {
            type: 'state',
            common: {
                name: 'Modem Settings',
                desc: 'Modem port and baud rate',
                type: 'object',
                role: 'settings',
                read: true,
                write: true,
            },
            native: {},
        });

        // Загружаем настройки модема
        const modemSettings = await this.getStateAsync('modemSettings');
        if (modemSettings && modemSettings.val) {
            this.config.modemPort = modemSettings.val.port || '/dev/ttyUSB0';
            this.config.baudRate = modemSettings.val.baudRate || 9600;
        } else {
            // Устанавливаем настройки по умолчанию
            await this.setStateAsync('modemSettings', {
                val: {
                    port: '/dev/ttyUSB0',
                    baudRate: 9600,
                },
                ack: true,
            });
        }
    }

    async initializeModem() {
        // Инициализация модема
        this.modem = new SerialPort({
            path: this.config.modemPort,
            baudRate: this.config.baudRate,
        });

        // Используем ReadlineParser для обработки данных
        const parser = this.modem.pipe(new ReadlineParser({ delimiter: '\r\n' }));
        parser.on('data', this.handleModemData.bind(this));
    }

    async addUser(user) {
        // Создаём объект для пользователя
        const userId = `users.${user.name.replace(/\s/g, '_')}`;
        await this.setObjectNotExistsAsync(userId, {
            type: 'state',
            common: {
                name: user.name,
                desc: `User ${user.name}`,
                type: 'object',
                role: 'info',
                read: true,
                write: false,
            },
            native: {},
        });

        // Сохраняем данные пользователя
        await this.setStateAsync(userId, { val: user, ack: true });
    }

    async addDevice(device) {
        // Создаём объект для устройства
        const deviceId = `devices.${device.managedObject.replace(/\s/g, '_')}`;
        await this.setObjectNotExistsAsync(deviceId, {
            type: 'state',
            common: {
                name: device.managedObject,
                desc: `Device ${device.managedObject}`,
                type: 'object',
                role: 'info',
                read: true,
                write: false,
            },
            native: {},
        });

        // Сохраняем данные устройства
        await this.setStateAsync(deviceId, { val: device, ack: true });
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
        // Поиск устройства по DTMF-команде
        this.getDevices().then(devices => {
            const device = devices.find(d => d.val.dtmfCommand === dtmf);
            if (device) {
                this.log.info(`Device found: ${device.val.managedObject}`);
                this.controlDevice(device.val);
            } else {
                this.log.warn(`No device found for DTMF command: ${dtmf}`);
            }
        });
    }

    async getDevices() {
        // Получаем список всех устройств
        const devices = await this.getStatesAsync('devices.*');
        return Object.values(devices);
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
