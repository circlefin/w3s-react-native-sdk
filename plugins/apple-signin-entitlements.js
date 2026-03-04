const { withEntitlementsPlist } = require('@expo/config-plugins')

/**
 * Config plugin to ensure Apple Sign In entitlements are set
 */
const withAppleSignInEntitlements = config => {
  return withEntitlementsPlist(config, config => {
    // Add Apple Sign In capability
    config.modResults['com.apple.developer.applesignin'] = ['Default']

    console.log('✅ Apple Sign In entitlements configured')
    return config
  })
}

module.exports = withAppleSignInEntitlements
