# 📚 Learning Module App

Welcome to the **Learning Module App** repository! 

This guide is designed to help you set up, run, and understand the project from scratch. **Even if you are completely new to this, just follow these steps one by one.**

---

## 🛠️ 1. Initial Setup (Getting Started)

Before doing anything, you need to set up the code on your local computer. We recommend using **Yarn** to install packages (as it avoids some common issues), but we will use **npm/npx** for running scripts.

### Step 1: Install Requirements
- Make sure you have [Node.js](https://nodejs.org/) installed on your computer.
- Install [Yarn](https://yarnpkg.com/getting-started/install) if you haven't already.

### Step 2: Install Project Dependencies
Open your terminal (Command Prompt, PowerShell, or Mac Terminal) in this project's folder and run:
```bash
yarn install
```
*This downloads all the necessary code libraries required for the project to work.*

### Step 3: Start the Development Server
To run the web application locally on your browser:
```bash
yarn run dev
```
*Now, open your web browser and go to `http://localhost:5173`. You should see the app running!*

---

## 📱 2. Android App Setup (Capacitor)

This project uses a tool called **Capacitor**, which takes our web app code and turns it into a real native Android app (in the `android` folder).

### Step 1: Requirements for Android
- Download and install [Android Studio](https://developer.android.com/studio).
- Open Android Studio and install the necessary Android SDKs (it will usually prompt you to do this automatically on first launch).

### Step 2: Syncing Your Code to Android
Whenever you make a change to the web code and want to see it in the Android app, you must follow these two commands:

1. **Build the Web Code:** This packages your web app for production.
   ```bash
   npm run build
   ```
2. **Sync with Android:** This copies the packaged web code into the Android folder.
   ```bash
   npx cap sync android
   ```

### Step 3: Run the Android App
To actually open the project in Android Studio (where you can run it on a phone emulator, or connect your real phone via USB to test it):
```bash
npx cap open android
```
*Once Android Studio opens, wait for the background indexing to finish, then click the green "Play" ▶️ button at the top to run the app.*

### ❓ Missing Folders in Android? (For Beginners)
If you browse the `android` folder, you might notice that some files and folders (like `.gradle`, `build`, `local.properties`, or `capacitor-cordova-android-plugins`) are missing when you first clone the project. **Don't worry, this is intentional!**

These files are ignored by Git because they are specific to your computer. They will be **automatically generated** for you when you follow the steps above:
- Running `npx cap sync android` generates the Capacitor plugin folders.
- Opening the project in **Android Studio** automatically creates the `local.properties` file (which tells the app where your Android SDK is) and builds the `.gradle` and `build` folders. Just let Android Studio finish its initial loading!

---

## 🔄 3. Pulling Data from AMS (Safe Sync)

There is an external repository called `AMS-with-TimeTable`. We have a special script (`safe-pull-from-ams.ps1`) to safely bring in code updates from that project into this one, without breaking your custom changes.

### Prerequisites
- You must use **PowerShell** (Windows default terminal).
- You must have the AMS repository cloned exactly at `../IAMS/AMS-with-TimeTable` (meaning it's in the same parent folder as this project, inside a folder named `IAMS`).
- Your code must be **clean** (make sure you commit or stash any files you are currently working on).

### How to Sync
Run this in your PowerShell terminal:
```powershell
.\safe-pull-from-ams.ps1
```
*This will automatically pull the code, merge it safely, and preserve your work.*

---

## 🚀 4. Publishing OTA (Over-The-Air) Updates

An OTA update allows you to send new updates directly to users' phones without waiting for App Store/Play Store approvals. 

### Prerequisites
- In your project's `.env` file (create one if it doesn't exist), you must add your secret key like this: `OTA_SECRET_KEY=your_secret_key_here`.

### How to Publish an Update
When you are ready to send your latest code to users, just run:
```bash
npm run deploy:ota
```
**What this does behind the scenes:**
1. It builds your latest code (`npm run build`).
2. It increases the app's version number in `package.json`.
3. It packages everything into a `.zip` file.
4. It securely uploads it to the production server.

*(If you are testing the server locally, you can use: `npm run deploy:ota -- --dev`)*
