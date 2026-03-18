import { createApp } from 'vue';
import App from './App.vue';

const MOUNT_ID = 'pandora-assistant-widget-root';

function ensureMountNode(): HTMLElement {
  let el = document.getElementById(MOUNT_ID);

  if (!el) {
    el = document.createElement('div');
    el.id = MOUNT_ID;
    document.body.appendChild(el);
  }

  return el;
}

createApp(App).mount(ensureMountNode());
