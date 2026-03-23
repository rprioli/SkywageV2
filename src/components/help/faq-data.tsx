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
        question: 'Is my data private?',
        answer: (
          <p>Yes. Your roster data and salary figures are only visible to you. The only exception is the Friends feature, where you choose to share a roster comparison with specific friends you&apos;ve connected with.</p>
        ),
      },
      {
        question: 'Is Skywage affiliated with any airline?',
        answer: (
          <p>No. Skywage is an independent tool built by aviation professionals.</p>
        ),
      },
      {
        question: "Can I use Skywage if my airline isn't Flydubai?",
        answer: (
          <p>Not currently. Support for other airlines may come in the future.</p>
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
              <li>The file isn&apos;t a genuine roster export file (wrong format or header)</li>
              <li>The file is empty or corrupted</li>
              <li>The month/year couldn&apos;t be detected from the file</li>
              <li>The file is larger than 10 MB</li>
            </ul>
            <p>If the issue persists, try re-exporting from the eCrew portal or contacting us.</p>
          </div>
        ),
      },
      {
        question: 'Can I undo a roster upload?',
        answer: (
          <p>Not automatically, but you can delete individual flights from the dashboard or re-upload the same file. If you replaced an existing month&apos;s data by mistake, you&apos;ll need to re-upload the correct file or add the missing flights manually.</p>
        ),
      },
      {
        question: 'I uploaded my roster but some flights are missing. Why?',
        answer: (
          <p>The system reads the standard roster export format. If a row in the file has an unrecognised format or is missing required fields (date, times), it may be skipped. Check the upload error details for specifics.</p>
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
          <p>No, your full monthly total and personal salary breakdown are not shared. The grid shows only duty type.</p>
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
        question: 'Can I delete my account?',
        answer: (
          <p>Yes. Go to <strong>Settings &rarr; Profile</strong> and scroll to the bottom. Select <strong>Delete Account</strong>. This is permanent and will remove all your data.</p>
        ),
      },
    ],
  },
];
