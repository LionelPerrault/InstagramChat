import React, { Component, Fragment } from 'react'
import BannerOptions from './options'
import MaterialIcon from '../../../others/icons/material-icon'

export default class BannerTopOptions extends Component {

  state = {
    showOptions: false
  }

  toggleOptions = () =>
    this.setState({ showOptions: !this.state.showOptions })

  render() {
    let { showOptions } = this.state

    return (
      <Fragment>
        <div className='pro_more'>
          <span
            className='pro_more_horiz'
            onClick={this.toggleOptions}
            data-tip='Options'
          >
            <MaterialIcon icon='more_horiz' />
          </span>
        </div>
        {
          showOptions &&
            <div className='options pro_banner_options' >
              <BannerOptions
                toggleOptions={this.toggleOptions}
              />
            </div>
        }
      </Fragment>
    )
  }
}
