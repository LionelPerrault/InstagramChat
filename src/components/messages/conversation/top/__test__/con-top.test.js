import React from 'react'
import { create } from 'react-test-renderer'
import ConversationTop from '../con-top'
import { Provider } from 'react-redux'
import mockStore from '../../../../../store/mockStore/mockStore'
import { BrowserRouter as Router } from 'react-router-dom'
import { shallow } from 'enzyme'

describe('ConversationTop Component', () => {
  const mockFn = jest.fn()

  it('should match snapshot', () => {
    const tree = create(
      <Provider store={mockStore}>
        <Router>
          <ConversationTop
            hideConversation={mockFn}
          />
        </Router>
      </Provider>
    ).toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('should match snapshot and show <ConversationOptions/> when clicked on the expand icon', () => {
    const wrapper = shallow(
      <ConversationTop
        hideConversation={mockFn}
      />
    )
    wrapper.find('.m_m_exp').simulate('click')
    expect(wrapper.find('ConversationOptions').exists()).toBe(true)
  })

})
