import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import App from './App.vue'

// Import styles
import './style.css'
import './styles/design-system.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(PrimeVue)

app.mount('#app')
