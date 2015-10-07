(() => {
  'use strict';

  /* Custom Bluetooth Service UUIDs */

  const DEVICE_SERVICE_A_UUID = '00000000-0000-0000-0000-000000000000';

  /* Custom Bluetooth Characteristic UUIDs */

  const DEVICE_CHARACTERISTIC_A_UUID = '00000000-0000-0000-0000-000000000000';
  const DEVICE_CHARACTERISTIC_B_UUID = '00000000-0000-0000-0000-000000000000';


  class MyDevice {
    constructor() {
      this.device = null;
      this.server = null;
      this._characteristics = new Map();
      this._debug = false;
    }
    requestMyDevice() {
      return navigator.bluetooth.requestMyDevice({filters:[{services:[ DEVICE_SERVICE_A_UUID ]}]})
      .then(device => {
        this.device = device;
        return device.connectGATT();
      })
      .then(server => {
        this.server = server;
        return Promise.all([
          server.getPrimaryService(DEVICE_SERVICE_A_UUID).then(service => {
            return Promise.all([
              this._cacheCharacteristic(service, DEVICE_CHARACTERISTIC_A_UUID),
              this._cacheCharacteristic(service, DEVICE_CHARACTERISTIC_B_UUID),
            ])
          }),
          server.getPrimaryService('battery_service').then(service => {
            return this._cacheCharacteristic(service, 'battery_level');
          }),
        ]);
      })
      .then(() => this.device); // Returns device when fulfilled.
    }

    /* Custom Service A */

    readCharacteristicA() {
      return this._readCharacteristicValue(DEVICE_CHARACTERISTIC_A_UUID)
      .then(data => data.getUint8(0));
    }

    writeCharacteristicB(data) {
      return this._writeCharacteristicValue(DEVICE_CHARACTERISTIC_B_UUID, new Uint8Array(data));
    }

    /* Battery Service */

    getBatteryLevel() {
      return this._readCharacteristicValue('battery_level')
      .then(data => data.getUint8(0));
    }

    /* Utils */

    _cacheCharacteristic(service, characteristicUuid) {
      return service.getCharacteristic(characteristicUuid)
      .then(characteristic => {
        this._characteristics.set(characteristicUuid, characteristic);
      });
    }
    _readCharacteristicValue(characteristicUuid) {
      let characteristic = this._characteristics.get(characteristicUuid);
      return characteristic.readValue()
      .then(buffer => {
        let data = new DataView(buffer);
        if (this._debug) {
          for (var i = 0, a = []; i < data.byteLength; i++) { a.push(data.getUint8(i)); }
          console.debug('READ', characteristic.uuid, a);
        }
        return data;
      });
    }
    _writeCharacteristicValue(characteristicUuid, value) {
      let characteristic = this._characteristics.get(characteristicUuid);
      if (this._debug) {
        console.debug('WRITE', characteristic.uuid, value);
      }
      return characteristic.writeValue(value);
    }
  }

  window.myDevice = new MyDevice();

})();