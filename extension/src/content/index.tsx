import {TextboxComponent} from './box';
import ReactDOM from 'react-dom';

const container = document.createElement('div');
container.id = 'ctrl-b-container';
document.documentElement.appendChild(container);

container.style.top = '0';
container.style.right = '0';
container.style.zIndex = '9999';

const shadow = container.attachShadow({ mode: 'open' });

const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = chrome.runtime.getURL('target/content/styles/output.css'); // Get URL for extension resource
shadow.appendChild(style);


const reactHolder = document.createElement('div');
shadow.appendChild(reactHolder);

ReactDOM.render(<TextboxComponent />, reactHolder);
