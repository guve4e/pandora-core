import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import VueApexCharts from 'vue3-apexcharts';

import './styles.css'; // base reset from Nx template
import './style.css'; // tailwind directives

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(VueApexCharts);

app.mount('#root');
