# HTTPS Development Setup with mkcert

This project uses **mkcert** to enable HTTPS during local development, allowing the Web Crypto API to work on mobile devices.

## ✅ What's Already Done

- mkcert installed via Homebrew
- SSL certificates generated: `localhost+3.pem` and `localhost+3-key.pem`
- `package.json` configured to use certificates
- Development server runs on HTTPS

## 🔐 Complete CA Installation (One-Time)

To remove browser certificate warnings on your Mac:

```bash
mkcert -install
```

This requires your sudo password and installs the local CA into your system's trust store.

## 📱 Mobile Device Setup (One-Time Per Device)

### Find the CA Certificate
```bash
mkcert -CAROOT
```

This shows the location (e.g., `/Users/renancrociari/Library/Application Support/mkcert`)

### iOS (iPhone/iPad)
1. Transfer `rootCA.pem` to your device (AirDrop/email)
2. Open the file → Install Profile
3. Settings → General → About → Certificate Trust Settings
4. Enable trust for mkcert

### Android
1. Transfer `rootCA.pem` to your device
2. Settings → Security → Install from storage
3. Select the certificate and install

## 🚀 Usage

### Start Development Server
```bash
npm start
```

Server runs at:
- **Desktop**: `https://localhost:1234`
- **Mobile**: `https://192.168.68.54:1234` (your local IP)

### Alternative: Using ngrok

For quick mobile testing without CA installation:

```bash
# Install ngrok
brew install ngrok

# Create HTTPS tunnel
ngrok http 1234
```

Use the provided `https://` URL on any device.

## 🔧 Troubleshooting

**Certificate warnings on Mac?**
- Run `mkcert -install` and enter your sudo password

**Certificate warnings on mobile?**
- Install the CA certificate (see Mobile Device Setup above)
- Or use ngrok instead

**Server won't start?**
- Check that certificate files exist: `ls localhost+3*.pem`
- Regenerate if missing: `mkcert localhost 192.168.68.54 127.0.0.1 ::1`
