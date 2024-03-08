import './styles/output.css';

import {TextboxComponent} from './box';
import React from 'react';
import ReactDOM from 'react-dom';

const container = document.createElement('div');
document.body.appendChild(container);
ReactDOM.render(<TextboxComponent />, container);
