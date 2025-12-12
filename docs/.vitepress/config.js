import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/HGS/',
  markdown: {
    image: {
      lazyLoading: true
    },
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
              { text: 'Registration', link: 'en/The Society/Submission' },
            ],
          },
          {
            text: 'Collaboration - Networks',
            items: [
              { text: 'Academic and Scientific Bodies', link: 'en/Collaborations/Academic and Scientific Bodies' },
              { text: 'Geographical Societies', link: 'en/Collaborations/Geographical Societies and Networks' },
              { text: 'Other Networks', link: 'en/Collaborations/Other' },
            ],
          },
          {
            text: 'Conferences',
            items: [
              { text: 'GSG', link: 'en/Conferences/HGS' },
              { text: 'Other', link: 'en/Conferences/Other' },
            ],
          },
          { text: 'Contact us', link: 'en/Contact us/Address' },
          {
            text: 'Language',
            items: [
              { text: 'English', link: '/' },
              { text: 'Ελληνικά', link: '/el/' }
            ],
          },
        ],
        socialLinks: [
          { icon: 'github', link: 'https://github.com/HGS-web/HGS/' },
          { icon: 'facebook', link: 'https://www.facebook.com/HellenicGEOSOCIETY/' }
        ],
        footer: {
          message: 'Developed by Alexandros P. Liaskos',
          copyright: 'Copyright © 2024 Hellenic Geographical Society'
        },
      },
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
              { text: 'Registration', link: 'en/The Society/Submission' },
            ],
          },
          {
            text: 'Collaboration - Networks',
            items: [
              { text: 'Academic and Scientific Bodies', link: 'en/Collaborations/Academic and Scientific Bodies' },
              { text: 'Geographical Societies', link: 'en/Collaborations/Geographical Societies and Networks' },
              { text: 'Other Networks', link: 'en/Collaborations/Other' },
            ],
          },
          {
            text: 'Conferences',
            items: [
              { text: 'GSG', link: 'en/Conferences/HGS' },
              { text: 'Other', link: 'en/Conferences/Other' },
            ],
          },
          { text: 'Contact us', link: 'en/Contact us/Address' },
        ],
        socialLinks: [
          { icon: 'github', link: 'https://github.com/HGS-web/HGS/' },
          { icon: 'facebook', link: 'https://www.facebook.com/HellenicGEOSOCIETY/' }
        ],
        footer: {
          message: 'Developed by Alexandros P. Liaskos',
          copyright: 'Copyright © 2024 Hellenic Geographical Society'
        },
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
            ],
          },
          {
            text: 'Συνεργασίες - Δίκτυα',
            items: [
              { text: 'Ακαδημαϊκοί Φορείς', link: '/el/Collaborations/Academic and Scientific Bodies' },
              { text: 'Γεωγραφικές Εταιρείες και Ενώσεις', link: '/el/Collaborations/Geographical Societies and Networks' },
              { text: 'Άλλα Δίκτυα', link: '/el/Collaborations/Other' },
            ],
          },
          {
            text: 'Συνέδρια',
            items: [
              { text: 'ΕΓΕ', link: '/el/Conferences/HGS' },
              { text: 'Άλλα', link: '/el/Conferences/Other' },
            ],
          },
          { text: 'Επικοινωνία', link: '/el/Contact us/Address' },
        ],
        socialLinks: [
          { icon: 'github', link: 'https://github.com/HGS-web/HGS/' },
          { icon: 'facebook', link: 'https://www.facebook.com/HellenicGEOSOCIETY/' }
        ],
        footer: {
          message: 'Δημιουργός: Αλέξανδρος Π. Λιάσκος',
          copyright: 'Copyright © 2024 Hellenic Geographical Society'
        },
      },
    },
  },
})
