import React, { Component } from 'react';
import * as posenet from '@tensorflow-models/posenet';

import logo from './logo.svg';
import './App.css';

const videoSize = {
  width: 550,
  height: 412
}
class App extends Component {

  constructor(props) {
    super(props)
    this.stream = null
    this.videoRef = React.createRef()
    this.canvas = React.createRef()
    this.ctx = null
    this.currentCirclePosition = {
      x: 0,
      y: 0
    }
    this.state = {
      videoPos: {
        top: 0,
        left: 0
      }
    }
  }

  async componentDidMount() {
    await this.setupCamera()
    this.drawCircle()
    this.net = await this.loadPoseNet()
    await this.detectPoseInRealTime()
  }

  loadPoseNet = async () => posenet.load({
    architecture: 'MobileNetV1',
    outputStride: 16,
    inputResolution: { width: 550, height: 412 },
    multiplier: 0.75
  });

  getRandomArbitrary = (min, max) => (Math.random() * (max - min) + min).toFixed()

  setupCamera = async () => {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: videoSize.width,
        height: videoSize.height
      }
    })
    if (this.videoRef) {
      this.videoRef.current.srcObject = this.stream
      this.ctx = this.canvas.current.getContext('2d')
      const { top, left } = !!this.videoRef.current && this.videoRef.current.getBoundingClientRect()

      this.setState({ videoPos: { top, left } })
    }
  }

  detectPoseInRealTime = async () => {
    const { keypoints } = this.videoRef.current
      && await this.net.estimateSinglePose(
        this.videoRef.current,
        {
          decodingMethod: 'single-person',
          flipHorizontal: true
        }
      )
    const wrists = this.getWristsFromKoints(keypoints)
    this.hitTheTarget(wrists)
    requestAnimationFrame(this.detectPoseInRealTime)
  }

  hitTheTarget = wrists => {
    const { x, y } = this.currentCirclePosition
    const isWristHitCircle = wrists.some(({ position }) => {
      return (position.x <= +x + 20 && position.x >= +x - 20)
        && (position.y < +y + 20 && position.y > +y - 20)
    })
    if (isWristHitCircle) {
      this.destroyCircle()
      this.drawCircle()
    }
  }

  getWristsFromKoints = keypoints =>
    keypoints.filter(({ part }) => part === 'leftWrist' || part === 'rightWrist')

  drawCircle = (x, y) => {
    if (!x && !y) {
      x = this.getRandomArbitrary(10, 525)
      y = this.getRandomArbitrary(10, 390)
    }

    if (this.ctx) {
      this.destroyCircle()
      this.ctx.beginPath()
      this.ctx.arc(x, y, this.getRandomArbitrary(15, 20), 0, 2 * Math.PI)
      const colors = ['blue', 'green', 'lightgreen', 'red', 'cyan', 'yellow']
      const randomIndex = Math.floor(Math.random() * colors.length)
      this.ctx.fillStyle = colors[randomIndex]
      this.ctx.fill();
      this.currentCirclePosition.x = x
      this.currentCirclePosition.y = y
    }
  }

  destroyCircle = () => {
    const { x, y } = this.currentCirclePosition
    this.ctx.clearRect(x - 100, y - 100, 200, 200)
  }

  render() {
    const { top, left } = this.state.videoPos
    return (
      <div className={'App'}>
        <h1>Best AI Game Ever</h1>
        <video
          ref={this.videoRef}
          id={'stream-video'}
          playsInline
          autoPlay
          muted
          width={videoSize.width}
          height={videoSize.height}
          className={'stream-video'}
        />
        <canvas
          ref={this.canvas}
          style={{ left: left, top: top }}
          height={videoSize.height}
          width={videoSize.width}
        />
      </div>
    )
  }
}

export default App;
