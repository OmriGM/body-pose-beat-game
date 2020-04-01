import React, { Component } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import { Social } from './components/Social/Social'
import LinkedinIcon from './assets/icons/linkedin.png'
import GithubIcon from './assets/icons/github.png'

import './App.scss';

const videoSize = {
  width: 550,
  height: 412
}

const wrists = [
  {
    key: 'rightWrist',
    label: 'Right Wrist',
    color: 'blue'
  },
  {
    key: 'leftWrist',
    label: 'Left Wrist',
    color: 'red'
  }
]
const socialMedias = [
  {
    url: 'https://github.com/OmriGM',
    alt: 'github',
    icon: GithubIcon
  },
  {
    url: 'https://il.linkedin.com/in/omri-grossman-58384511b',
    alt: 'linkedin',
    icon: LinkedinIcon
  }
]
//TODO:
// 1. Add difficulty, the dots will be smaller or bigger
// 2. Split to components
// 3. add social media such as Github and Linkedin - V
// 4. Consider Adding time for each game (e.g you got one minute to destroy as mush dots as you can

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
      score: 0,
      currentWrist: wrists[0],
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
    const wrists = this.getWristsFromJoints(keypoints)
    // this.colorWrists(wrists) //TODO: uncomment if you want to color wrists
    this.hitTheTarget(wrists)
    requestAnimationFrame(this.detectPoseInRealTime)
  }

  colorWrists = wrists => {
    wrists.map(({position, part}) => {
      this.drawWrist(position.x, position.y, wrists.find(({key}) => key === part))
    })
  }

  drawWrist = (x, y, wristType) => {
    if (this.ctx) {
      this.ctx.clearRect(x - 10, y - 10, 10, 10)
      this.ctx.beginPath()
      this.ctx.arc(x, y, 5, 0, 2 * Math.PI)
      this.ctx.fillStyle = wristType.color
      this.ctx.fill();
    }
  }

  hitTheTarget = wrists => {
    const { x, y } = this.currentCirclePosition
    const isWristHitCircle = wrists.some(wrist => {
      const { position, part } = wrist

      return part === this.state.currentWrist.key
        && (position.x <= +x + 20 && position.x >= +x - 20)
        && (position.y < +y + 20 && position.y > +y - 20)
    })
    if (isWristHitCircle) {
      this.updateScore()
      this.destroyCircle()
      this.setRandomWrist()
      this.drawCircle()
    }
  }

  updateScore = () => {
    this.setState(() => {
      this.state.score = this.state.score + 1
    })
  }

  setRandomWrist = () => {
    const randomIndex = this.getRandomArbitrary(0, wrists.length - 1)
    this.setState({ currentWrist: wrists[randomIndex] })
  }

  getWristsFromJoints = keypoints =>
    keypoints.filter(({ part }) => part === 'leftWrist' || part === 'rightWrist')

  drawCircle = () => {
    const x = this.state.currentWrist.key === 'rightWrist'
    ? this.getRandomArbitrary(490/2, 490)
    : this.getRandomArbitrary(20, 490/2)
    const y = this.getRandomArbitrary(20, 340)

    if (this.ctx) {
      this.destroyCircle()
      this.ctx.beginPath()
      this.ctx.arc(x, y, 20, 0, 2 * Math.PI)
      this.ctx.fillStyle = this.state.currentWrist.color
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
    const { videoPos, currentWrist } = this.state
    const { top, left } = videoPos
    const { label, color } = currentWrist

    return (
      <div className={'App'}>
        <div className={'title'}>
          <h1>Touch the Dot</h1>
          <div className={'social-media-container'}>
            { socialMedias.map(({ alt, url, icon }) =>
              <Social key={alt} alt={alt} icon={icon} url={url} /> )
            }
          </div>
        </div>
        <div className={'subtitle'}>
          <h2>Hit With Your {label}! </h2>
          <span style={{ backgroundColor: color }}/>
        </div>
        <h3 className={'score-cotainer'}>
          Your Score: <span className={'score'}> { this.state.score } </span>
        </h3>
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
