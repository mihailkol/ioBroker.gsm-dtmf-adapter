// Функция для добавления пользователя
function addUser() {
  const table = document.getElementById('users-table').getElementsByTagName('tbody')[0];
  const row = table.insertRow();
  
  const nameCell = row.insertCell();
  const phoneCell = row.insertCell();
  const actionsCell = row.insertCell();

  nameCell.innerHTML = '<input type="text" placeholder="Name" required>';
  phoneCell.innerHTML = '<input type="text" placeholder="Phone" required>';
  actionsCell.innerHTML = '<button class="btn red waves-effect waves-light" onclick="deleteUser(this)">Delete</button>';
}

// Функция для удаления пользователя
function deleteUser(button) {
  const row = button.parentElement.parentElement;
  row.remove();
}

// Функция для добавления устройства
function addDevice() {
  const table = document.getElementById('devices-table').getElementsByTagName('tbody')[0];
  const row = table.insertRow();
  
  const objectCell = row.insertCell();
  const commandCell = row.insertCell();
  const usersCell = row.insertCell();
  const actionsCell = row.insertCell();

  objectCell.innerHTML = '<input type="text" placeholder="Managed Object" required>';
  commandCell.innerHTML = '<input type="text" placeholder="DTMF Command" required>';
  usersCell.innerHTML = '<input type="text" placeholder="Users (comma separated)" required>';
  actionsCell.innerHTML = '<button class="btn red waves-effect waves-light" onclick="deleteDevice(this)">Delete</button>';
}

// Функция для удаления устройства
function deleteDevice(button) {
  const row = button.parentElement.parentElement;
  row.remove();
}

function saveSettings() {
  const modemPort = document.getElementById('modemPort').value;
  const baudRate = document.getElementById('baudRate').value;

  // Сбор данных о пользователях
  const users = [];
  const usersTable = document.getElementById('users-table').getElementsByTagName('tbody')[0];
  for (let i = 0; i < usersTable.rows.length; i++) {
    const row = usersTable.rows[i];
    const name = row.cells[0].querySelector('input').value;
    const phone = row.cells[1].querySelector('input').value;
    if (name && phone) { // Проверка, чтобы пустые строки не добавлялись
      users.push({ name, phone });
    }
  }

  // Сбор данных об устройствах
  const devices = [];
  const devicesTable = document.getElementById('devices-table').getElementsByTagName('tbody')[0];
  for (let i = 0; i < devicesTable.rows.length; i++) {
    const row = devicesTable.rows[i];
    const managedObject = row.cells[0].querySelector('input').value;
    const dtmfCommand = row.cells[1].querySelector('input').value;
    const usersString = row.cells[2].querySelector('input').value;
    if (managedObject && dtmfCommand && usersString) { // Проверка на пустые строки
      devices.push({
        managedObject,
        dtmfCommand,
        users: usersString.split(',').map(s => s.trim()) // Разделение пользователей по запятой
      });
    }
  }

  // Формирование объекта настроек
  const settings = {
    modemPort,
    baudRate,
    users,
    devices
  };

  // Отправка настроек на сервер
  socket.emit('setObject', 'system.adapter.gsm-dtmf-adapter.0', { native: settings }, function (err) {
    if (err) {
      alert('Error saving settings: ' + err);
    } else {
      alert('Settings saved successfully!');
      loadSettings(); // Перезагрузка данных после сохранения
    }
  });
}

// Загрузка настроек при открытии страницы
function loadSettings() {
  socket.emit('getObject', 'system.adapter.gsm-dtmf-adapter.0', function (err, obj) {
    if (obj && obj.native) {
      // Загрузка настроек модема
      document.getElementById('modemPort').value = obj.native.modemPort || '';
      document.getElementById('baudRate').value = obj.native.baudRate || 9600;

      // Загрузка пользователей
      const usersTable = document.getElementById('users-table').getElementsByTagName('tbody')[0];
      usersTable.innerHTML = ''; // Очистка таблицы перед загрузкой
      obj.native.users.forEach(user => {
        addUser(); // Добавление новой строки
        const row = usersTable.rows[usersTable.rows.length - 1]; // Получение последней строки
        row.cells[0].querySelector('input').value = user.name || '';
        row.cells[1].querySelector('input').value = user.phone || '';
      });

      // Загрузка устройств
      const devicesTable = document.getElementById('devices-table').getElementsByTagName('tbody')[0];
      devicesTable.innerHTML = ''; // Очистка таблицы перед загрузкой
      obj.native.devices.forEach(device => {
        addDevice(); // Добавление новой строки
        const row = devicesTable.rows[devicesTable.rows.length - 1]; // Получение последней строки
        row.cells[0].querySelector('input').value = device.managedObject || '';
        row.cells[1].querySelector('input').value = device.dtmfCommand || '';
        row.cells[2].querySelector('input').value = device.users.join(', ') || '';
      });
    }
  });
}

// Инициализация
document.getElementById('settings-form').addEventListener('submit', function (e) {
  e.preventDefault();
  saveSettings();
});

window.onload = loadSettings;
