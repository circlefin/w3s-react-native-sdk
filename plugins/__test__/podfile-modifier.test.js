const withPodfileModifier = require('../podfile-modifier')

describe('withPodfileModifier', () => {
  it('is exported as a function', () => {
    expect(typeof withPodfileModifier).toBe('function')
  })

  // Spec (docs/specs/rn-sdk-expo-plugins.md): "podfile-modifier and
  // apple-signin-entitlements take no options." This guards against
  // reintroducing an `options` parameter (CCS-4809). Function#length is
  // unreliable here — a defaulted parameter (`options = {}`) does not count
  // toward it — so assert on the declared signature instead.
  it('declares only the config parameter — no options (spec: no-options contract)', () => {
    const source = withPodfileModifier.toString()
    const signature = source.slice(0, source.indexOf('=>'))
    expect(signature).not.toMatch(/options/)
    expect(signature.replace(/[()\s]/g, '')).toBe('config')
  })
})
