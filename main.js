   const utils = require('@iobroker/adapter-core'); // Используйте библиотеку для работы с IOBroker
   const SerialPort = require('serialport');

   class GsmAdapter extends utils.Adapter {
       constructor(options) {
           super({
               ...options,
               name: 'gsm-adapter',
           });
           this.on('ready', this.onReady.bind(this));
       }

       async onReady() {
           // Инициализация порта и других настроек
           this.port = new SerialPort({
               path: this.config.port,
               baudRate: this.config.baudRate,
           });

           // Здесь вы можете добавить код для управления пользователями и устройствами
       }

       // Метод для отправки DTMF команд
       sendDtmfCommand(phoneNumber, command) {
           const dtmfCommand = ${phoneNumber},${command};
           this.port.write(dtmfCommand, (err) => {
               if (err) {
                   this.log.error('Error sending command: ' + err.message);
               } else {
                   this.log.info('DTMF command sent: ' + dtmfCommand);
               }
           });
       }
   }

   if (module.parent) {
       module.exports = (options) => new GsmAdapter(options);
   } else {
       new GsmAdapter();
   }
   
