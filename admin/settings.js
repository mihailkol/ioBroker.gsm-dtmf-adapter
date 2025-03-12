function loadSettings() {
  socket.emit('getObject', 'system.adapter.gsm-dtmf-adapter.0', function (err, obj) {
    if (obj && obj.native) {
      document.getElementById('modemPort').value = obj.native.modemPort || '';
      document.getElementById('baudRate').value = obj.native.baudRate || 9600;

      // Load users
      const usersTable = document.getElementById('users-table').getElementsByTagName('tbody')[0];
      usersTable.innerHTML = '';
      obj.native.users.forEach(user => {
        const row = usersTable.insertRow();
        row.insertCell().textContent = user.name;
        row.insertCell().textContent = user.phone;
        row.insertCell().innerHTML = '<button onclick="deleteUser(this)">Delete</button>';
      });

      // Load devices
      const devicesTable = document.getElementById('devices-table').getElementsByTagName('tbody')[0];
      devicesTable.innerHTML = '';
      obj.native.devices.forEach(device => {
        const row = devicesTable.insertRow();
        row.insertCell().textContent = device.managedObject;
        row.insertCell().textContent = device.dtmfCommand;
        row.insertCell().textContent = device.users.join(', ');
        row.insertCell().innerHTML = '<button onclick="deleteDevice(this)">Delete</button>';
      });
    }
  });
}

function saveSettings() {
  const modemPort = document.getElementById('modemPort').value;
  const baudRate = document.getElementById('baudRate').value;

  const users = [];
  const usersTable = document.getElementById('users-table').getElementsByTagName('tbody')[0];
  for (let i = 0; i < usersTable.rows.length; i++) {
    const row = usersTable.rows[i];
    users.push({
      name: row.cells[0].textContent,
      phone: row.cells[1].textContent
    });
  }

  const devices = [];
  const devicesTable = document.getElementById('devices-table').getElementsByTagName('tbody')[0];
  for (let i = 0; i < devicesTable.rows.length; i++) {
    const row = devicesTable.rows[i];
    devices.push({
      managedObject: row.cells[0].textContent,
      dtmfCommand: row.cells[1].textContent,
      users: row.cells[2].textContent.split(', ')
    });
  }

  const settings = {
    modemPort,
    baudRate,
    users,
    devices
  };

  socket.emit('setObject', 'system.adapter.gsm-dtmf-adapter.0', { native: settings }, function (err) {
    if (err) {
      alert('Error saving settings: ' + err);
    } else {
      alert('Settings saved successfully!');
    }
  });
}

document.getElementById('settings-form').addEventListener('submit', function (e) {
  e.preventDefault();
  saveSettings();
});

window.onload = loadSettings;
