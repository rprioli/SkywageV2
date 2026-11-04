# Privacy Policy

**Last updated:** 4 November 2026
**Effective date:** 1 July 2026

This Privacy Policy explains how **Skywage** ("Skywage", "we", "us", or "our") collects, uses, shares, and protects your personal information when you use the Skywage mobile application (the "App").

By creating an account or using the App, you agree to the practices described in this Privacy Policy. If you do not agree, please do not use the App.

---

## 1. Who we are

The App is operated by **Skywage**.

For any privacy-related questions or requests, contact us at **support@skywage.ae** or via the in-app Contact Us form (Profile → Contact Us).

Skywage is an **independent** application. It is **not affiliated with, endorsed by, sponsored by, or connected to any airline**. References to airlines or positions exist only to help you calculate and organize your own roster and salary information.

---

## 2. Privacy at a glance

A short summary of the most important points. The full detail is in the sections below.

- We collect the information you provide to create your account and use the App (such as your email, name, position, nationality, and the roster data you upload or enter).
- We use this information **only** to provide the App's features — calculating your salary, syncing your data across your devices, the friends feature, and notifications.
- **We do not use any analytics, advertising, or third-party tracking technologies. We do not sell or rent your personal data. We do not track you across other apps or websites.**
- Your data is stored using **Supabase**, hosted on Amazon Web Services in **Mumbai, India**.
- **eCrew Import is optional.** If you use it, your eCrew Friends & Family login is saved only on your phone and sent only to eCrew — never to Skywage. The roster it imports is saved to your Skywage account like any uploaded roster.
- You can **edit or delete your data at any time**, including permanently deleting your entire account and all associated data from within the App.

---

## 3. Information we collect

We collect the following categories of personal information.

### 3.1 Account and profile information

When you register and set up your profile, we collect:

- **Email address** (used to create and sign in to your account, and to send you a code if you reset your password)
- **Password** (set by you; it is handled by our authentication provider and stored only in a securely hashed form — we never have access to your plaintext password)
- **First name and last name** (optional)
- **Username** (optional; used so friends can find and add you)
- **Position** (CCM / Cabin Crew Member or SCCM / Senior Cabin Crew Member)
- **Airline** (your employer, e.g. Flydubai)
- **Nationality** (optional; used for profile purposes). _Nationality may be considered sensitive personal data in some jurisdictions; we collect it only with your input and you may leave it blank or remove it._
- **Profile picture / avatar** (optional; if you choose to add one, the image is stored on our servers)
- **Record of accepting our terms** (when you accept the Terms of Service and this Privacy Policy, we keep the version you accepted, the items you ticked, your platform, the App version, and the time)

### 3.2 Roster and salary information

This is the core data the App is built to process. When you upload a roster file (PDF or Excel), import a roster from eCrew (see **Section 3.6**), or enter duties manually, we collect and generate:

- **Flight duty records** — dates, flight numbers, sectors, reporting and debriefing times, duty hours, and duty type (turnaround, layover, standby, etc.)
- **Layover rest periods** and associated per-diem calculations
- **Salary calculations** — basic salary, housing and transport allowances, flight pay, per-diem pay, and monthly totals, calculated from your roster and position
- **Custom pay rates** (if you enter your own): each figure and the month it applies from
- **Recurring expenses** (if you add any): each expense's description, amount, and start month, used to take it off the salary figure on your Dashboard
- **Position history** — records of when your position (CCM/SCCM) changed, so calculations remain accurate over time
- **Edit history** — an audit record of changes you make to your own flight data (what changed and when), so your records stay consistent and recoverable
- **The original content of roster files you upload**, retained so your records can be re-processed or corrected

This information relates to your employment and earnings and is therefore treated with particular care. Some leave types on a roster, such as Hajj or iddah leave, may also reveal your religion or family circumstances.

### 3.3 Friends information

The App includes an optional friends feature. If you use it, we process:

- Friend requests you send and receive (who, status, and timestamps)
- The connections between your account and accounts you are friends with

When you become friends with another user, certain profile information is shared between you. See **Section 5.2** for exactly what is and is not shared.

### 3.4 Device, notification, and security information

- **Push notification token** — if you enable notifications, we store a push token issued by the Expo notification service so we can deliver notifications to your device
- **Device identifier** — a random identifier generated by the App and stored on your device, used to associate push tokens with a specific device and to manage sign-in
- **Platform** — whether your device is iOS or Android (so notifications route correctly)
- **Device details on support messages:** when you send a message through Contact Us, we store it with your email address, the App version, and your device's operating system and version, model, and manufacturer, so we can look into your request
- **Sign-in and password reset attempts:** to limit repeated attempts and protect accounts, we record the IP address of each attempt and the email address or username entered. These records are deleted after about 24 hours

### 3.5 Information stored on your device

To make the App fast and usable offline, some information is stored locally on your device:

- A local cache (SQLite database) of your flights, salary calculations, profiles, and friends data
- Your authentication tokens, stored in your device's secure storage (Keychain on iOS / Keystore on Android)
- App preferences, such as whether notifications are enabled and whether certain prompts have been shown

This locally stored data stays on your device and is removed when you delete your account or sign out (tokens and cache are cleared).

### 3.6 eCrew Import (optional)

The App can import a month's roster directly from **eCrew**, the online crew roster system, instead of you uploading a roster file. eCrew Import is **optional**; nothing described here happens unless you use it. eCrew is a separate system: Skywage does not operate or control it, and is not affiliated with it.

- **Your Friends & Family login only.** eCrew Import signs in with your eCrew **Friends & Family** login — your staff ID and Friends & Family password. It never uses, and never asks for, your main eCrew account. Do not enter your main account password.
- **You sign in yourself, each time.** Every import opens eCrew's own sign-in page inside the App, with your login filled in, and **you tap eCrew's Log in button yourself**. The App never submits the sign-in for you. It keeps no eCrew cookies or session between imports.
- **Only when you start it.** An import runs only when you start it, with the App open on your screen. The App never signs in to eCrew, or reads your eCrew roster, in the background, on a schedule, or automatically.
- **Where your login is kept.** Once eCrew accepts your login, it is saved **only on your phone**, in the iOS Keychain, and tied to your Skywage account; it can only be read while your phone is unlocked. It is not restored to a new phone, including from a backup, and another Skywage account signing in on the same phone cannot use it.
- **Who receives your login.** Your login is sent **only to eCrew**, to sign you in. It is **never sent to Skywage's servers** or to our service providers, and we never have access to it.
- **What eCrew sends back.** eCrew's response is read **on your phone** and is never sent to Skywage's servers. From it, the App works out your duties (dates, flight numbers, sectors, and report and debrief times) and your pay, just as it does from an uploaded roster file. **Those duties and pay calculations are saved to your Skywage account and synced across your devices like any other roster** (see **Section 3.2**), and you can edit or delete them the same way.
- **Removing your login.** Your saved login is deleted from your phone when you tap **Disconnect eCrew** (Profile → eCrew Import), when you sign out of the App, and when you delete your account. Disconnecting does not delete rosters you have already imported.

### 3.7 What we do NOT collect

We want to be explicit about this. The App does **not**:

- Use analytics or telemetry SDKs
- Use advertising networks or serve ads
- Use crash-reporting or session-recording tools
- Track you across other apps or websites
- Collect your precise location, contacts, health data, or biometric data
- Collect or process payment card information (the App is not a payment app)

---

## 4. How we use your information

We use your personal information solely to operate and improve the App, specifically to:

- Create and manage your account and authenticate your sign-in
- Calculate your salary, allowances, and per-diem based on your roster and position
- Store and sync your data across your devices in real time
- Provide the friends feature, including searching by username and sharing roster/profile information you choose to share
- Import your roster from eCrew, only when you start an import (see Section 3.6)
- Send you notifications you have enabled (for example, friend requests)
- Maintain the integrity, security, and recoverability of your data
- Respond to your support requests and enforce our Terms of Service

We do **not** use your information for advertising, profiling, or automated decision-making that produces legal or similarly significant effects.

---

## 5. How your information is shared

We do **not sell or rent** your personal data. We share information only in the limited circumstances below.

### 5.1 Service providers (processors)

We rely on a small number of trusted service providers to run the App. They process data only on our instructions and only to provide their service to us:

| Provider                                                                                 | Purpose                                                                       | Data involved                                         |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Supabase** (hosted on AWS, Mumbai, India)                                              | Authentication, database, file storage, and real-time sync — our core backend | All account, roster, salary, friends, support, and avatar data |
| **Resend**                                                                               | Sending the App's emails: password reset codes, security notices, and messages you send us through Contact Us | Your email address and the content of the email       |
| **Expo** (Expo push notification service)                                                | Delivering push notifications to your device                                  | Push token, device identifier, notification content   |
| **Apple Push Notification service (APNs)** and **Google Firebase Cloud Messaging (FCM)** | Operating-system push delivery on iOS and Android                             | Push token and notification payload                   |

### 5.2 Other users (the friends feature)

When you connect with another user as a friend, you are choosing to share certain information with them. A friend can see:

- Your first name and last name
- Your username
- Your position and airline
- Your profile picture
- Your roster for a given month — **only if you have not enabled the "hide roster from friends" setting**

A friend **cannot** see your **email address** or your **nationality**. You control roster visibility at any time using the **hide roster from friends** setting, and you can remove a friend (unfriend) at any time.

### 5.3 eCrew

eCrew is not one of our service providers. When you use eCrew Import (see **Section 3.6**), your phone connects directly to eCrew and sends your Friends & Family login to eCrew to sign you in. eCrew's own terms and privacy practices apply to your eCrew login and to what eCrew records when you sign in.

### 5.4 Legal and safety

We may disclose information if required to do so by law, regulation, legal process, or governmental request, or where we believe disclosure is necessary to protect our rights, your safety or the safety of others, or to investigate fraud or security issues.

### 5.5 Business transfers

If Skywage is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change and of any choices you may have.

---

## 6. Where your data is stored and international transfers

Your data is stored and processed by Supabase on Amazon Web Services infrastructure located in the **`ap-south-1` region (Mumbai, India)**. Push notification infrastructure is operated by Expo, Apple, and Google and may process data in other countries. Emails from the App, such as password reset codes, are sent through Resend, which processes them in the **United States**.

If you are located in the United Arab Emirates, the European Economic Area, the United Kingdom, or elsewhere, this means your personal data is transferred to and stored in India. Where required by applicable law (including the UAE PDPL and the EU/UK GDPR), we rely on appropriate safeguards for these transfers and limit the data transferred to what is necessary to provide the App.

---

## 7. How long we keep your data

We keep your personal data for as long as your account is active and as needed to provide the App. Specifically:

- **Account, profile, roster, and salary data** — retained until you delete it or delete your account
- **Friends data** — retained until the friendship is removed or an account is deleted
- **Push tokens** — removed when you sign out of a device or disable notifications
- **eCrew login** — kept on your phone until you disconnect eCrew, sign out, or delete your account
- **Local on-device data** — cleared when you sign out or delete your account
- **Support messages and the record of accepting our terms:** retained until you delete your account
- **Sign-in and password reset attempt records:** deleted automatically after about 24 hours

When you delete your account, your data is permanently deleted as described in **Section 9**. We may retain limited records where we are legally required to do so, for the minimum period required.

---

## 8. Your rights and choices

Depending on your location, you may have rights under the UAE PDPL, the EU/UK GDPR, or other applicable laws, including the right to:

- **Access** the personal data we hold about you
- **Correct** inaccurate or incomplete data
- **Delete** your data ("right to erasure")
- **Export / port** your data
- **Object to or restrict** certain processing
- **Withdraw consent** where processing is based on consent (for example, notifications or the optional nationality field)

You can exercise many of these rights directly in the App:

- **Edit** your profile, position, name, username, and roster data at any time
- **Control notifications** via the notifications setting and your device's system settings
- **Control roster visibility** to friends via the "hide roster from friends" setting
- **Disconnect eCrew** at any time, which deletes your saved eCrew login from your phone (Profile → eCrew Import)
- **Delete your account** and all associated data (see Section 9)

For any request you cannot complete in the App, or to ask a question about your rights, contact us at **support@skywage.ae** or via the in-app Contact Us form. We will respond within the timeframe required by applicable law. You also have the right to lodge a complaint with your local data protection authority.

---

## 9. Account deletion

You can permanently delete your account from within the App (Profile → Delete Account). When you confirm deletion, we permanently delete:

- Your profile and personal information
- All of your flight data and salary calculations
- Your custom pay rates and recurring expenses
- Your support messages and the record of accepting our terms
- All of your friendships and friend requests
- Your uploaded avatar and files

Your local on-device cache is also wiped, and your saved eCrew login, if any, is deleted from your phone. This action is **irreversible**. If you have any difficulty deleting your account in the App, contact us at **support@skywage.ae** or via the in-app Contact Us form and we will action your request.

---

## 10. Security

We take reasonable technical and organizational measures to protect your data, including:

- **Encryption in transit** (HTTPS/TLS) for all communication with our servers
- **Row-Level Security** in our database, so each user can only access their own data
- **Secure on-device storage** of authentication tokens using the device Keychain/Keystore
- Access controls limiting who can access production systems

No method of transmission or storage is completely secure, and we cannot guarantee absolute security. You are responsible for keeping your password confidential.

---

## 11. Children's privacy

The App is intended for use by **employed adult cabin crew** and is **not directed at children**. We do not knowingly collect personal data from anyone under the age of 18. If you believe a minor has provided us with personal data, contact us at **support@skywage.ae** and we will delete it.

---

## 12. Changes to this Privacy Policy

We may update this Privacy Policy from time to time. When we make material changes, we will update the "Last updated" date above and, where appropriate, notify you in the App. Your continued use of the App after changes take effect constitutes acceptance of the updated policy.

---

## 13. Contact us

If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, contact us at:

**Skywage**
Email: **support@skywage.ae**
In-app: Profile → Contact Us
