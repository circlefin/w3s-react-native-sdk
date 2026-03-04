# Info.plist Config Plugin

Config plugin to automatically set Info.plist values for Circle SDK, including Facebook and Google OAuth configuration.

## Features

- Automatically set Facebook App ID, Client Token, and Display Name
- Configure Google Client ID
- Set Face ID usage description
- Support both environment variables and direct configuration

## Usage

### 1. Configure in app.json

```json
{
  "expo": {
    "plugins": ["../plugins/infoplist-config"]
  }
}
```

### 2. Set environment variables in .env

```bash
IOS_FACEBOOK_APP_ID=your_facebook_app_id
IOS_FACEBOOK_CLIENT_TOKEN=your_facebook_client_token
IOS_FACEBOOK_DISPLAY_NAME=your_app_name
IOS_GOOGLE_CLIENT_ID=your_google_ios_client_id
```

### 3. Or pass options directly in app.json

```json
{
  "expo": {
    "plugins": [
      [
        "../plugins/infoplist-config",
        {
          "facebookAppId": "YOUR_APP_ID",
          "facebookClientToken": "YOUR_CLIENT_TOKEN",
          "facebookDisplayName": "YOUR_APP_NAME",
          "googleClientId": "YOUR_GOOGLE_CLIENT_ID"
        }
      ]
    ]
  }
}
```

### 4. Run prebuild

```bash
npm run prebuild
```

## Configuration Options

| Option                | Environment Variable        | Description               |
| --------------------- | --------------------------- | ------------------------- |
| `facebookAppId`       | `IOS_FACEBOOK_APP_ID`       | Facebook App ID           |
| `facebookClientToken` | `IOS_FACEBOOK_CLIENT_TOKEN` | Facebook Client Token     |
| `facebookDisplayName` | `IOS_FACEBOOK_DISPLAY_NAME` | Facebook App Display Name |
| `googleClientId`      | `IOS_GOOGLE_CLIENT_ID`      | Google iOS Client ID      |

## Notes

- Environment variables take precedence over options
- All options are optional
- Face ID description is hard coded as "Enable Biometrics PIN"
