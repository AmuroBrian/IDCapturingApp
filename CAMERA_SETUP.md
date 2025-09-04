# Camera Access Setup Guide

The photo capture app requires proper setup for camera access on mobile devices. Follow these steps:

## 🔧 **Current Status**

✅ **Server Running**: `http://192.168.8.201:3000`
✅ **Network Access**: Available to all devices on your network
⚠️ **Camera Access**: Requires HTTPS for mobile browsers

## 📱 **Camera Access Requirements**

Modern browsers require **HTTPS** for camera access, except on localhost. Since you're running on `192.168.8.201`, you have two options:

### Option 1: Use HTTPS (Recommended for Mobile)

1. **Stop the current server** (Ctrl+C in terminal)
2. **Run with HTTPS**:
   ```bash
   npm run dev:https
   ```
3. **Access via**: `https://192.168.8.201:3000`
4. **Accept security warning** (self-signed certificate)

### Option 2: Use Localhost Forwarding

1. **Keep current server running**: `http://192.168.8.201:3000`
2. **Access from mobile**: May work on some browsers, but not guaranteed
3. **Alternative**: Use `http://localhost:3000` on the same machine

## 📋 **Testing Steps**

### On Mobile Device:

1. **Connect to same WiFi** as your development machine
2. **Open mobile browser** (Chrome/Safari recommended)
3. **Navigate to**: 
   - HTTPS: `https://192.168.8.201:3000` (preferred)
   - HTTP: `http://192.168.8.201:3000` (may not work)
4. **Grant camera permissions** when prompted
5. **Test camera functionality**

### Expected Behavior:

✅ **Camera button appears**
✅ **"Start Camera" works**
✅ **Live camera preview shows**
✅ **"Capture Photo" saves image**
✅ **Photo appears in dashboard**

## 🐛 **Troubleshooting Camera Issues**

### Error: "getUserMedia is undefined"
- **Cause**: Browser doesn't support camera API
- **Solution**: Use modern browser (Chrome 53+, Safari 11+, Firefox 36+)

### Error: "Camera access requires HTTPS"
- **Cause**: Non-HTTPS connection on network IP
- **Solution**: Use `npm run dev:https` and access via `https://192.168.8.201:3000`

### Error: "Camera permissions denied"
- **Cause**: User denied camera access
- **Solution**: 
  1. Check browser address bar for camera icon
  2. Click and allow camera access
  3. Refresh page and try again

### Error: "No camera found"
- **Cause**: Device has no camera or camera is disabled
- **Solution**: Test on device with working camera

### Error: "Camera already in use"
- **Cause**: Another app is using the camera
- **Solution**: Close other camera apps and try again

## 🔧 **Advanced Setup (Optional)**

### For Production-like HTTPS Testing:

1. **Install mkcert** (creates valid local certificates):
   ```bash
   # Windows (with Chocolatey)
   choco install mkcert
   
   # Or download from: https://github.com/FiloSottile/mkcert/releases
   ```

2. **Create certificates**:
   ```bash
   mkcert -install
   mkcert 192.168.8.201 localhost
   ```

3. **Configure Next.js** to use certificates (requires additional setup)

## 📱 **Mobile Browser Compatibility**

| Browser | HTTP Support | HTTPS Support | Notes |
|---------|-------------|---------------|-------|
| Chrome Mobile | ❌ | ✅ | Requires HTTPS for camera |
| Safari Mobile | ❌ | ✅ | Requires HTTPS for camera |
| Firefox Mobile | ❌ | ✅ | Requires HTTPS for camera |
| Edge Mobile | ❌ | ✅ | Requires HTTPS for camera |

## 🚀 **Quick Start for Mobile Testing**

1. **Run HTTPS server**:
   ```bash
   npm run dev:https
   ```

2. **On mobile, visit**: `https://192.168.8.201:3000`

3. **Accept security warning** (for self-signed cert)

4. **Test camera functionality**

5. **Grant permissions** when prompted

Your camera should now work perfectly on mobile devices! 📸✨
