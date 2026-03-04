# Podfile Modifier Plugin

Simple Expo plugin for automatically modifying Podfile during prebuild for Circle SDK.

## Features

- Automatically add Circle iOS SDK source
- Configure dynamic frameworks (GoogleSignIn, FBSDKLoginKit, AppAuth, GTMAppAuth, GTMSessionFetcher)
- Add pre_install configuration

## Usage

### 1. Configure in app.json

```json
{
  "expo": {
    "plugins": ["../plugins/podfile-modifier"]
  }
}
```

### 2. Run prebuild

```bash
npx expo prebuild --platform ios
```

## Notes

- Plugin automatically detects and avoids duplicate modifications
- Configuration is automatically applied on each prebuild
- Ensure plugin path is correct relative to app.json
