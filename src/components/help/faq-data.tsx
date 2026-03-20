import type { ReactNode } from 'react';

export interface FAQItem {
  question: string;
  answer: ReactNode;
}

export interface FAQCategory {
  title: string;
  items: FAQItem[];
}

export const faqCategories: FAQCategory[] = [
  {
    title: 'General',
    items: [
      {
        question: 'What is Skywage?',
        answer: (
          <p>Skywage is a salary calculator built specifically for cabin crew. It breaks down your monthly salary into flight pay, per diem, and fixed allowances — so you always know exactly what you&apos;re earning and why.</p>
        ),
      },
      {
        question: 'Who is Skywage for?',
        answer: (
          <p>Skywage is designed exclusively for Flydubai Cabin Crew Members (CCM) and Senior Cabin Crew Members (SCCM). The salary rules, rates, and roster format are all configured for Flydubai. Other airlines and roles are not currently supported.</p>
        ),
      },
      {
        question: 'Is my data private?',
        answer: (
          <p>Yes. Your roster data and salary figures are only visible to you. The only exception is the Friends feature, where you choose to share a roster comparison with specific friends you&apos;ve connected with.</p>
        ),
      },
      {
        question: 'Is Skywage affiliated with any airline?',
        answer: (
          <p>No. Skywage is an independent tool built by crew, for crew.</p>
        ),
      },
    ],
  },
  {
    title: 'Uploading Your Roster',
    items: [
      {
        question: 'What file formats can I upload?',
        answer: (
          <p>Only Excel (<code>.xlsx</code>, <code>.xlsm</code>) files are currently supported.</p>
        ),
      },
      {
        question: 'Where do I get my roster file?',
        answer: (
          <p>Download it directly from your eCrew portal (Crew Schedule - My Schedule - Select Period - Print - XLSX). The file must be the official Flydubai roster export — Skywage reads the standard format and will reject files that don&apos;t match.</p>
        ),
      },
      {
        question: 'What happens if I already have data for that month?',
        answer: (
          <p>Skywage will ask whether you want to keep your existing data or replace it with the new file. If you replace, all existing flights for that month are removed and re-imported from the new file.</p>
        ),
      },
      {
        question: 'My upload failed. What should I check?',
        answer: (
          <div className="space-y-2">
            <p>The most common causes are:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The file isn&apos;t a genuine Flydubai roster export (wrong format or header)</li>
              <li>The file is empty or corrupted</li>
              <li>The month/year couldn&apos;t be detected from the file</li>
              <li>The file is larger than 10 MB</li>
            </ul>
            <p>The error message will tell you specifically what went wrong. If the issue persists, try re-exporting from the eCrew portal.</p>
          </div>
        ),
      },
    ],
  },
  {
    title: 'Adding Flights Manually',
    items: [
      {
        question: 'How do I add a flight manually?',
        answer: (
          <p>Click <strong>Add Flight</strong> on the dashboard. Fill in the date, duty type, flight numbers, sectors, and report/debrief times. Skywage shows a live pay preview as you type, so you can verify before saving.</p>
        ),
      },
      {
        question: 'What format should flight numbers be in?',
        answer: (
          <p>Flydubai flight numbers only — e.g., <code>FZ549</code> or <code>FZ1, FZ2</code> for multi-leg duties. The <code>FZ</code> prefix is required.</p>
        ),
      },
      {
        question: 'What format should sectors be in?',
        answer: (
          <p>IATA code pairs separated by a dash — e.g., <code>DXB-ZAG</code> or <code>DXB-ZAG-DXB</code> for a turnaround. Skywage validates the format as you type.</p>
        ),
      },
      {
        question: 'Can I add multiple flights at once?',
        answer: (
          <p>Yes. After saving a flight, you can immediately add the next one without closing the form.</p>
        ),
      },
    ],
  },
  {
    title: 'Friends & Roster Comparison',
    items: [
      {
        question: 'What is the Friends feature?',
        answer: (
          <p>Friends lets you connect with other crew on Skywage and view a side-by-side roster comparison grid — day by day, for any month.</p>
        ),
      },
      {
        question: 'How do I add a friend?',
        answer: (
          <p>Go to the <strong>Friends</strong> page and enter their username in the Send Request field. They&apos;ll receive a request and need to accept before the comparison is visible to either of you.</p>
        ),
      },
      {
        question: 'How many friends can I compare at once?',
        answer: (
          <p>Up to 5 friends simultaneously. You can have more friends connected, but only 5 can be selected for the comparison grid at a time.</p>
        ),
      },
      {
        question: 'Can my friends see my salary figures?',
        answer: (
          <p>The comparison grid shows duty type and flight pay per duty. Your full monthly total and personal salary breakdown are not shared.</p>
        ),
      },
    ],
  },
  {
    title: 'Statistics',
    items: [
      {
        question: 'What does the Statistics page show?',
        answer: (
          <div className="space-y-2">
            <p>Three main views:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>YTD Earnings</strong> — cumulative salary for the year with a line chart and year-over-year comparison</li>
              <li><strong>Monthly Comparison</strong> — how your current month stacks up against previous months (earnings, hours, flight count)</li>
              <li><strong>Duty Types Breakdown</strong> — which duty types earned you the most, with an efficiency metric (AED per hour) to show which duties are most profitable</li>
            </ul>
          </div>
        ),
      },
      {
        question: 'Can I compare across years?',
        answer: (
          <p>Yes. The year selector on the Statistics page lets you switch between any year that has data. The YTD card also shows the change vs the previous year.</p>
        ),
      },
      {
        question: 'Why is a month missing from my statistics?',
        answer: (
          <p>Statistics are only generated for months where you have flight data. If a month is empty, upload your roster or add flights for it.</p>
        ),
      },
    ],
  },
  {
    title: 'Settings & Account',
    items: [
      {
        question: 'How do I update my name or username?',
        answer: (
          <p>Go to <strong>Settings &rarr; Profile &rarr; Personal Details</strong>.</p>
        ),
      },
      {
        question: 'How do I change my password?',
        answer: (
          <p>Go to <strong>Settings &rarr; Profile &rarr; Personal Details &rarr; Password Update</strong>.</p>
        ),
      },
      {
        question: 'How do I record a position change?',
        answer: (
          <p>In <strong>Settings &rarr; Profile &rarr; Professional Details</strong>, update your position and set the effective date. Skywage will automatically use the correct position and rates for each month going forward and for any historical months that fall after the effective date.</p>
        ),
      },
      {
        question: 'Can I hide rest days and off-days from my dashboard?',
        answer: (
          <p>Yes. Go to <strong>Settings &rarr; Preferences</strong> and enable &quot;Hide off-days on dashboard.&quot; This removes rest, off, annual leave, and sick days from the flight table to reduce clutter.</p>
        ),
      },
      {
        question: 'How do I delete my account?',
        answer: (
          <p>Go to <strong>Settings &rarr; Profile</strong> and scroll to the bottom. Select <strong>Delete Account</strong>. This is permanent and will remove all your data.</p>
        ),
      },
    ],
  },
  {
    title: 'Troubleshooting',
    items: [
      {
        question: 'My salary looks lower than expected. What should I check?',
        answer: (
          <div className="space-y-2">
            <ol className="list-decimal pl-5 space-y-1">
              <li>Check your position is correct for that month (Settings &rarr; Profile)</li>
              <li>Check your position history if you were promoted during the year</li>
              <li>Look for any duties classified as unpaid types (SBY, rest, leave)</li>
              <li>Check for missing flights — an incomplete roster will give an incomplete total</li>
            </ol>
          </div>
        ),
      },
      {
        question: 'A flight is showing the wrong duty type. Can I fix it?',
        answer: (
          <p>Yes. Click the edit icon on any flight in the dashboard table. You can change the duty type, times, and other details. The salary recalculates immediately on save.</p>
        ),
      },
      {
        question: 'I uploaded my roster but some flights are missing. Why?',
        answer: (
          <p>The parser reads the standard Flydubai roster export format. If a row in the file has an unrecognised format or is missing required fields (date, times), it may be skipped. Check the upload error details for specifics.</p>
        ),
      },
      {
        question: 'Can I undo a roster upload?',
        answer: (
          <p>Not automatically, but you can delete individual flights from the dashboard or re-upload the same file. If you replaced an existing month&apos;s data by mistake, you&apos;ll need to re-upload the correct file or add the missing flights manually.</p>
        ),
      },
      {
        question: "Can I use Skywage if my airline isn't Flydubai?",
        answer: (
          <p>Not currently. The salary rules, rates, and roster format are configured specifically for Flydubai. Support for other airlines may come in the future.</p>
        ),
      },
    ],
  },
];
