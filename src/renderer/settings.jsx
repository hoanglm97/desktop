// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// Copyright (c) 2015-2016 Yuya Ochiai

import {ipcRenderer} from 'electron';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'renderer/css/index.css';
import 'renderer/css/settings.css';

if (process.env.NODE_ENV === 'production') {
    window.eval = global.eval = () => { // eslint-disable-line no-multi-assign, no-eval
        throw new Error('Sorry, Mattermost does not support window.eval() for security reasons.');
    };
} else if (module.hot) {
    module.hot.accept();
}

import React from 'react';
import ReactDOM from 'react-dom';

import SettingsPage from './components/SettingsPage.jsx';

function openMenu() {
    if (process.platform !== 'darwin') {
        ipcRenderer.send('open-app-menu');
    }
}

const start = async () => {
    ReactDOM.render(
        <SettingsPage
            openMenu={openMenu}
        />,
        document.getElementById('app'),
    );
};

// Deny drag&drop navigation in mainWindow.
document.addEventListener('dragover', (event) => event.preventDefault());
document.addEventListener('drop', (event) => event.preventDefault());

start();
