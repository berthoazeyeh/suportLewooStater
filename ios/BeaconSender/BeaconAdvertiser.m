#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(BeaconAdvertiserModule, NSObject)

RCT_EXTERN_METHOD(
  startIBeacon:(nonnull NSString *)uuidStr
  major:(nonnull NSNumber *)major
  minor:(nonnull NSNumber *)minor
  txPower:(nonnull NSNumber *)txPower
  withResolver:(RCTPromiseResolveBlock)resolve
  withRejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  stopAdvertising:(RCTPromiseResolveBlock)resolve
  withRejecter:(RCTPromiseRejectBlock)reject
)

@end
