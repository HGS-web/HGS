import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/HGS/',
  markdown: {
    image: {
      lazyLoading: true
    }
  },
  locales: {
    root: {
      title: 'Hellenic Geographical Society',
      description: 'Welcome to the Hellenic Geographical Society website.',
      themeConfig: {
        nav: [
          {
            text: 'The Society',
            items: [
              { text: 'History', link: 'en/The Society/History' },
              { text: 'Function', link: 'en/The Society/Function' },
              { text: 'Goals', link: 'en/The Society/Goals' },
              { text: 'Submission', link: 'en/The Society/Submission' },
              { text: 'Donations', link: 'en/The Society/Donations' },
            ],
          },
          {
            text: 'Collaborations',
            items: [
              { text: 'Academic and Scientific Bodies', link: 'en/Collaborations/Academic and Scientific Bodies' },
              { text: 'Geographical Societies and Networks', link: 'en/Collaborations/Geographical Societies and Networks' },
              { text: 'Other', link: 'en/Collaborations/Other' },
            ],
          },
          {
            text: 'Archive',
            items: [
              { text: 'Publications', link: 'en/Archive/Publications' },
              { text: 'Library', link: 'en/Archive/Library' },
              { text: 'Map Collection', link: 'en/Archive/Map Collection' },
              { text: 'Photos', link: 'en/Archive/Photos' },
              { text: 'Reports', link: 'en/Archive/Reports' },
            ],
          },
          {
            text: 'Conferences',
            items: [
              { text: 'GSG', link: 'en/Conferences/HGS' },
              { text: 'Other', link: 'en/Conferences/Other' },
            ],
          },
          {
            text: 'Contact us',
            items: [
              { text: 'Email', link: 'en/Contact us/Email' },
              { text: 'Social Media', link: 'en/Contact us/Social Media' },
              { text: 'Address', link: 'en/Contact us/Address' },
            ],
          },
          {
            text: 'Extra',
            items: [
              { text: 'News', link: 'en/Extra/News' },
              { text: 'Events', link: 'en/Extra/Events' },
              { text: 'GSG Conference 2024', link: 'en/Extra/GSG Conference 2024' },
            ],
          },
        ]
      }
    },
    en: {
      label: 'English',
      lang: 'en-US',
      title: 'Hellenic Geographical Society',
      description: 'Welcome to the Hellenic Geographical Society website.',
      themeConfig: {
        nav: [
          {
            text: 'The Society',
            items: [
              { text: 'History', link: 'en/The Society/History' },
              { text: 'Function', link: 'en/The Society/Function' },
              { text: 'Goals', link: 'en/The Society/Goals' },
              { text: 'Submission', link: 'en/The Society/Submission' },
              { text: 'Donations', link: 'en/The Society/Donations' },
            ],
          },
          {
            text: 'Collaborations',
            items: [
              { text: 'Academic and Scientific Bodies', link: 'en/Collaborations/Academic and Scientific Bodies' },
              { text: 'Geographical Societies and Networks', link: 'en/Collaborations/Geographical Societies and Networks' },
              { text: 'Other', link: 'en/Collaborations/Other' },
            ],
          },
          {
            text: 'Archive',
            items: [
              { text: 'Publications', link: 'en/Archive/Publications' },
              { text: 'Library', link: 'en/Archive/Library' },
              { text: 'Map Collection', link: 'en/Archive/Map Collection' },
              { text: 'Photos', link: 'en/Archive/Photos' },
              { text: 'Reports', link: 'en/Archive/Reports' },
            ],
          },
          {
            text: 'Conferences',
            items: [
              { text: 'GSG', link: 'en/Conferences/HGS' },
              { text: 'Other', link: 'en/Conferences/Other' },
            ],
          },
          {
            text: 'Contact us',
            items: [
              { text: 'Email', link: 'en/Contact us/Email' },
              { text: 'Social Media', link: 'en/Contact us/Social Media' },
              { text: 'Address', link: 'en/Contact us/Address' },
            ],
          },
          {
            text: 'Extra',
            items: [
              { text: 'News', link: 'en/Extra/News' },
              { text: 'Events', link: 'en/Extra/Events' },
              { text: 'GSG Conference 2024', link: 'en/Extra/GSG Conference 2024' },
            ],
          },
        ],
        sidebar: [
          {
            text: 'The Society',
            items: [
              { text: 'History', link: 'en/The Society/History' },
              { text: 'Function', link: 'en/The Society/Function' },
              { text: 'Goals', link: 'en/The Society/Goals' },
              { text: 'Submission', link: 'en/The Society/Submission' },
              { text: 'Donations', link: 'en/The Society/Donations' },
            ],
          },
          {
            text: 'Collaborations',
            items: [
              { text: 'Academic and Scientific Bodies', link: 'en/Collaborations/Academic and Scientific Bodies' },
              { text: 'Geographical Societies and Networks', link: 'en/Collaborations/Geographical Societies and Networks' },
              { text: 'Other', link: 'en/Collaborations/Other' },
            ],
          },
          {
            text: 'Archive',
            items: [
              { text: 'Publications', link: 'en/Archive/Publications' },
              { text: 'Library', link: 'en/Archive/Library' },
              { text: 'Map Collection', link: 'en/Archive/Map Collection' },
              { text: 'Photos', link: 'en/Archive/Photos' },
              { text: 'Reports', link: 'en/Archive/Reports' },
            ],
          },
          {
            text: 'Conferences',
            items: [
              { text: 'GSG', link: 'en/Conferences/HGS' },
              { text: 'Other', link: 'en/Conferences/Other' },
            ],
          },
          {
            text: 'Contact us',
            items: [
              { text: 'Email', link: 'en/Contact us/Email' },
              { text: 'Social Media', link: 'en/Contact us/Social Media' },
              { text: 'Address', link: 'en/Contact us/Address' },
            ],
          },
          {
            text: 'Extra',
            items: [
              { text: 'News', link: 'en/Extra/News' },
              { text: 'Events', link: 'en/Extra/Events' },
              { text: 'GSG Conference 2024', link: 'en/Extra/GSG Conference 2024' },
            ],
          },
        ],
      },
    },
    el: {
      label: 'Ελληνικά',
      lang: 'el-GR',
      link: '/el/',
      title: 'Ελληνική Γεωγραφική Εταιρεία',
      description: 'Καλώς ήρθατε στην ιστοσελίδα της Ελληνικής Γεωγραφικής Εταιρείας.',
      themeConfig: {
        nav: [
          {
            text: 'Η Εταιρεία',
            items: [
              { text: 'Ιστορία', link: '/el/The Society/History' },
              { text: 'Λειτουργία', link: '/el/The Society/Function' },
              { text: 'Στόχοι', link: '/el/The Society/Goals' },
              { text: 'Εγγραφή', link: '/el/The Society/Submission' },
              { text: 'Δωρεές', link: '/el/The Society/Donations' },
            ],
          },
          {
            text: 'Συνεργασίες',
            items: [
              { text: 'Ακαδημαϊκοί και Επιστημονικοί Φορείς', link: '/el/Collaborations/Academic and Scientific Bodies' },
              { text: 'Γεωγραφικές Εταιρείες και Δίκτυα', link: '/el/Collaborations/Geographical Societies and Networks' },
              { text: 'Άλλα', link: '/el/Collaborations/Other' },
            ],
          },
          {
            text: 'Αρχείο',
            items: [
              { text: 'Δημοσιεύσεις', link: '/el/Archive/Publications' },
              { text: 'Βιβλιοθήκη', link: '/el/Archive/Library' },
              { text: 'Χαρτοθήκη', link: '/el/Archive/Map Collection' },
              { text: 'Φωτογραφίες', link: '/el/Archive/Photos' },
              { text: 'Εκθέσεις', link: '/el/Archive/Reports' },
            ],
          },
          {
            text: 'Συνέδρια',
            items: [
              { text: 'ΕΓΕ', link: '/el/Conferences/HGS' },
              { text: 'Άλλα', link: '/el/Conferences/Other' },
            ],
          },
          {
            text: 'Επικοινωνία',
            items: [
              { text: 'Ηλεκτρονικό ταχυδρομείο', link: '/el/Contact us/Email' },
              { text: 'Κοινωνικά Δίκτυα', link: '/el/Contact us/Social Media' },
              { text: 'Διεύθυνση', link: '/el/Contact us/Address' },
            ],
          },
          {
            text: 'Extra',
            items: [
              { text: 'Νέα', link: '/el/Extra/News' },
              { text: 'Εκδηλώσεις', link: '/el/Extra/Events' },
              { text: 'Συνέδριο ΕΓΕ 2024', link: '/el/Extra/GSG Conference 2024' },
            ],
          },
        ],
        sidebar: [
          {
            text: 'Η Εταιρεία',
            items: [
              { text: 'Ιστορία', link: '/el/The Society/History' },
              { text: 'Λειτουργία', link: '/el/The Society/Function' },
              { text: 'Στόχοι', link: '/el/The Society/Goals' },
              { text: 'Εγγραφή', link: '/el/The Society/Submission' },
              { text: 'Δωρεές', link: '/el/The Society/Donations' },
            ],
          },
          {
            text: 'Συνεργασίες',
            items: [
              { text: 'Ακαδημαϊκοί και Επιστημονικοί Φορείς', link: '/el/Collaborations/Academic and Scientific Bodies' },
              { text: 'Γεωγραφικές Εταιρείες και Δίκτυα', link: '/el/Collaborations/Geographical Societies and Networks' },
              { text: 'Άλλα', link: '/el/Collaborations/Other' },
            ],
          },
          {
            text: 'Αρχείο',
            items: [
              { text: 'Δημοσιεύσεις', link: '/el/Archive/Publications' },
              { text: 'Βιβλιοθήκη', link: '/el/Archive/Library' },
              { text: 'Χαρτοθήκη', link: '/el/Archive/Map Collection' },
              { text: 'Φωτογραφίες', link: '/el/Archive/Photos' },
              { text: 'Εκθέσεις', link: '/el/Archive/Reports' },
            ],
          },
          {
            text: 'Συνέδρια',
            items: [
              { text: 'ΕΓΕ', link: '/el/Conferences/HGS' },
              { text: 'Άλλα', link: '/el/Conferences/Other' },
            ],
          },
          {
            text: 'Επικοινωνία',
            items: [
              { text: 'Ηλεκτρονικό ταχυδρομείο', link: '/el/Contact us/Email' },
              { text: 'Κοινωνικά Δίκτυα', link: '/el/Contact us/Social Media' },
              { text: 'Διεύθυνση', link: '/el/Contact us/Address' },
            ],
          },
          {
            text: 'Extra',
            items: [
              { text: 'Νέα', link: '/el/Extra/News' },
              { text: 'Εκδηλώσεις', link: '/el/Extra/Events' },
              { text: 'Συνέδριο ΕΓΕ 2024', link: '/el/Extra/GSG Conference 2024' },
            ],
          },
        ],
      },
    },
  },
})
