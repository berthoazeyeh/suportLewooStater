package com.beaconsender

import android.bluetooth.BluetoothAdapter
import android.bluetooth.le.*
import android.os.ParcelUuid
import com.facebook.react.bridge.*
import java.nio.ByteBuffer
import java.util.*

class BeaconAdvertiserModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var advertiser: BluetoothLeAdvertiser? = null
    private var advertiseCallback: AdvertiseCallback? = null

    override fun getName(): String = "BeaconAdvertiser"

    @ReactMethod
    fun startIBeacon(uuidStr: String, major: Int, minor: Int, txPower: Int, promise: Promise) {
        val adapter = BluetoothAdapter.getDefaultAdapter()
        if (adapter == null || !adapter.isEnabled) {
            promise.reject("BT_OFF", "Bluetooth is not available or enabled.")
            return
        }

        advertiser = adapter.bluetoothLeAdvertiser
        if (advertiser == null) {
            promise.reject("ADV_UNSUPPORTED", "BLE Advertising not supported on this device.")
            return
        }

        val uuid = UUID.fromString(uuidStr)
        val data = buildIBeaconData(uuid, major, minor, txPower)

        val advertiseData = AdvertiseData.Builder()
            .addManufacturerData(0x004C, data) // Apple Manufacturer ID
            .build()

        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(false)
            .build()

        advertiseCallback = object : AdvertiseCallback() {
            override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
                promise.resolve("iBeacon advertising started")
            }

            override fun onStartFailure(errorCode: Int) {
                promise.reject("ADV_FAIL", "Failed to start advertising: $errorCode")
            }
        }

        advertiser?.startAdvertising(settings, advertiseData, advertiseCallback)
    }

    private fun buildIBeaconData(uuid: UUID, major: Int, minor: Int, txPower: Int): ByteArray {
        val buffer = ByteBuffer.allocate(23)
        buffer.put(0x02) // iBeacon type
        buffer.put(0x15.toByte()) // iBeacon length
        buffer.putLong(uuid.mostSignificantBits)
        buffer.putLong(uuid.leastSignificantBits)
        buffer.putShort(major.toShort())
        buffer.putShort(minor.toShort())
        buffer.put(txPower.toByte())
        return buffer.array()
    }

    @ReactMethod
    fun stopAdvertising(promise: Promise) {
        advertiser?.stopAdvertising(advertiseCallback)
        promise.resolve("Advertising stopped")
    }
}
