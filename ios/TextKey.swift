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
    case newPinCodeHeadline = "newPinCodeHeadline"
    case enterPinCodeHeadline = "enterPinCodeHeadline"
    case securityIntroHeadline = "securityIntroHeadline"
    case securityIntroLink = "securityIntroLink"
    case securityQuestionHeaders = "securityQuestionHeaders"
    case securitySummaryQuestionHeaders = "securitySummaryQuestionHeaders"
    case recoverPinCodeHeadline = "recoverPinCodeHeadline"
}

enum IconTextsKey: String {
    case securityConfirmationItems = "securityConfirmationItems"
}

enum TextKey: String {
    case circlepw_continue = "circlepw_continue"
    case circlepw_next = "circlepw_next"
    case circlepw_skip = "circlepw_skip"
    case circlepw_question_label = "circlepw_question_label"
    case circlepw_answer_label = "circlepw_answer_label"
    case circlepw_hint_label = "circlepw_hint_label"
    case circlepw_hint_tag = "circlepw_hint_tag"
    case circlepw_confirm = "circlepw_confirm"
    case circlepw_pin_remain_attemps_template = "circlepw_pin_remain_attemps_template"
    case circlepw_pin_lock_period_template = "circlepw_pin_lock_period_template"
    case circlepw_answer_remain_attemps_template = "circlepw_answer_remain_attemps_template"
    case circlepw_answer_lock_period_template = "circlepw_answer_lock_period_template"
    case circlepw_pin_digit_config = "circlepw_pin_digit_config"
    case circlepw_pincode_error_config = "circlepw_pincode_error_config"
    case circlepw_enter_pincode_subhead = "circlepw_enter_pincode_subhead"
    case circlepw_enter_pincode_forgot_pin = "circlepw_enter_pincode_forgot_pin"
    case circlepw_enter_pincode_use_biometrics = "circlepw_enter_pincode_use_biometrics"
    case circlepw_new_pincode_subhead = "circlepw_new_pincode_subhead"
    case circlepw_confirm_pincode_headline = "circlepw_confirm_pincode_headline"
    case circlepw_confirm_pincode_subhead = "circlepw_confirm_pincode_subhead"
    case circlepw_security_intros_description = "circlepw_security_intros_description"
    case circlepw_security_questions_title = "circlepw_security_questions_title"
    case circlepw_security_questions_required_mark = "circlepw_security_questions_required_mark"
    case circlepw_security_questions_question_placeholder = "circlepw_security_questions_question_placeholder"
    case circlepw_security_questions_answer_header = "circlepw_security_questions_answer_header"
    case circlepw_security_questions_answer_placeholder = "circlepw_security_questions_answer_placeholder"
    case circlepw_security_questions_answer_hint_header = "circlepw_security_questions_answer_hint_header"
    case circlepw_security_questions_answer_hint_placeholder = "circlepw_security_questions_answer_hint_placeholder"
    case circlepw_security_questions_answer_input_config = "circlepw_security_questions_answer_input_config"
    case circlepw_security_questions_answer_hint_input_config = "circlepw_security_questions_answer_hint_input_config"
    case circlepw_security_questions_question_input_config = "circlepw_security_questions_question_input_config"
    case circlepw_security_questions_error_config = "circlepw_security_questions_error_config"
    // SelectQuestion
    case circlepw_select_question_title = "circlepw_select_question_title"
    case circlepw_select_question_item_config = "circlepw_select_question_item_config"
    // SecuritySummary
    case circlepw_security_summary_title = "circlepw_security_summary_title"
    case circlepw_security_summary_question_value_config = "circlepw_security_summary_question_value_config"
    case circlepw_security_summary_answer_value_config = "circlepw_security_summary_answer_value_config"
    case circlepw_security_summary_hint_value_config = "circlepw_security_summary_hint_value_config"
    // SecurityConfirm
    case circlepw_security_confirm_title = "circlepw_security_confirm_title"
    case circlepw_security_confirm_headline = "circlepw_security_confirm_headline"
    case circlepw_security_confirm_input_headline = "circlepw_security_confirm_input_headline"
    case circlepw_security_confirm_input_config = "circlepw_security_confirm_input_config"
    case circlepw_security_confirm_input_placeholder = "circlepw_security_confirm_input_placeholder"
    case circlepw_security_confirm_input_match = "circlepw_security_confirm_input_match"
    // RecoverPINCode
    case circlepw_recover_pincode_answer_input_header = "circlepw_recover_pincode_answer_input_header"
    case circlepw_recover_pincode_answer_input_placeholder = "circlepw_recover_pincode_answer_input_placeholder"
    case circlepw_recover_pincode_input_config = "circlepw_recover_pincode_input_config"
    case circlepw_recover_pincode_answer_hint_config = "circlepw_recover_pincode_answer_hint_config"
    case circlepw_recover_pincode_error_config = "circlepw_recover_pincode_error_config"
    case circlepw_recover_pincode_question_config = "circlepw_recover_pincode_question_config"
    // BiometricsAllow
    case circlepw_pin_biometrics_allow_title = "circlepw_pin_biometrics_allow_title"
    case circlepw_pin_biometrics_allow_subtitle = "circlepw_pin_biometrics_allow_subtitle"
    case circlepw_pin_biometrics_disable = "circlepw_pin_biometrics_disable"
    case circlepw_pin_biometrics_encrypt_title = "circlepw_pin_biometrics_encrypt_title"
    case circlepw_pin_biometrics_encrypt_subtitle = "circlepw_pin_biometrics_encrypt_subtitle"
    case circlepw_pin_biometrics_encrypt_desc = "circlepw_pin_biometrics_encrypt_desc"
    case circlepw_pin_biometrics_encrypt_negative_text = "circlepw_pin_biometrics_encrypt_negative_text"
    case circlepw_pin_biometrics_decrypt_title = "circlepw_pin_biometrics_decrypt_title"
    case circlepw_pin_biometrics_decrypt_subtitle = "circlepw_pin_biometrics_decrypt_subtitle"
    case circlepw_pin_biometrics_decrypt_desc = "circlepw_pin_biometrics_decrypt_desc"
    case circlepw_pin_biometrics_decrypt_negative_text = "circlepw_pin_biometrics_decrypt_negative_text"
    case circlepw_pin_biometrics_update_title = "circlepw_pin_biometrics_update_title"
    case circlepw_pin_biometrics_update_subtitle = "circlepw_pin_biometrics_update_subtitle"
    case circlepw_alert_pop_window_title = "circlepw_alert_pop_window_title"
    case circlepw_alert_pop_window_description_config = "circlepw_alert_pop_window_description_config"
    case circlepw_alert_pop_window_confirm = "circlepw_alert_pop_window_confirm"
}

