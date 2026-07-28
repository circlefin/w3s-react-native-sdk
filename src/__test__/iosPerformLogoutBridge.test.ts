declare const __dirname: string
declare function require(moduleName: string): unknown

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: 'utf8') => string
}
const { resolve } = require('path') as {
  resolve: (...paths: string[]) => string
}

function getAsyncFunctionBlock(source: string, name: string): string {
  const startToken = `AsyncFunction("${name}")`
  const startIndex = source.indexOf(startToken)

  if (startIndex === -1) {
    throw new Error(`Could not find ${startToken} in iOS module source`)
  }

  const remainder = source.slice(startIndex + startToken.length)
  const nextFunctionMatch = remainder.match(
    /\n\s*(?:AsyncFunction|Function)\("/,
  )
  const endIndex = nextFunctionMatch?.index

  return source.slice(
    startIndex,
    endIndex === undefined
      ? undefined
      : startIndex + startToken.length + endIndex,
  )
}

describe('iOS performLogout bridge', () => {
  it('rejects the Promise when the native logout completion fails', () => {
    const source = readFileSync(
      resolve(__dirname, '../../ios/ProgrammablewalletRnSdkModule.swift'),
      'utf8',
    )
    const performLogoutBlock = getAsyncFunctionBlock(source, 'performLogout')

    expect(performLogoutBlock).toMatch(
      /WalletSdk\.shared\.performLogout\s*\(\s*provider:\s*socialProvider\s*\)\s*\{\s*logoutResult\s+in/,
    )
    expect(performLogoutBlock).toMatch(/switch\s+logoutResult/)
    expect(performLogoutBlock).toMatch(/case\s+\.success\s*:/)
    expect(performLogoutBlock).toMatch(/promise\.resolve\s*\(\s*nil\s*\)/)
    expect(performLogoutBlock).toMatch(
      /case\s+\.failure\s*\(\s*let\s+error\s*\)/,
    )
    expect(performLogoutBlock).toMatch(
      /if\s+let\s+apiError\s*=\s*error\s+as\?\s*ApiError/,
    )
    expect(performLogoutBlock).toMatch(
      /promise\.reject\s*\(\s*String\s*\(\s*apiError\.errorCode\.rawValue\s*\)\s*,\s*self\._bridgePromiseErrorMessage\s*\(\s*apiError\s*\)\s*\)/,
    )
    expect(performLogoutBlock).toMatch(
      /let\s+nsError\s*=\s*error\s+as\s+NSError/,
    )
    expect(performLogoutBlock).toMatch(
      /promise\.reject\s*\(\s*String\s*\(\s*nsError\.code\s*\)\s*,\s*nsError\.localizedDescription\s*\)/,
    )
  })
})
