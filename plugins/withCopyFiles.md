# Copy Files Plugin

Config plugin to **copy entire platform folders** (`android/`, `ios/`) from a source directory into your generated native project during prebuild.  
Any files or folders present under `<sourceDir>/android` or `<sourceDir>/ios` will be copied recursively.

---

## Features

- Recursively copy files under `<sourceDir>/android` → `android/` and `<sourceDir>/ios` → `ios/`
- Automatically creates target folders if they don’t exist
- Supports **overwrite control** (`overwrite: true` or `false`)
- Works during the **Expo prebuild** process

---

## Usage

### 1. Configure in `app.json` or `app.config.ts`

```json
{
  "expo": {
    "plugins": [
      [
        "@circle-fin/w3s-pw-react-native-sdk/plugins/withCopyFiles",
        {
          "sourceDir": "prebuild-sync-src",
          "overwrite": true
        }
      ]
    ]
  }
}
```

> `sourceDir` is the path defined in your `app.json` or `app.config.js` under `expo.plugins` block, located within your project root.
> Inside it, you can have both `android/` and `ios/` subfolders.

---

### 2. Directory structure example

```
prebuild-sync-src/
  android/
    app/build.gradle
    app/src/main/res/values/strings.xml
  ios/
    YourApp/Info.plist
    YourApp/CustomFile.m
```

Anything under these subfolders will be copied into your generated `android/` or `ios/` directories.

---

### 3. Run prebuild

```bash
npx expo prebuild
```

---

## Configuration Options

| Option      | Default               | Description                                                                                               |
| ----------- | --------------------- | --------------------------------------------------------------------------------------------------------- |
| `sourceDir` | `"prebuild-sync-src"` | Root directory containing your `android/` and/or `ios/` folders to copy                                   |
| `overwrite` | `true`                | Whether to overwrite existing files in the target location (`false` will skip if the file already exists) |

---

## Notes

- The plugin performs **one-way copy**: source → project native folders.
  Removing files from the source won’t delete them in the target.
- Removing the plugin and running `expo prebuild --clean` restores native folders to their default state.
- Designed to be **idempotent** — running multiple times won’t duplicate files.
- Works seamlessly with EAS Build and local `expo prebuild`.
