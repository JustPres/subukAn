# Google Forms Setup & Copy-Paste Checklist

This document provides the step-by-step setup guide and word-for-word copy-paste text for configuring user testing forms for the **subukAn** manual pilot.

---

## 1. Google Forms Settings Configuration

Before adding questions, configure these settings in Google Forms to prevent duplicate submissions, ensure valid tester email capture, and maintain submission quality.

> [!IMPORTANT]
> Failure to set these settings will allow testers to submit multiple times or skip authentication, which increases the risk of spam or Sybil attacks.

### Step-by-Step Settings Configuration

1. **Open Settings Tab:** In your Google Form editor, click on the **Settings** tab at the top.
2. **Configure Responses:**
   * **Collect email addresses:** Change this setting to **Verified**. This requires testers to log in to their Google Account, ensuring we collect a verified email address.
   * **Limit to 1 response:** Toggle this to **ON**. This prevents testers from submitting multiple forms and claiming multiple payouts.
3. **Configure Presentation:**
   * **Show link to submit another response:** Toggle this to **OFF**. This ensures the page does not prompt them to submit another test immediately.
4. **Configure Defaults:**
   * **Question defaults:** Make sure "Make questions required by default" is toggled **ON**. Every metric and text field in this test must be completed.

---

## 2. Copy-Paste Form Layout

Use the following section headers, descriptions, and fields word-for-word to build your testing form.

### Section 1: Pre-Test Agreement & Profile

#### Section Header
```text
Section 1: Pre-Test Agreement & Profile
```

#### Section Description
```text
Thank you for participating in this user test! Before you begin, please read and agree to the terms below.

You will be asked to perform 3 usability tasks on a web application, record your screen and voice, and submit your honest feedback. You will receive the designated tester reward rate via GCash upon review and approval of a valid submission.

Please ensure you complete this test in one sitting. If you have any questions, contact the Pilot Coordinator.
```

---

#### Field 1.1: Full Name
* **Question Type:** Short answer
* **Required:** Yes
* **Copy-paste text:**
```text
Full Name
```

#### Field 1.2: GCash Mobile Number
* **Question Type:** Short answer
* **Required:** Yes
* **Response Validation:** 
  * Select `Regular expression` -> `Matches` -> Pattern: `^09\d{9}$`
  * Custom error text: `Please enter a valid 11-digit GCash mobile number starting with 09 (e.g., 09171234567).`
* **Copy-paste text:**
```text
GCash Mobile Number
```

#### Field 1.3: Device Type Used for This Test
* **Question Type:** Multiple choice
* **Required:** Yes
* **Copy-paste question and options:**
```text
Device Type used for this test:
- Desktop / Laptop (Windows/macOS/Linux)
- Mobile Phone / Tablet (Android/iOS)
```

#### Field 1.4: Technical Comfort Level
* **Question Type:** Multiple choice
* **Required:** Yes
* **Copy-paste question and options:**
```text
Technical Comfort Level:
- Tech-comfort: Student Developer / Software Engineer
- Tech-comfort: Casual Tech User (uses social media, online shopping, mobile banking easily)
- Tech-comfort: Non-Technical User (rarely uses web apps, finds tech challenging)
```

#### Field 1.5: Data Privacy & Confidentiality Agreement
* **Question Type:** Checkboxes
* **Required:** Yes
* **Question Text:**
```text
Data Privacy & Confidentiality Agreement
```
* **Question Description / Help Text:**
```text
Pursuant to the Philippine Data Privacy Act of 2012 (RA 10173), your profile and recording will only be shared with the app developer for usability improvement. You agree not to disclose, share, or screenshot any proprietary features of the app tested.
```
* **One-Line Plain-Language Restatement (Shown immediately above choice):**
```text
You are agreeing to complete this task honestly — payment depends on it.
```
* **Copy-paste Option:**
```text
I agree to the terms, consent to the recording of my screen and voice, and pledge to keep the app details confidential.
```

---

### Section 2: Recording Setup & App Access

#### Section Header
```text
Section 2: Recording Setup & App Access
```

#### Section Description
```text
Please open your screen recorder (e.g., Loom, native system recorder) now.

1. Start recording your screen and ensure your microphone is turned ON.
2. Speak clearly to check your audio. Introduce yourself: state the device you are using and your tech comfort level (e.g., "Hi, I am using a desktop and consider myself a casual user").
3. Click the link below to open the test application in a new tab:
   Test App Link: https://example-client-app.vercel.app

(Coordinator Note: Replace the URL above with the actual deployed client app URL before sending to testers)

4. Keep this Google Form tab open in the background. Return to it to log your metrics after completing each task. Do not stop the recording until all tasks are finished!
```

---

#### Field 2.1: Audio & Microphone Check
* **Question Type:** Multiple choice
* **Required:** Yes
* **Copy-paste question and options:**
```text
Confirm you have started recording and that your microphone is capturing your voice:
- Yes, my screen is recording and my microphone is ON (I have spoken out loud for the audio check).
```

#### Field 2.2: Preparing for Video Upload
* **Question Type:** Multiple choice
* **Required:** Yes
* **Question Text:**
```text
Confirm you understand how to upload and share the recording at the end of the test:
```
* **Question Description / Help Text:**
```text
If you are using Loom, you will copy the instant link. If using a native recorder, you will upload the file (up to 100MB) to Google Drive and set the share settings to "Anyone with the link can view".
```
* **Copy-paste Option:**
```text
Yes, I understand how to share my video at the end of this test.
```

---

### Section 3: Tasks & Metrics

This section contains the instructions and structured metrics for each of the 3 testing tasks.

> [!TIP]
> The metrics collected here allow the platform to aggregate Quantitative Ease-of-Use metrics alongside Qualitative User feedback. Ensure testers speak their thought process out loud for all tasks.

---

#### Task 1: Account Creation & Sign Up

##### Section Header
```text
Task 1: Account Creation & Sign Up
```

##### Section Description
```text
Instructions: Navigate to the sign-up page of the test application. Create a new account using realistic fake data. Verify that you have successfully reached the user dashboard. Speak out loud as you do this—describe what you expect to see, what is confusing, or where you get stuck.
```

##### Field 3.1.1: Task Completion
* **Question Type:** Multiple choice
* **Required:** Yes
* **Copy-paste question and options:**
```text
Did you successfully complete Task 1?
- Yes
- No
```

##### Field 3.1.2: Difficulty Rating
* **Question Type:** Linear scale (1 to 5)
* **Required:** Yes
* **Scale Labels:**
  * `1` label: `Very Easy`
  * `5` label: `Very Difficult`
* **Copy-paste question:**
```text
Rate how easy or difficult Task 1 was:
```

##### Field 3.1.3: Video Timestamp
* **Question Type:** Short answer
* **Required:** Yes
* **Question Text:**
```text
What is the video timestamp (MM:SS) when you started and finished Task 1?
```
* **Question Description / Help Text:**
```text
Format: Start [MM:SS] - End [MM:SS] (e.g., Start 00:15 - End 02:30). Use the progress counter on your recording app.
```

##### Field 3.1.4: Qualitative Feedback
* **Question Type:** Paragraph
* **Required:** Yes
* **Question Text:**
```text
What was the most confusing, frustrating, or challenging part of Task 1?
```
* **Question Description / Help Text:**
```text
Be specific about any UI elements, text labels, or behaviors that slowed you down. If you encountered no issues and it was completely clear, write "None".
```

---

#### Task 2: Searching and Cart Management

##### Section Header
```text
Task 2: Searching and Cart Management
```

##### Section Description
```text
Instructions: Use the search bar to search for a product (e.g., "Slipper"). Select the item, add it to your shopping cart, change the quantity to 2, and verify that the cart subtotal updates correctly. Speak your thoughts out loud during the process.
```

##### Field 3.2.1: Task Completion
* **Question Type:** Multiple choice
* **Required:** Yes
* **Copy-paste question and options:**
```text
Did you successfully complete Task 2?
- Yes
- No
```

##### Field 3.2.2: Difficulty Rating
* **Question Type:** Linear scale (1 to 5)
* **Required:** Yes
* **Scale Labels:**
  * `1` label: `Very Easy`
  * `5` label: `Very Difficult`
* **Copy-paste question:**
```text
Rate how easy or difficult Task 2 was:
```

##### Field 3.2.3: Video Timestamp
* **Question Type:** Short answer
* **Required:** Yes
* **Question Text:**
```text
What is the video timestamp (MM:SS) when you started and finished Task 2?
```
* **Question Description / Help Text:**
```text
Format: Start [MM:SS] - End [MM:SS] (e.g., Start 02:31 - End 04:10). Use the progress counter on your recording app.
```

##### Field 3.2.4: Qualitative Feedback
* **Question Type:** Paragraph
* **Required:** Yes
* **Question Text:**
```text
What was the most confusing, frustrating, or challenging part of Task 2?
```
* **Question Description / Help Text:**
```text
Be specific about any UI elements, text labels, or behaviors that slowed you down. If you encountered no issues and it was completely clear, write "None".
```

---

#### Task 3: Checkout and Mock Payment

##### Section Header
```text
Task 3: Checkout and Mock Payment
```

##### Section Description
```text
Instructions: Proceed to checkout from your shopping cart. Enter a fake shipping address, select "GCash" or "Cash on Delivery" as the payment method, and submit the order. Verify that you see a success screen or order confirmation page. Speak your thoughts out loud during the process.
```

##### Field 3.3.1: Task Completion
* **Question Type:** Multiple choice
* **Required:** Yes
* **Copy-paste question and options:**
```text
Did you successfully complete Task 3?
- Yes
- No
```

##### Field 3.3.2: Difficulty Rating
* **Question Type:** Linear scale (1 to 5)
* **Required:** Yes
* **Scale Labels:**
  * `1` label: `Very Easy`
  * `5` label: `Very Difficult`
* **Copy-paste question:**
```text
Rate how easy or difficult Task 3 was:
```

##### Field 3.3.3: Video Timestamp
* **Question Type:** Short answer
* **Required:** Yes
* **Question Text:**
```text
What is the video timestamp (MM:SS) when you started and finished Task 3?
```
* **Question Description / Help Text:**
```text
Format: Start [MM:SS] - End [MM:SS] (e.g., Start 04:11 - End 07:05). Use the progress counter on your recording app.
```

##### Field 3.3.4: Qualitative Feedback
* **Question Type:** Paragraph
* **Required:** Yes
* **Question Text:**
```text
What was the most confusing, frustrating, or challenging part of Task 3?
```
* **Question Description / Help Text:**
```text
Be specific about any UI elements, text labels, or behaviors that slowed you down. If you encountered no issues and it was completely clear, write "None".
```

---

### Section 4: Submission & Payout Link

#### Section Header
```text
Section 4: Submission & Payout Link
```

#### Section Description
```text
You have completed all the tasks! Please stop your screen recording now and save/upload it.

Make sure to double-check that your video sharing link is public so the Pilot Coordinator and Developer can view and verify it.
```

---

#### Field 4.1: Screen Recording Shareable URL
* **Question Type:** Short answer
* **Required:** Yes
* **Response Validation:**
  * Select `Text` -> `URL`
  * Custom error text: `Please enter a valid web URL.`
* **Copy-paste question:**
```text
Paste your Loom link or Google Drive shareable link here:
```
* **Question Description / Help Text:**
```text
If using Google Drive, make sure link sharing is set to "Anyone with the link can view". Submissions with inaccessible links or no audio cannot be approved.
```

#### Field 4.2: General Feedback
* **Question Type:** Paragraph
* **Required:** Yes
* **Copy-paste question:**
```text
Any other feedback or general comments about the app overall?
```
* **Question Description / Help Text:**
```text
Write any overall impressions, suggestions, or comments about the app UI or functionality. If you have no additional feedback, write "None".
```

---

> [!IMPORTANT]
> **Pre-Delivery Link Verification:** Before sending the final Google Form link to any tester, open the link in an **Incognito/Private Browser Window** to confirm that the form loads correctly and prompts for Google authentication.

---

## 3. Post-Pilot Client Review Questions

After delivering the compiled pilot test results, Loom video links, and structured feedback report to the client (app poster), administer the following review questions to evaluate feedback actionability, client satisfaction, and platform value validation.

### 1. Feedback Actionability & Clarity
* On a scale of 1–5, how actionable was the qualitative and video feedback provided by the subukAn pilot testers?
* Were the screen recordings, audio commentaries, and task timestamps clear enough for your engineering and design team to reproduce and fix identified usability friction points?
* Which specific video clips or tester comments provided the most value to your product team?

### 2. Product Insight & ROI Perception
* Did the pilot usability test uncover critical bugs, UI confusion, or conversion bottlenecks that your internal team was previously unaware of?
* How would you rate the overall ROI of this usability test compared to internal QA testing or unguided user analytics?

### 3. Process & Delivery Experience
* How satisfied were you with the turnaround time from test posting to receiving final tester submissions?
* Were the structured task metrics (Linear Scale difficulty ratings, task completion rates) helpful for your decision-making?

### 4. Commercial & Feature Validation
* What would be your preferred pricing structure for a self-serve platform version of subukAn (e.g., pay-per-tester slot, tier-based package, or monthly subscription)?
* What automated features would you consider essential in the upcoming subukAn web application?
  * [ ] Automated AI video transcriptions and key sentiment tagging
  * [ ] Demographic filtering (e.g., age, tech-comfort level, location)
  * [ ] In-app video trimming & clip export for bug reporting
  * [ ] Direct integration with Jira / GitHub Issues / Figma

---

## 4. Manual Pilot Success Benchmarks

To determine whether the manual pilot phase successfully validates the subukAn core value proposition and justifies advancing to full automated platform development, the pilot must satisfy the following quantitative and qualitative benchmarks:

| Metric / KPI | Target Benchmark | Measurement Method / Source |
| :--- | :--- | :--- |
| **Task Completion Rate** | $\ge 85\%$ across all tasks | Form Field 3.1.1, 3.2.1, 3.3.1 aggregation |
| **Recording Validity Rate** | $\ge 90\%$ (Audio & link valid) | Pilot Tracking Sheet verification (< 10% rejection rate) |
| **Client Satisfaction Score (CSAT)** | $\ge 4.0 / 5.0$ overall | Post-pilot client review survey |
| **Feedback Actionability Score** | $\ge 4.0 / 5.0$ rated by poster | Post-pilot client review survey |
| **Payout Turnaround Time** | $< 24$ hours post-approval | GCash transaction logs vs. submission timestamp |
| **Average Test Session Duration** | $10 - 18$ minutes | Loom / Drive video length verification |
| **Uncovered Usability Issues** | $\ge 2-3$ actionable items / run | Client post-test debrief report |

> [!TIP]
> If all target benchmarks are met, the pilot demonstrates strong product-market fit (PMF) for localized micro-usability testing in the Philippines, providing empirical backing for automated platform development.

