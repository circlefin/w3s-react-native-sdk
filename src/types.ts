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
import type { ImageSourcePropType } from 'react-native/Libraries/Image/Image'

export interface IWalletSdk {
  sdkVersion: SdkVersion;
  deviceId: string;
  init: (configuration: Configuration) => Promise<void>;
  setSecurityQuestions: (securityQuestions: SecurityQuestion[]) => void;
  addListener: (listener: EventListener) => void;
  removeAllListeners: () => void;
  getDeviceId: () => string;
  execute: (
    userToken: string,
    encryptionKey: string,
    challengeIds: string[],
    successCallback: SuccessCallback,
    errorCallback: ErrorCallback,
  ) => void;
  setBiometricsPin: (
    userToken: string,
    encryptionKey: string,
    successCallback: SuccessCallback,
    errorCallback: ErrorCallback,
  ) => void;
  performLogin: (
    provider: SocialProvider,
    deviceToken: string,
    deviceEncryptionKey: string,
    successCallback: LoginSuccessCallback,
    errorCallback: ErrorCallback,
  ) => void;
  verifyOTP: (
    otpToken: string,
    deviceToken: string,
    deviceEncryptionKey: string,
    successCallback: LoginSuccessCallback,
    errorCallback: ErrorCallback,
  ) => void;
  performLogout: (
    provider: SocialProvider,
    completeCallback: CompleteCallback,
    errorCallback: ErrorCallback,
  ) => void;
  setDismissOnCallbackMap: (map: Map<ErrorCode, boolean>) => void;
  moveTaskToFront: () => void;
  moveRnTaskToFront: () => void;
  setTextConfigsMap: (map: Map<TextsKey, TextConfig[]>) => void;
  setIconTextConfigsMap: (
    map: Map<IconTextsKey, Array<IconTextConfig>>,
  ) => void;
  setTextConfigMap: (map: Map<TextKey, TextConfig>) => void;
  setImageMap: (map: Map<ImageKey, ImageSourcePropType>) => void;
  setDateFormat: (format: DateFormat) => void;
  setDebugging: (debugging: boolean) => void;
  setCustomUserAgent: (userAgent: string) => void;
  setErrorStringMap: (map: Map<ErrorCode, string>) => void;
}

export enum TextsKey {
  newPinCodeHeadline = 'newPinCodeHeadline',
  enterPinCodeHeadline = 'enterPinCodeHeadline',
  securityIntroHeadline = 'securityIntroHeadline',
  securityIntroLink = 'securityIntroLink',
  securityQuestionHeaders = 'securityQuestionHeaders',
  securitySummaryQuestionHeaders = 'securitySummaryQuestionHeaders',
  recoverPinCodeHeadline = 'recoverPinCodeHeadline',
}

export enum IconTextsKey {
  securityConfirmationItems = 'securityConfirmationItems',
}

export enum TextKey {
  circlepw_continue = 'circlepw_continue',
  circlepw_next = 'circlepw_next',
  circlepw_skip = 'circlepw_skip',
  circlepw_question_label = 'circlepw_question_label',
  circlepw_answer_label = 'circlepw_answer_label',
  circlepw_hint_label = 'circlepw_hint_label',
  circlepw_hint_tag = 'circlepw_hint_tag',
  circlepw_confirm = 'circlepw_confirm',
  circlepw_pin_remain_attemps_template = 'circlepw_pin_remain_attemps_template',
  circlepw_pin_lock_period_template = 'circlepw_pin_lock_period_template',
  circlepw_answer_remain_attemps_template = 'circlepw_answer_remain_attemps_template',
  circlepw_answer_lock_period_template = 'circlepw_answer_lock_period_template',
  circlepw_pin_digit_config = 'circlepw_pin_digit_config',
  circlepw_pincode_error_config = 'circlepw_pincode_error_config',
  circlepw_enter_pincode_subhead = 'circlepw_enter_pincode_subhead',
  circlepw_enter_pincode_forgot_pin = 'circlepw_enter_pincode_forgot_pin',
  circlepw_enter_pincode_use_biometrics = 'circlepw_enter_pincode_use_biometrics',
  circlepw_new_pincode_subhead = 'circlepw_new_pincode_subhead',
  circlepw_confirm_pincode_headline = 'circlepw_confirm_pincode_headline',
  circlepw_confirm_pincode_subhead = 'circlepw_confirm_pincode_subhead',
  circlepw_security_intros_description = 'circlepw_security_intros_description',
  circlepw_security_questions_title = 'circlepw_security_questions_title',
  circlepw_security_questions_required_mark = 'circlepw_security_questions_required_mark',
  circlepw_security_questions_question_placeholder = 'circlepw_security_questions_question_placeholder',
  circlepw_security_questions_answer_header = 'circlepw_security_questions_answer_header',
  circlepw_security_questions_answer_placeholder = 'circlepw_security_questions_answer_placeholder',
  circlepw_security_questions_answer_hint_header = 'circlepw_security_questions_answer_hint_header',
  circlepw_security_questions_answer_hint_placeholder = 'circlepw_security_questions_answer_hint_placeholder',
  circlepw_security_questions_answer_input_config = 'circlepw_security_questions_answer_input_config',
  circlepw_security_questions_answer_hint_input_config = 'circlepw_security_questions_answer_hint_input_config',
  circlepw_security_questions_question_input_config = 'circlepw_security_questions_question_input_config',
  circlepw_security_questions_error_config = 'circlepw_security_questions_error_config',
  // SelectQuestion
  circlepw_select_question_title = 'circlepw_select_question_title',
  circlepw_select_question_item_config = 'circlepw_select_question_item_config',
  // SecuritySummary
  circlepw_security_summary_title = 'circlepw_security_summary_title',
  circlepw_security_summary_question_value_config = 'circlepw_security_summary_question_value_config',
  circlepw_security_summary_answer_value_config = 'circlepw_security_summary_answer_value_config',
  circlepw_security_summary_hint_value_config = 'circlepw_security_summary_hint_value_config',
  // SecurityConfirm
  circlepw_security_confirm_title = 'circlepw_security_confirm_title',
  circlepw_security_confirm_headline = 'circlepw_security_confirm_headline',
  circlepw_security_confirm_input_headline = 'circlepw_security_confirm_input_headline',
  circlepw_security_confirm_input_config = 'circlepw_security_confirm_input_config',
  circlepw_security_confirm_input_placeholder = 'circlepw_security_confirm_input_placeholder',
  circlepw_security_confirm_input_match = 'circlepw_security_confirm_input_match',
  // RecoverPINCode
  circlepw_recover_pincode_answer_input_header = 'circlepw_recover_pincode_answer_input_header',
  circlepw_recover_pincode_answer_input_placeholder = 'circlepw_recover_pincode_answer_input_placeholder',
  circlepw_recover_pincode_input_config = 'circlepw_recover_pincode_input_config',
  circlepw_recover_pincode_answer_hint_config = 'circlepw_recover_pincode_answer_hint_config',
  circlepw_recover_pincode_error_config = 'circlepw_recover_pincode_error_config',
  circlepw_recover_pincode_question_config = 'circlepw_recover_pincode_question_config',
  // BiometricsAllow
  circlepw_pin_biometrics_allow_title = 'circlepw_pin_biometrics_allow_title',
  circlepw_pin_biometrics_allow_subtitle = 'circlepw_pin_biometrics_allow_subtitle',
  circlepw_pin_biometrics_disable = 'circlepw_pin_biometrics_disable',
  circlepw_pin_biometrics_encrypt_title = 'circlepw_pin_biometrics_encrypt_title',
  circlepw_pin_biometrics_encrypt_subtitle = 'circlepw_pin_biometrics_encrypt_subtitle',
  circlepw_pin_biometrics_encrypt_desc = 'circlepw_pin_biometrics_encrypt_desc',
  circlepw_pin_biometrics_encrypt_negative_text = 'circlepw_pin_biometrics_encrypt_negative_text',
  circlepw_pin_biometrics_decrypt_title = 'circlepw_pin_biometrics_decrypt_title',
  circlepw_pin_biometrics_decrypt_subtitle = 'circlepw_pin_biometrics_decrypt_subtitle',
  circlepw_pin_biometrics_decrypt_desc = 'circlepw_pin_biometrics_decrypt_desc',
  circlepw_pin_biometrics_decrypt_negative_text = 'circlepw_pin_biometrics_decrypt_negative_text',
  circlepw_pin_biometrics_update_title = 'circlepw_pin_biometrics_update_title',
  circlepw_pin_biometrics_update_subtitle = 'circlepw_pin_biometrics_update_subtitle',
  circlepw_alert_pop_window_title = 'circlepw_alert_pop_window_title',
  circlepw_alert_pop_window_description_config = 'circlepw_alert_pop_window_description_config',
  circlepw_alert_pop_window_confirm = 'circlepw_alert_pop_window_confirm',
  circlepw_swipe_confirm_headline = 'circlepw_swipe_confirm_headline',
  circlepw_swipe_confirm_subhead = 'circlepw_swipe_confirm_subhead',
  circlepw_swipe_to_confirm = 'circlepw_swipe_to_confirm',
  circlepw_swipe_bt_confirming = 'circlepw_swipe_bt_confirming',
  circlepw_swipe_bt_confirmed = 'circlepw_swipe_bt_confirmed',
  circlepw_swipe_bt_try_again = 'circlepw_swipe_bt_try_again',
  circlepw_transaction_request_title = 'circlepw_transaction_request_title',
  circlepw_transaction_request_subtitle = 'circlepw_transaction_request_subtitle',
  circlepw_transaction_request_main_currency = 'circlepw_transaction_request_main_currency',
  circlepw_transaction_request_exchange_value = 'circlepw_transaction_request_exchange_value',
  circlepw_transaction_request_from_label = 'circlepw_transaction_request_from_label',
  circlepw_transaction_request_from = 'circlepw_transaction_request_from',
  circlepw_transaction_request_to_label = 'circlepw_transaction_request_to_label',
  circlepw_transaction_request_to_config = 'circlepw_transaction_request_to_config',
  circlepw_transaction_request_to_contract_name = 'circlepw_transaction_request_to_contract_name',
  circlepw_transaction_request_to_contract_url = 'circlepw_transaction_request_to_contract_url',
  circlepw_transaction_request_network_fee_label = 'circlepw_transaction_request_network_fee_label',
  circlepw_transaction_request_network_fee = 'circlepw_transaction_request_network_fee',
  circlepw_transaction_request_exchange_network_fee = 'circlepw_transaction_request_exchange_network_fee',
  circlepw_transaction_request_total_label = 'circlepw_transaction_request_total_label',
  circlepw_transaction_request_total_config = 'circlepw_transaction_request_total_config',
  circlepw_transaction_request_exchange_total_value = 'circlepw_transaction_request_exchange_total_value',
  circlepw_transaction_request_error_config = 'circlepw_transaction_request_error_config',
  circlepw_transaction_request_fee_tip = 'circlepw_transaction_request_fee_tip',
  circlepw_contract_interaction_contract_address_label = 'circlepw_contract_interaction_contract_address_label',
  circlepw_contract_interaction_contract_address_config = 'circlepw_contract_interaction_contract_address_config',
  circlepw_contract_interaction_data_details = 'circlepw_contract_interaction_data_details',
  circlepw_contract_interaction_abi_function_label = 'circlepw_contract_interaction_abi_function_label',
  circlepw_contract_interaction_abi_function_config = 'circlepw_contract_interaction_abi_function_config',
  circlepw_contract_interaction_abi_parameter_label = 'circlepw_contract_interaction_abi_parameter_label',
  circlepw_contract_interaction_call_data_label = 'circlepw_contract_interaction_call_data_label',
  circlepw_contract_interaction_call_data_config = 'circlepw_contract_interaction_call_data_config',
  circlepw_transaction_request_raw_tx_description = 'circlepw_transaction_request_raw_tx_description',
  circlepw_transaction_request_raw_tx_config = 'circlepw_transaction_request_raw_tx_config',
  circlepw_signature_request_title = 'circlepw_signature_request_title',
  circlepw_signature_request_contract_name = 'circlepw_signature_request_contract_name',
  circlepw_signature_request_contract_url = 'circlepw_signature_request_contract_url',
  circlepw_signature_request_subtitle = 'circlepw_signature_request_subtitle',
  circlepw_signature_request_description = 'circlepw_signature_request_description',
  circlepw_signature_request_msg_config = 'circlepw_signature_request_msg_config',
  circlepw_sign = 'circlepw_sign',
  circlepw_try_again = 'circlepw_try_again',
  circlepw_email_otp_title = 'circlepw_email_otp_title',
  circlepw_email_otp_description = 'circlepw_email_otp_description',
  circlepw_email_otp_email = 'circlepw_email_otp_email',
  circlepw_email_otp_head_config = 'circlepw_email_otp_head_config',
  circlepw_email_otp_dash = 'circlepw_email_otp_dash',
  circlepw_email_otp_send_again_hint = 'circlepw_email_otp_send_again_hint',
  circlepw_email_otp_send_again = 'circlepw_email_otp_send_again',
}

export enum ImageKey {
  naviBack = 'back',
  naviClose = 'close',
  securityIntroMain = 'securityIntroMain',
  selectCheckMark = 'selectCheckMark',
  dropdownArrow = 'dropdownArrow',
  errorInfo = 'errorInfo',
  securityConfirmMain = 'securityConfirmMain',
  biometricsAllowMain = 'biometricsAllowMain',
  showPin = 'showPin',
  hidePin = 'hidePin',
  alertWindowIcon = 'alertWindowIcon',
  transactionTokenIcon = 'transactionTokenIcon',
  networkFeeTipIcon = 'networkFeeTipIcon',
  showLessDetailArrow = 'showLessDetailArrow',
  showMoreDetailArrow = 'showMoreDetailArrow',
  requestIcon = 'requestIcon',
}

export enum DateFormat {
  YYYYMMDD_HYPHEN = 'yyyy-MM-dd',
  DDMMYYYY_SLASH = 'dd/MM/yyyy',
  MMDDYYYY_SLASH = 'MM/dd/yyyy',
}

export enum ErrorCode {
  unknown = '-1',
  success = '0',
  apiParameterMissing = '1',
  apiParameterInvalid = '2',
  forbidden = '3',
  unauthorized = '4',
  retry = '9',
  customerSuspended = '10',
  pending = '11',
  invalidSession = '12',
  invalidPartnerId = '13',
  invalidMessage = '14',
  invalidPhone = '15',
  // Common 156001 - 156999,
  walletIdNotFound = '156001',
  tokenIdNotFound = '156002',
  transactionIdNotFound = '156003',
  walletSetIdNotFound = '156004',
  // Transaction related - 155201 - 155499,
  notEnoughFounds = '155201',
  notEnoughBalance = '155202',
  exceedWithdrawLimit = '155203',
  minimumFundsRequired = '155204',
  invalidTransactionFee = '155205',
  rejectedOnAmlScreening = '155206',
  tagRequired = '155207',
  gasLimitTooLow = '155208',
  transactionDataNotEncodedProperly = '155209',
  fullNodeReturnedError = '155210',
  walletSetupRequired = '155211',
  lowerThenMinimumAccountBalance = '155212',
  rejectedByBlockchain = '155213',
  droppedAsPartOfReorg = '155214',
  operationNotSupport = '155215',
  amountBelowMinimum = '155216',
  wrongNftTokenIdNumber = '155217',
  invalidDestinationAddress = '155218',
  tokenWalletChainMismatch = '155219',
  wrongAmountsNumber = '155220',
  // User related - 155101 - 155199,
  userAlreadyExisted = '155101',
  userNotFound = '155102',
  userTokenNotFound = '155103',
  userTokenExpired = '155104',
  invalidUserToken = '155105',
  userWasInitialized = '155106',
  userHasSetPin = '155107',
  userHasSetSecurityQuestion = '155108',
  userWasDisabled = '155109',
  userDoesNotSetPinYet = '155110',
  userDoesNotSetSecurityQuestionYet = '155111',
  incorrectUserPin = '155112',
  incorrectDeviceId = '155113',
  incorrectAppId = '155114',
  incorrectSecurityAnswers = '155115',
  invalidChallengeId = '155116',
  invalidApproveContent = '155117',
  invalidEncryptionKey = '155118',
  userPinLocked = '155119',
  securityAnswersLocked = '155120',
  // Wallet- 155501 - 155599,
  walletIsFrozen = '155501',
  maxWalletLimitReached = '155502',
  walletSetIdMutuallyExclusive = '155503',
  metadataUnmatched = '155504',
  // WalletSet - 155601 - 155699,
  // SDK UI - 155701 - 155799,
  userCanceled = '155701',
  launchUiFailed = '155702',
  pinCodeNotMatched = '155703',
  insecurePinCode = '155704',
  hintsMatchAnswers = '155705',
  networkError = '155706',
  biometricsSettingNotEnabled = '155708',
  deviceNotSupportBiometrics = '155709',
  biometricsKeyPermanentlyInvalidated = '155710',
  biometricsUserSkip = '155711',
  biometricsUserDisableForPin = '155712',
  biometricsUserLockout = '155713',
  biometricsUserLockoutPermanent = '155714',
  biometricsUserNotAllowPermission = '155715',
  biometricsInternalError = '155716',
  userSecretMissing = '155717',
  invalidUserTokenFormat = '155718',
  userTokenMismatch = '155719',
  socialLoginFailed = '155720',
  loginInfoMissing = '155721',
}

export class SecurityQuestion {
  title: string
  inputType?: InputType

  constructor(title: string, inputType?: InputType) {
    this.title = title
    this.inputType = inputType
  }
}

export interface Configuration {
  endpoint: string;
  appId: string;
  settingsManagement?: SettingsManagement;
}

export type EventListener = (event: ExecuteEvent) => void
export type SuccessCallback = (result: SuccessResult) => void
export type LoginSuccessCallback = (result: LoginResult) => void
export type CompleteCallback = () => void
export type ErrorCallback = (error: Error) => void
export interface SdkVersion {
  native: string;
  rn?: string;
}

export interface SuccessResult {
  result: ExecuteResult;
  warning?: ExecuteWarning;
}

export interface Error {
  code?: string;
  message: string;
}

export interface LoginResult {
  userToken?: string;
  encryptionKey?: string;
  refreshToken?: string;
  oauthInfo?: OauthInfo;
}

export interface OauthInfo {
  provider?: string;
  scope?: string[];
  socialUserUUID?: string;
  socialUserInfo?: SocialUserInfo;
}

export interface SocialUserInfo {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ExecuteResult {
  resultType: ExecuteResultType;
  status: ExecuteResultStatus;
  data?: ExecuteResultData;
}

export interface ExecuteWarning {
  warningType: ErrorCode;
  warningString: string;
}

export interface ExecuteResultData {
  signature?: string;
  signedTransaction?: string;
  txHash?: string;
}

export interface SettingsManagement {
  enableBiometricsPin: boolean;
}

export class IconTextConfig {
  image: ImageSourcePropType
  textConfig: TextConfig

  constructor(image: ImageSourcePropType, textConfig: TextConfig) {
    this.image = image
    this.textConfig = textConfig
  }
}

export class TextConfig {
  text?: string
  gradientColors?: string[]
  textColor?: string
  font?: string
  constructor(
    text?: string,
    gradientColorsOrTextColor?: string[] | string,
    font?: string,
  ) {
    this.text = text
    if(Array.isArray(gradientColorsOrTextColor)){
      this.gradientColors = gradientColorsOrTextColor
    } else {
      this.textColor = gradientColorsOrTextColor
    }
    this.font = font
  }
}

export enum ExecuteResultStatus {
  UNKNOWN = 'UNKNOWN',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export enum ExecuteEvent {
  forgotPin = 'forgotPin',
  resendOtp = 'resendOtp',
}

export enum ExecuteResultType {
  UNKNOWN = 'UNKNOWN',
  SET_PIN = 'SET_PIN',
  RESTORE_PIN = 'RESTORE_PIN',
  SET_SECURITY_QUESTIONS = 'SET_SECURITY_QUESTIONS',
  CREATE_WALLET = 'CREATE_WALLET',
  CREATE_TRANSACTION = 'CREATE_TRANSACTION',
  ACCELERATE_TRANSACTION = 'ACCELERATE_TRANSACTION',
  CANCEL_TRANSACTION = 'CANCEL_TRANSACTION',
  CONTRACT_EXECUTION = 'CONTRACT_EXECUTION',
  SIGN_MESSAGE = 'SIGN_MESSAGE',
  SIGN_TYPEDDATA = 'SIGN_TYPEDDATA',
  INITIALIZE = 'INITIALIZE',
  SET_BIOMETRICS_PIN = 'SET_BIOMETRICS_PIN',
  WALLET_UPGRADE = 'WALLET_UPGRADE',
}

export enum InputType {
  text = 'text',
  datePicker = 'datePicker',
}

export enum SocialProvider {
  Google = 'Google',
  Facebook = 'Facebook',
  Apple = 'Apple',
}
