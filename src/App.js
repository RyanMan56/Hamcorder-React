import React, { Component } from 'react';
import WSAvcPlayer from 'ws-avc-player';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  state = {
    data: null,
  }
  wsavc = new WSAvcPlayer({ useWorker: true });

  componentDidMount() {
    document.getElementById('App').appendChild(this.wsavc.AvcPlayer.canvas);    
    this.wsavc.connect('ws://192.168.1.156:3000/ws');

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('disconnecting websocket connection');
        this.wsavc.disconnect();
      } else {
        this.wsavc.connect('ws://192.168.1.156:3000/ws');
        console.log('reconnecting websocket connection');
      }
    })
  }

  render() {
    return (
      <div className="App" id="App">
        
      </div>
    );
  }
}

export default App;
