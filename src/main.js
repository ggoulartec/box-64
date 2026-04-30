import {createApp} from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

import FloatLabel from 'primevue/floatlabel';
import MultiSelect from 'primevue/multiselect';
import OverlayBadge from 'primevue/overlaybadge';
import Badge from 'primevue/badge';
import ConfirmationService from 'primevue/confirmationservice';
import ConfirmPopup from 'primevue/confirmpopup';
import ToastService from 'primevue/toastservice';
import Toast from 'primevue/toast';

import App from './App.vue'
import router from './router'

import './global.css'
import 'primeicons/primeicons.css'

const app = createApp(App);

app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});
app.use(ConfirmationService);
app.use(ToastService);

app.component('FloatLabel', FloatLabel);
app.component('MultiSelect', MultiSelect);
app.component('OverlayBadge', OverlayBadge);
app.component('Badge', Badge);
app.component('ConfirmPopup', ConfirmPopup);
app.component('Toast', Toast);

app.mount('#app');