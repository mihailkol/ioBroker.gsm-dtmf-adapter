// Проверка, что форма существует
const settingsForm = document.getElementById('settings-form');
if (settingsForm) {
  settingsForm.addEventListener('submit', function (e) {
    e.preventDefault();
    saveSettings();
  });
} else {
  console.error('Form with ID "settings-form" not found!');
}

// Проверка, что socket доступен
if (typeof socket === 'undefined') {
  console.error('Socket is not defined!');
}

// Загрузка настроек при открытии страницы
function loadSettings() {
  if (typeof socket === 'undefined') {
    console.error('Socket is not available. Cannot load settings.');
    return;
  }

  socket.emit('getObject', 'system.adapter.gsm-dtmf-adapter.0', function (err, obj) {
    if (err) {
      console.error('Error loading settings:', err);
      return;
    }

    if (obj && obj.native) {
      document.getElementById('modemPort').value = obj.native.modemPort || '/dev/ttyUSB0';
      document.getElementById('baudRate').value = obj.native.baudRate || 9600;
    }
  });
}

// Сохранение настроек
function saveSettings() {
  if (typeof socket === 'undefined') {
    console.error('Socket is not available. Cannot save settings.');
    return;
  }

  const modemPort = document.getElementById('modemPort').value;
  const baudRate = document.getElementById('baudRate').value;

  const settings = {
    modemPort,
    baudRate
  };

  console.log('Saving settings:', settings); // Логирование данных перед отправкой

  socket.emit('setObject', 'system.adapter.gsm-dtmf-adapter.0', { native: settings }, function (err) {
    if (err) {
      console.error('Error saving settings:', err); // Логирование ошибки
      alert('Error saving settings: ' + err);
    } else {
      console.log('Settings saved successfully!'); // Логирование успеха
      alert('Settings saved successfully!');
      loadSettings(); // Перезагрузка данных после сохранения
    }
  });
}

// Загрузка настроек при открытии страницы
window.onload = loadSettings;
