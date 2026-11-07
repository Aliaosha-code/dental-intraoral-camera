# macOS 发布签名与公证

`npm run dist:mac` 生成的是未签名开发包，适合在开发 Mac 上验证 UI、摄像头权限和 Apple Silicon arm64 流程。正式分发请完成以下步骤。

## 1. 准备 Apple 证书

在 Apple Developer 账号中创建 `Developer ID Application` 证书，并导出为 `.p12` 文件。将证书安装到构建机的钥匙串，或在 CI 中配置：

```bash
export CSC_LINK="/path/to/developer-id-application.p12"
export CSC_KEY_PASSWORD="your-certificate-password"
export APPLE_ID="your-apple-id@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="YOUR_TEAM_ID"
```

## 2. 正式构建配置

正式发布时，在 `package.json` 的 `build.mac` 中启用 hardened runtime，并移除 `gatekeeperAssess: false`。推荐配置片段：

```json
{
  "mac": {
    "hardenedRuntime": true,
    "gatekeeperAssess": true,
    "entitlements": "electron/entitlements.mac.plist",
    "entitlementsInherit": "electron/entitlements.mac.plist",
    "notarize": true
  }
}
```

执行：

```bash
npm run dist:mac
```

`electron-builder` 会使用 Developer ID 签名，并向 Apple 的公证服务提交 `.app`。公证完成后，对 DMG 进行 staple：

```bash
xcrun stapler staple "release/口腔内窥相机系统-1.0.0-arm64.dmg"
```

## 3. 验证

```bash
codesign --verify --deep --strict --verbose=2 "release/mac-arm64/口腔内窥相机系统.app"
spctl --assess --type execute --verbose=4 "release/mac-arm64/口腔内窥相机系统.app"
```

## 4. 摄像头权限

打包配置已在 Info.plist 写入 `NSCameraUsageDescription`，entitlements 只申请摄像头权限。首次启动时需在「系统设置 → 隐私与安全性 → 摄像头」中允许应用访问。
