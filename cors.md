# 🔧 Firebase Storage CORS Configuration Guide

## Problem
Firebase Storage blocks uploads from localhost due to CORS (Cross-Origin Resource Sharing) policy. This prevents document uploads from working in development.

**Error Message:**
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'https://localhost:5174' has been blocked by CORS policy
```

---

## ✅ Solution: Use Google Cloud Console Terminal

### **Step 1: Open Google Cloud Console Terminal**

1. **Navigate to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project**: Make sure `kolab-7eac7` is selected in the project dropdown (top left)
3. **Open Cloud Shell**: Click the **terminal icon** (🖥️) at the top right of the console
4. **Wait for terminal to load**: It may take 30-60 seconds to initialize

### **Step 2: Create CORS Configuration File**

Copy and paste this command into the Cloud Shell terminal:

```bash
cat > cors.json << 'EOF'
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "header": ["*"],
    "maxAgeSeconds": 3600
  }
]
EOF
```

**What this does:**
- Creates a `cors.json` file with permissive CORS settings
- Allows all origins (`*`) for development
- Allows all necessary HTTP methods and headers
- Sets cache time to 1 hour

### **Step 3: Apply CORS Configuration to Storage Bucket**

Run this command to apply the CORS configuration:

```bash
gsutil cors set cors.json gs://kolab-7eac7.firebasestorage.app
```

**Expected output:**
```
Setting CORS on gs://kolab-7eac7.firebasestorage.app/...
```

### **Step 4: Verify Configuration (Optional)**

Check that CORS was applied correctly:

```bash
gsutil cors get gs://kolab-7eac7.firebasestorage.app
```

**Expected output:**
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "header": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

---

## 🧪 Test the Fix

### **Step 1: Access Your App**
- Open your app at: `https://localhost:3000`
- Make sure the development server is running on port 3000

### **Step 2: Test Document Upload**
1. **Sign in** to your account
2. **Click** "📄 Upload New Document" button
3. **Select** a PDF file (under 10MB)
4. **Watch** the progress bar complete
5. **Verify** success notification appears

### **Step 3: Check Firebase Database**
1. **Go to Firebase Console**: https://console.firebase.google.com/project/kolab-7eac7
2. **Check Firestore Database** → `documents` collection for your uploaded document
3. **Check Firebase Storage** → `documents` folder for the PDF file
4. **Verify** document appears in the Public Feed

---

## 🚨 Troubleshooting

### **If CORS Still Not Working:**

1. **Wait 5-10 minutes**: CORS changes can take time to propagate
2. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
3. **Check project**: Ensure you're in the right Google Cloud project
4. **Try different browser**: Test in incognito/private mode

### **If gsutil Command Fails:**

```bash
# Check if you're authenticated
gcloud auth list

# If needed, authenticate
gcloud auth login
```

### **Alternative CORS Configuration (More Restrictive):**

If you want to be more specific about origins:

```bash
cat > cors-specific.json << 'EOF'
[
  {
    "origin": [
      "http://localhost:3000", 
      "https://localhost:3000",
      "http://localhost:5173", 
      "https://localhost:5173",
      "http://localhost:5174", 
      "https://localhost:5174"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "header": [
      "Authorization", 
      "Content-Type", 
      "x-goog-resumable",
      "x-goog-upload-command",
      "x-goog-upload-content-length",
      "x-goog-upload-header-content-length",
      "x-goog-upload-header-content-type",
      "x-goog-upload-offset",
      "x-goog-upload-protocol"
    ],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors-specific.json gs://kolab-7eac7.firebasestorage.app
```

---

## 📝 Notes

- **Development Only**: The `"origin": ["*"]` setting is for development. For production, specify exact domains.
- **Security**: This configuration allows all origins. Tighten this for production deployment.
- **Cache**: Changes may take 5-10 minutes to take effect due to CDN caching.
- **One-Time Setup**: You only need to do this once per Firebase project.

---

## ✅ Success Criteria

After completing these steps, you should be able to:
- ✅ Upload PDF documents without CORS errors
- ✅ See progress bar complete to 100%
- ✅ Get success notification "Document uploaded successfully!"
- ✅ Find uploaded document in Firebase Storage
- ✅ See document metadata in Firestore Database
- ✅ View document in Public Feed and My Documents

---

**Once CORS is working, we can proceed to test the complete document management system and implement real-time collaborative highlighting!** 🚀