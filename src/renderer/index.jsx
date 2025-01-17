// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// Copyright (c) 2015-2016 Yuya Ochiai

import 'bootstrap/dist/css/bootstrap.min.css';
import 'renderer/css/index.css';

if (process.env.NODE_ENV === 'production') {
    window.eval = global.eval = () => { // eslint-disable-line no-multi-assign, no-eval
        throw new Error('Sorry, Mattermost does not support window.eval() for security reasons.');
    };
} else if (module.hot) {
    module.hot.accept();
}

import React from 'react';
import ReactDOM from 'react-dom';
import {ipcRenderer} from 'electron';

import {GET_CONFIGURATION, UPDATE_TEAMS, QUIT, RELOAD_CONFIGURATION} from 'common/communication';

import MainPage from './components/MainPage.jsx';
class Root extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {};
    }

    async componentDidMount() {
        await this.setInitialConfig();

        ipcRenderer.on('synchronize-config', () => {
            this.reloadConfig();
        });

        ipcRenderer.on(RELOAD_CONFIGURATION, () => {
            this.reloadConfig();
        });

        // Deny drag&drop navigation in mainWindow.
        // Drag&drop is allowed in webview of index.html.
        document.addEventListener('dragover', (event) => event.preventDefault());
        document.addEventListener('drop', (event) => event.preventDefault());
    }

    setInitialConfig = async () => {
        const config = await this.requestConfig(true);
        this.setState({config});
    }

    moveTabs = async (originalOrder, newOrder) => {
        const teams = this.state.config.teams.concat();
        const tabOrder = teams.map((team, index) => {
            return {
                index,
                order: team.order,
            };
        }).sort((a, b) => (a.order - b.order));

        const team = tabOrder.splice(originalOrder, 1);
        tabOrder.splice(newOrder, 0, team[0]);

        let teamIndex;
        tabOrder.forEach((t, order) => {
            if (order === newOrder) {
                teamIndex = t.index;
            }
            teams[t.index].order = order;
        });
        await this.teamConfigChange(teams);
        return teamIndex;
    };

    teamConfigChange = async (updatedTeams, callback) => {
        const updatedConfig = await ipcRenderer.invoke(UPDATE_TEAMS, updatedTeams);
        await this.reloadConfig();
        if (callback) {
            callback(updatedConfig);
        }
    };

    reloadConfig = async () => {
        const config = await this.requestConfig();
        this.setState({config});
    };

    requestConfig = async (exitOnError) => {
        // todo: should we block?
        try {
            const configRequest = await ipcRenderer.invoke(GET_CONFIGURATION);
            return configRequest;
        } catch (err) {
            console.log(`there was an error with the config: ${err}`);
            if (exitOnError) {
                ipcRenderer.send(QUIT, `unable to load configuration: ${err}`, err.stack);
            }
        }
        return null;
    };

    openMenu = () => {
        if (process.platform !== 'darwin') {
            ipcRenderer.send('open-app-menu');
        }
    }

    render() {
        const {config} = this.state;
        if (!config) {
            return null;
        }

        return (
            <MainPage
                teams={config.teams}
                showAddServerButton={config.enableServerManagement}
                moveTabs={this.moveTabs}
                openMenu={this.openMenu}
                darkMode={config.darkMode}
                appName={config.appName}
            />
        );
    }
}
ipcRenderer.invoke('get-app-version').then(({name, version}) => {
    // eslint-disable-next-line no-undef
    console.log(`Starting ${name} v${version} commit: ${__HASH_VERSION__}`);
});

ReactDOM.render(
    <Root/>,
    document.getElementById('app'),
);
