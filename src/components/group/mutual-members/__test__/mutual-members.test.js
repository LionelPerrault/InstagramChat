import React from 'react'
import { Provider } from 'react-redux'
import mockStore from '../../../../store/__mocks__/mockStore'
import { BrowserRouter as Router } from 'react-router-dom'
import MutualMembers from '../mutual-members'
import { create } from 'react-test-renderer'
import Group from '../../../../store/__mocks__/reducers/Group'

describe('MutualMembers Component', () => {

  const comp = (
    <Provider store={mockStore}>
      <Router>
        <MutualMembers
          group={34}
        />
      </Router>
    </Provider>
  )

  it('should match snapshot', () => {
    const tree = create(comp).toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('should match snapshot with null when mutualMembers.length == 0', () => {
    Group.mutualMembers = []
    const tree = create(comp).toJSON()
    expect(tree).toMatchSnapshot()
  })

})
