#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(BeaconAdvertiser, NSObject)

RCT_EXTERN_METHOD(startIBeacon:(NSString *)uuidString 
                  major:(NSNumber *)major 
                  minor:(NSNumber *)minor 
                  txPower:(NSNumber *)txPower 
                  resolver:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopAdvertising:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject)

@end