import Foundation
import CoreBluetooth
import React

@objc(BeaconAdvertiser)
class BeaconAdvertiser: NSObject, RCTBridgeModule, CBPeripheralManagerDelegate {
    
    static func moduleName() -> String! {
        return "BeaconAdvertiser"
    }
    
    private var peripheralManager: CBPeripheralManager?
    private var isAdvertising = false
    private var currentResolver: RCTPromiseResolveBlock?
    private var currentRejecter: RCTPromiseRejectBlock?
    
    override init() {
        super.init()
        peripheralManager = CBPeripheralManager(delegate: self, queue: nil)
    }
    
    // MARK: - React Native Methods
    
    @objc
    func startIBeacon(_ uuidString: String, 
                     major: NSNumber, 
                     minor: NSNumber, 
                     txPower: NSNumber, 
                     resolver: @escaping RCTPromiseResolveBlock, 
                     rejecter: @escaping RCTPromiseRejectBlock) {
        
        currentResolver = resolver
        currentRejecter = rejecter
        
        guard let uuid = UUID(uuidString: uuidString) else {
            rejecter("INVALID_UUID", "Invalid UUID format", nil)
            return
        }
        
        guard peripheralManager?.state == .poweredOn else {
            rejecter("BT_OFF", "Bluetooth is not available or enabled", nil)
            return
        }
        
        // Arrêter la publicité existante
        if isAdvertising {
            peripheralManager?.stopAdvertising()
        }
        
        // Créer les données iBeacon
        let beaconData = buildIBeaconData(uuid: uuid, 
                                        major: major.uint16Value, 
                                        minor: minor.uint16Value, 
                                        txPower: txPower.int8Value)
        
        // Configuration de la publicité
        var advertisementData: [String: Any] = [:]
        advertisementData[CBAdvertisementDataManufacturerDataKey] = beaconData
        
        // Démarrer la publicité
        peripheralManager?.startAdvertising(advertisementData)
    }
    
    @objc
    func stopAdvertising(_ resolver: @escaping RCTPromiseResolveBlock, 
                        rejecter: @escaping RCTPromiseRejectBlock) {
        
        peripheralManager?.stopAdvertising()
        isAdvertising = false
        resolver("Advertising stopped")
    }
    
    // MARK: - Helper Methods
    
    private func buildIBeaconData(uuid: UUID, major: UInt16, minor: UInt16, txPower: Int8) -> Data {
        var data = Data()
        
        // iBeacon prefix
        data.append(0x02) // iBeacon type
        data.append(0x15) // iBeacon length (21 bytes)
        
        // UUID (16 bytes)
        let uuidBytes = withUnsafeBytes(of: uuid.uuid) { Data($0) }
        data.append(uuidBytes)
        
        // Major (2 bytes, big-endian)
        data.append(UInt8(major >> 8))
        data.append(UInt8(major & 0xFF))
        
        // Minor (2 bytes, big-endian)
        data.append(UInt8(minor >> 8))
        data.append(UInt8(minor & 0xFF))
        
        // TX Power (1 byte)
        data.append(UInt8(bitPattern: txPower))
        
        return data
    }
    
    // MARK: - CBPeripheralManagerDelegate
    
    func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
        switch peripheral.state {
        case .poweredOn:
            print("Bluetooth is powered on")
        case .poweredOff:
            currentRejecter?("BT_OFF", "Bluetooth is powered off", nil)
        case .unsupported:
            currentRejecter?("BT_UNSUPPORTED", "Bluetooth is not supported", nil)
        case .unauthorized:
            currentRejecter?("BT_UNAUTHORIZED", "Bluetooth access denied", nil)
        default:
            break
        }
    }
    
    func peripheralManagerDidStartAdvertising(_ peripheral: CBPeripheralManager, error: Error?) {
        if let error = error {
            currentRejecter?("ADV_FAIL", "Failed to start advertising: \(error.localizedDescription)", error)
        } else {
            isAdvertising = true
            currentResolver?("iBeacon advertising started")
        }
        
        // Reset promises
        currentResolver = nil
        currentRejecter = nil
    }
}