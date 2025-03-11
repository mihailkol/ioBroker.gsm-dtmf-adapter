'use strict';

const utils = require('@iobroker/adapter-core');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

class GsmDtmfAdapter extends utils.Adapter {
    constructor(options) {
        super({
            ...options,
            name: 'gsm-dtmf-adapter',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));
        this.port = null; // SerialPort instance
        this.parser = null; // Parser for reading data
        this.users = {}; // User database
    }

    async onReady() {
        this.log.info('Adapter is ready');

        // Обработка необработанных исключений
        process.on('uncaughtException', (err) => {
            this.log.error('Uncaught exception:', err);
        });

        process.on('unhandledRejection', (reason, promise) => {
            this.log.error('Unhandled rejection at:', promise, 'reason:', reason);
        });

        // Загрузка базы пользователей
        await this.loadUsers();

        // Инициализация модема
        await this.initModem();

        // Настройка обработки вызовов
        this.setupCallHandling();
    }

    async onUnload(callback) {
        try {
            if (this.port) {
                this.port.close();
            }
            this.log.info('Adapter is shutting down');
            callback();
        } catch (e) {
            callback();
        }
    }

    async loadUsers() {
        // Загрузка пользователей из базы данных ioBroker
        const users = await this.getStateAsync('users');
        if (users && users.val) {
            this.users = JSON.parse(users.val);
        } else {
            this.users = []; // Инициализация пустого массива
        }
        this.log.info('Users loaded:', this.users);
    }

    async saveUsers() {
        // Сохранение пользователей в базу данных ioBroker
        await this.setStateAsync('users', JSON.stringify(this.users), true);
        this.log.info('Users saved');
    }        

    async initModem() {
        try {
            const modemPath = this.config.modemPath || '/dev/ttyUSB0';
            const baudRate = this.config.baudRate || 9600;
    
            this.port = new SerialPort({ path: modemPath, baudRate: baudRate });
            this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    
            this.port.on('open', () => {
                this.log.info('Modem connected');
                this.sendAtCommand('AT');
            });
    
            this.port.on('error', (err) => {
                this.log.error('Modem error:', err);
                setTimeout(() => this.initModem(), 5000); // Повторная попытка через 5 секунд
            });
        } catch (err) {
            this.log.error('Failed to initialize modem:', err);
            setTimeout(() => this.initModem(), 5000); // Повторная попытка через 5 секунд
        }
    }

    async sendAtCommand(command) {
        if (this.port && this.port.isOpen) {
            this.port.write(`${command}\r\n`);
            this.log.info(`AT command sent: ${command}`);
        } else {
            this.log.error('Modem is not connected');
        }
    }

    setupCallHandling() {
        this.log.info('Setting up call handling...');

        // Обработка входящих вызовов
        this.port.on('data', (data) => {
            if (data.includes('RING')) {
                this.log.info('Incoming call detected');
                this.handleIncomingCall();
            }
        });

        // Обработка DTMF-сигналов
        this.parser.on('data', (data) => {
            if (data.includes('DTMF')) {
                const dtmf = data.split(' ')[1]; // Извлечение DTMF-сигнала
                this.log.info(`DTMF received: ${dtmf}`);
                this.handleDtmfCommand(dtmf);
            }
        });
    }

    async handleIncomingCall() {
        const callerId = await this.getCallerId();
        this.log.info(`Call from: ${callerId}`);
    
        // Проверка, есть ли пользователь с таким номером
        const user = this.users.find(u => u.phone === callerId);
        if (user) {
            this.log.info(`User ${user.name} is authorized`);
        } else {
            this.log.warn(`User with phone ${callerId} is not authorized`);
        }
    }
    async handleDtmfCommand(dtmf) {
        // Логика обработки DTMF-команд
        this.log.info(`Executing DTMF command: ${dtmf}`);
        // Дополнительная логика...
    }

    async getCallerId() {
        // Логика получения номера звонящего
        return '123456789'; // Пример номера
    }
}

if (module.parent) {
    module.exports = (options) => new GsmDtmfAdapter(options);
} else {
    new GsmDtmfAdapter();
}
