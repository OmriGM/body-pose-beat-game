import React from 'react'
import './Social.scss'


export const Social = ({ icon, url, alt }) => {
  const openUrl = () => window.open(url)

    return (
      <img className={'social'} src={ icon } alt={ alt } onClick={openUrl}/>
    )
}