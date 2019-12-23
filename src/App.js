import React, { Component } from 'react';
import { Player } from 'broadwayjs';
import SimplePeer from 'simple-peer';
import './App.css';

class App extends Component {
  state = {
    data: null,
  }
  hidden = false;
  initiator = window.location.hash === '#1';

  constructor() {
    super();
    this.AvcPlayer = new Player({
      useWorker: true,
      size: {
        width: 640,
        height: 368,
      },
    });
    this.width = 1280;
    this.height = 1024;
    this.AvcPlayer.onPictureDecoded = (_, w, h) => {
      if (w !== this.width || h !== this.height) {
        this.width = w;
        this.height = h;
      }
    }

    this.ws = null;
    this.pktnum = 0;
    this.framesList = [];
    this.running = false;
    this.shiftFrameTimeout = null;

    this.peer = new SimplePeer({ initiator: this.initiator, trickle: false });
    this.p2pBroker = null;
  }

  componentDidMount() {
    document.getElementById('App').appendChild(this.AvcPlayer.canvas);
    this.connect('ws://192.168.1.156:3000/ws');

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // requestAnimationFrame doesn't run when tab isn't active, so clear when tabbed back in
        console.log('clearing frames');
        this.framesList = [];
      }
    });

    this.connectToBroker('ws://192.168.1.215:9000/ws');

    this.peer.on('error', err => console.error('error', err));
    
    this.peer.on('signal', data => {
      console.log('SIGNAL', JSON.stringify(data));
      this.p2pBroker.send(JSON.stringify(data));
    });

    this.peer.on('connect', () => {
      console.log('CONNECT');
      this.peer.send('whatever ' + Math.random());
    });

    this.peer.on('data', data => {
      console.log('data: ' + data);
    });
  }

  connectToBroker = (url) => {
    this.p2pBroker = new WebSocket(`${url}?initiator=${this.initiator}`);
    this.p2pBroker.binaryType = 'arraybuffer';
    this.p2pBroker.onopen = () => {
      console.log(`Connected to broker ${url}`);
    }

    this.p2pBroker.onmessage = (evt) => {
      console.log('received: ', evt.data);
      // if (!this.initiator) {
        this.peer.signal(JSON.parse(evt.data));
        console.log('p2p connection established');
      // }
    }

    this.p2pBroker.onclose = () => {
      console.log('Disconnected from broker');
    }
  }

  shiftFrame = () => {
    if (!this.running)
      return;


    if (this.framesList.length > 30) {
      console.log('Dropping frames', this.framesList.length);
      const vI = this.framesList.findIndex(e => (e[4] & 0x1f) === 7);
      if (vI >= 0) {
        this.framesList = this.framesList.slice(vI);
      }
    }

    const frame = this.framesList.shift();

    if (frame)
      this.AvcPlayer.decode(frame);

    requestAnimationFrame(this.shiftFrame);
  }

  connect (url) {
    // Websocket initialization
    if (this.ws) {
      this.ws.close();
      delete this.ws;
    }
    this.ws = new WebSocket(url)
    this.ws.binaryType = 'arraybuffer'

    this.ws.onopen = () => {
      console.log('Connected to ' + url);
    }

    this.framesList = []

    this.ws.onmessage = (evt) => {
      this.pktnum++;
      const frame = new Uint8Array(evt.data);
      this.framesList.push(frame);
      if (!this.running) {
        this.running = true;
        clearTimeout(this.shiftFrameTimeout);
        this.shiftFrameTimeout = null;
        this.shiftFrameTimeout = setTimeout(this.shiftFrame, 1);
      }
    }

    this.ws.onclose = () => {
      this.running = false;
      console.log('WebSocket Connection closed');
    }
    return this.ws;
  }

  render() {
    return (
      <div className="App" id="App">
        
      </div>
    );
  }
}

export default App;
