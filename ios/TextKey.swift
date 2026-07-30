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

enum TextsKey: String {
    case newPinCodeHeadline
    case enterPinCodeHeadline
    case securityIntroHeadline
    case securityIntroLink
    case securityQuestionHeaders
    case securitySummaryQuestionHeaders
    case recoverPinCodeHeadline
}

enum IconTextsKey: String {
    case securityConfirmationItems
}

enum TextKey: String {
    case circlepw_continue
    case circlepw_next
    case circlepw_skip
    case circlepw_sign
    case circlepw_try_again

    case circlepw_question_label
    case circlepw_answer_label
    case circlepw_hint_label
    case circlepw_hint_tag
    case circlepw_confirm
    case circlepw_pin_remain_attemps_template
    case circlepw_pin_lock_period_template
    case circlepw_answer_remain_attemps_template
    case circlepw_answer_lock_period_template
    case circlepw_pin_digit_config
    case circlepw_pincode_error_config
    case circlepw_enter_pincode_subhead
    case circlepw_enter_pincode_forgot_pin
    case circlepw_enter_pincode_use_biometrics
    case circlepw_new_pincode_subhead
    case circlepw_confirm_pincode_headline
    case circlepw_confirm_pincode_subhead
    case circlepw_security_intros_description

    // Security Questions
    case circlepw_security_questions_title
    case circlepw_security_questions_required_mark
    case circlepw_security_questions_question_placeholder
    case circlepw_security_questions_answer_header
    case circlepw_security_questions_answer_placeholder
    case circlepw_security_questions_answer_hint_header
    case circlepw_security_questions_answer_hint_placeholder
    case circlepw_security_questions_answer_input_config
    case circlepw_security_questions_answer_hint_input_config
    case circlepw_security_questions_question_input_config
    case circlepw_security_questions_error_config

    // SelectQuestion
    case circlepw_select_question_title
    case circlepw_select_question_item_config

    // SecuritySummary
    case circlepw_security_summary_title
    case circlepw_security_summary_question_value_config
    case circlepw_security_summary_answer_value_config
    case circlepw_security_summary_hint_value_config

    // SecurityConfirm
    case circlepw_security_confirm_title
    case circlepw_security_confirm_headline
    case circlepw_security_confirm_input_headline
    case circlepw_security_confirm_input_config
    case circlepw_security_confirm_input_placeholder
    case circlepw_security_confirm_input_match

    // RecoverPINCode
    case circlepw_recover_pincode_answer_input_header
    case circlepw_recover_pincode_answer_input_placeholder
    case circlepw_recover_pincode_input_config
    case circlepw_recover_pincode_answer_hint_config
    case circlepw_recover_pincode_error_config
    case circlepw_recover_pincode_question_config

    // BiometricsAllow
    case circlepw_pin_biometrics_allow_title
    case circlepw_pin_biometrics_allow_subtitle
    case circlepw_pin_biometrics_disable
    case circlepw_pin_biometrics_encrypt_title
    case circlepw_pin_biometrics_encrypt_subtitle
    case circlepw_pin_biometrics_encrypt_desc
    case circlepw_pin_biometrics_encrypt_negative_text
    case circlepw_pin_biometrics_decrypt_title
    case circlepw_pin_biometrics_decrypt_subtitle
    case circlepw_pin_biometrics_decrypt_desc
    case circlepw_pin_biometrics_decrypt_negative_text
    case circlepw_pin_biometrics_update_title
    case circlepw_pin_biometrics_update_subtitle
    case circlepw_alert_pop_window_title
    case circlepw_alert_pop_window_description_config
    case circlepw_alert_pop_window_confirm

    // Transaction Request
    case circlepw_transaction_request_title
    case circlepw_transaction_request_subtitle
    case circlepw_transaction_request_main_currency
    case circlepw_transaction_request_exchange_value
    case circlepw_transaction_request_from_label
    case circlepw_transaction_request_from
    case circlepw_transaction_request_to_label
    case circlepw_transaction_request_to_config
    case circlepw_transaction_request_to_contract_name
    case circlepw_transaction_request_to_contract_url
    case circlepw_transaction_request_network_fee_label
    case circlepw_transaction_request_network_fee
    case circlepw_transaction_request_exchange_network_fee
    case circlepw_transaction_request_total_label
    case circlepw_transaction_request_total_config
    case circlepw_transaction_request_exchange_total_value
    case circlepw_transaction_request_error_config
    case circlepw_transaction_request_fee_tip

    // Raw Transaction Request
    case circlepw_transaction_request_raw_tx_description
    case circlepw_transaction_request_raw_tx_config

    // Contract Interaction Request
    case circlepw_contract_interaction_title
    case circlepw_contract_interaction_subtitle
    case circlepw_contract_interaction_contract_address_label
    case circlepw_contract_interaction_contract_address_config
    case circlepw_contract_interaction_data_details
    case circlepw_contract_interaction_abi_function_label
    case circlepw_contract_interaction_abi_function_config
    case circlepw_contract_interaction_abi_parameter_label
    case circlepw_contract_interaction_call_data_label
    case circlepw_contract_interaction_call_data_config

    // Signature Request
    case circlepw_signature_request_title
    case circlepw_signature_request_contract_name
    case circlepw_signature_request_contract_url
    case circlepw_signature_request_subtitle
    case circlepw_signature_request_description
    case circlepw_signature_request_msg_config

    // Email OTP
    case circlepw_email_otp_title
    case circlepw_email_otp_description
    case circlepw_email_otp_email
    case circlepw_email_otp_head_config
    case circlepw_email_otp_dash
    case circlepw_email_otp_send_again_hint
    case circlepw_email_otp_send_again
}

