import DefaultTheme from 'vitepress/theme'
import { type Theme } from 'vitepress'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // register your custom global components
  }
} satisfies Theme 