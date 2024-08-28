// Copyright (c) 2024, Circle Internet Financial, LTD. All rights reserved.
//
// SPDX-License-Identifier: Apache-2.0
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import "ProgrammablewalletRnSdk.h"
#import "circlefin_w3s_pw_react_native_sdk/circlefin_w3s_pw_react_native_sdk-Swift.h"

@implementation ProgrammablewalletRnSdk
RCT_EXPORT_MODULE()
RNWalletSdk *sdk = [[RNWalletSdk alloc]init];
RCT_EXPORT_METHOD(initSdk:(NSDictionary *)configuration
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    [sdk initSdk:configuration resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(setSecurityQuestions:(NSArray *)questions)
{
    [sdk setSecurityQuestions:questions];
}

RCT_EXPORT_METHOD(execute:(NSString *)userToken
                  encryptionKey:(NSString *)encryptionKey
                  challengeIds:(NSArray *)challengeIds
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    [sdk execute:userToken encryptionKey:encryptionKey challengeIds:challengeIds resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(setBiometricsPin:(NSString *)userToken
                  encryptionKey:(NSString *)encryptionKey
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    [sdk setBiometricsPin:userToken encryptionKey:encryptionKey resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(performLogin:(NSString *)provider
                  deviceToken:(NSString *)deviceToken
                  deviceEncryptionKey:(NSString *)deviceEncryptionKey
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    [sdk performLoginWithProvider:provider deviceToken:deviceToken encryptionKey:deviceEncryptionKey resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(verifyOTP:(NSString *)otpToken
                  deviceToken:(NSString *)deviceToken
                  deviceEncryptionKey:(NSString *)deviceEncryptionKey
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    [sdk verifyOTPWithDeviceToken:deviceToken encryptionKey:deviceEncryptionKey otpToken:otpToken resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(performLogout:(NSString *)provider
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    [sdk performLogoutWithProvider:provider resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(setDismissOnCallbackMap:(NSDictionary *)map)
{
    [sdk setDismissOnCallbackMap:map];
}

RCT_EXPORT_METHOD(moveTaskToFront)
{
    [sdk moveTaskToFront];
}

RCT_EXPORT_METHOD(moveRnTaskToFront)
{
    [sdk moveRnTaskToFront];
}

RCT_EXPORT_METHOD(setTextConfigsMap:(NSDictionary *)map)
{
    [sdk setTextConfigsMap:map];
}

RCT_EXPORT_METHOD(setIconTextConfigsMap:(NSDictionary *)map)
{
    [sdk setIconTextConfigsMap:map];
}

RCT_EXPORT_METHOD(setTextConfigMap:(NSDictionary *)map)
{
    [sdk setTextConfigMap:map];
}

RCT_EXPORT_METHOD(setImageMap:(NSDictionary *)map)
{
    [sdk setImageMap:map];
}

RCT_EXPORT_METHOD(setDateFormat:(NSString *)format)
{
    [sdk setDateFormatWithFormat:format];
}

RCT_EXPORT_METHOD(setDebugging:(BOOL)debugging)
{
    [sdk setDebuggingWithDebugging: debugging];
}

RCT_EXPORT_METHOD(setCustomUserAgent:(NSString *)userAgent)
{
    [sdk setCustomUserAgentWithUserAgent:userAgent];
}

RCT_EXPORT_METHOD(setErrorStringMap:(NSDictionary *)map)
{
    [sdk setErrorStringMap:map];
}
RCT_EXPORT_METHOD(getDeviceId)
{
 // Export an empty getDeviceId() function since on Android new architechure it's needed to return value through a function.
}

- (NSDictionary *)getConstants
{
    return @{ @"sdkVersion": [sdk sdkVersion],
              @"deviceId": [sdk getDeviceId]};
}
- (NSDictionary *)constantsToExport
{
    return @{ @"sdkVersion": [sdk sdkVersion],
              @"deviceId": [sdk getDeviceId]};
}
+ (BOOL)requiresMainQueueSetup
{
  return YES;  // only do this if your module initialization relies on calling UIKit!
}
- (dispatch_queue_t)methodQueue{
    return dispatch_get_main_queue();
}
#ifdef RCT_NEW_ARCH_ENABLED
-(std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeProgrammablewalletRnSdkSpecJSI>(params);
}
#endif

@end

