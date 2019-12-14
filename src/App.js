import React, { Component } from 'react';
import WSAvcPlayer from 'ws-avc-player';
import Peer from 'peerjs';
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
    });

    const peer = new Peer();
    peer.on('open', (id) => {
      console.log(id);
    })

    const conn = peer.connect('1');
    conn.on('open', () => {
      conn.send('hi');
    });

    peer.on('connection', (conn) => {
      conn.on('data', (data) => {
        console.log(data);
      })
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
