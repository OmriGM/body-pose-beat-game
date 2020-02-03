import React, { Component } from 'react';
import * as posenet from '@tensorflow-models/posenet';

import logo from './logo.svg';
import './App.css';

const videoSize = {
  width: '550px',
  height: '412px'
}
class App extends Component {

  constructor(props){
    super(props)
    this.stream = null 
    this.videoRef = React.createRef()
    this.canvas = React.createRef() 
    this.ctx = null 
    this.state = {
      videoPos: {
        top: 0,
        left: 0
      }
    }  
  }

  async componentDidMount() {
    await this.setupCamera()
    this.net = await this.loadPoseNet()
    await this.detectPoseInRealTime()
    this.drawCircle()
    setInterval(() => {
      this.drawCircle()
    }, 1500)
  }

  loadPoseNet = async () => posenet.load({
    architecture: 'ResNet50',
    outputStride: 16,
    inputResolution: { width: 550, height: 412 },
    multiplier: 1
  });

  getRandomArbitrary = (min, max) => (Math.random() * (max - min) + min).toFixed()

  setupCamera = async () => {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: videoSize.width,
        height: videoSize.height
      }
    })
    if(this.videoRef) {
      this.videoRef.current.srcObject = this.stream
      this.ctx = this.canvas.current.getContext('2d')
      const { top, left } = !!this.videoRef.current && this.videoRef.current.getBoundingClientRect()

      this.setState({videoPos: { top, left }})
    }
  }

  detectPoseInRealTime = async () => {
    const pose = this.videoRef.current
      && await this.net.estimateSinglePose(
        this.videoRef.current, 
        {
          decodingMethod: 'single-person',
          flipHorizontal: true
        }
      )
    console.log(pose)
  }

  drawCircle = () => {
    const x = this.getRandomArbitrary(10, 540)
    const y = this.getRandomArbitrary(10, 402)
    if(this.ctx) {      
      this.destroyCircle()
      this.ctx.beginPath()
      this.ctx.arc(x, y, this.getRandomArbitrary(5, 20), 0, 2 * Math.PI)  
      const colors = ['blue', 'green', 'lightgreen', 'red', 'cyan', 'yellow']
      const randomIndex = Math.floor(Math.random()*colors.length)
      this.ctx.fillStyle = colors[randomIndex]
      this.ctx.fill();
    }
  }

  destroyCircle = () => {
    this.ctx.clearRect(0, 0, 550, 412)
  }

  render() {
    const { top, left } = this.state.videoPos
    return (
      <div className={'App'}>
        <h1>Best AI Game Ever</h1>
        <video 
          ref={this.videoRef} 
          id={'stream-video'} 
          autoPlay
          style={{width: videoSize.width, height: videoSize.height}}
          className={'stream-video'} 
        >
        </video>
        <canvas ref={this.canvas} style={{left: left, top: top}} height={videoSize.height} width={videoSize.width}></canvas>
      </div>
    )
  }
  
}

export default App;
