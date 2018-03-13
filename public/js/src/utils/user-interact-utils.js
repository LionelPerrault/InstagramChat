import $ from 'jquery'
import { post } from 'axios'
import Notify from 'handy-notification'
import * as follow_action from '../store/actions/follow_a'
import { leftGroup } from '../store/actions/group-a'
import { insta_notify } from './utils'

/**
 * Follow user
 *
 * user, username & done properties must be provided.
 *
 * @param {Object} options Options for following user
 * @param {Number} options.user
 * @param {String} options.username
 * @param {firstname} options.firstname
 * @param {surname} options.surname
 * @param {Boolean} options.update_followers
 * @param {Boolean} options.update_followings
 * @param {Function} options.dispatch
 * @param {Function} options.done
 */
export const follow = async options => {
  let
    defaults = {
      user: null,                 // USER TO FOLLOW [MUST]
      username: null,             // USER'S USERNAME, ONlY FOR NOTIFYING [MUST]
      firstname: null,            // WHEN UPDATE_FOLLOWINGS=TRUE
      surname: null,              // WHEN UPDATE_FOLLOWINGS=TRUE
      update_followers: false,    // PROVIDE WHEN FOLLOWERS DATA NEEDS TO BE UDATED. EG. FOLLOW ACTION ON BANNER COMPONENT
      update_followings: false,   // PROVIDE WHEN FOLLOWINGS DATA NEEDS TO BE UDATED. EG. FOLLOWERS/FOLLOWINGS COMPONENT'S FOLLOW ACTION
      dispatch: () => { return }, // PROVIDE WHEN [UPDATE_FOLLOWERS/UPDATE_FOLLOWINGS]=TRUE
      done: () => { return }      // FN TO BE EXECUTED WHEN USER IS FOLLOWED [MUST]
    },
    obj = { ...defaults, ...options },
    {
      user,
      username,
      firstname,
      surname,
      dispatch,
      update_followers,
      update_followings,
      done
    } = obj,
    { data: { mssg, success, ff } } = await post('/api/follow', { user, username })

  if (success) {
    let fwing = {
      follow_id: ff.follow_id,
      follow_to: user,
      follow_by: $('.data').data('session'),
      username,
      firstname,
      surname,
      isFollowing: true,
      follow_time: ff.follow_time
    }
    update_followers ? dispatch(follow_action.Follower(ff)) : null
    update_followings ? dispatch(follow_action.Following(fwing)) : null

    insta_notify({
      to: user,
      type: 'follow'
    })

    done()
  }

  Notify({ value: mssg })

}

/**
 * Unfollow user
 *
 * user & done properties must be provided.
 *
 * @param {Object} options Options for unfollowing user
 * @param {Number} options.user
 * @param {Boolean} options.update_followers
 * @param {Boolean} options.update_followings
 * @param {Function} options.dispatch
 * @param {Function} options.done
 */
export const unfollow = async options => {
  let
    defaults = {
      user: null,                 // USER TO UNFOLLOW [MUST]
      update_followers: false,    // PROVIDE WHEN FOLLOWERS DATA NEEDS TO BE UDATED. EG. FOLLOW ACTION ON BANNER COMPONENT
      update_followings: false,   // PROVIDE WHEN FOLLOWINGS DATA NEEDS TO BE UDATED. EG. FOLLOWERS/FOLLOWINGS COMPONENT'S FOLLOW ACTION
      dispatch: () => { return },   // PROVIDE WHEN [UPDATE_FOLLOWERS/UPDATE_FOLLOWINGS]=TRUE
      done: () => { return }      // FN TO BE EXECUTED WHEN USER IS UNFOLLOWED [MUST]
    },
    obj = { ...defaults, ...options },
    {
      user,
      dispatch,
      update_followers,
      update_followings,
      done
    } = obj,
    session = $('.data').data('session')

  await post('/api/unfollow', { user })

  update_followers ? dispatch(follow_action.Unfollower(session)) : null
  update_followings ? dispatch(follow_action.Unfollowing(user)) : null

  Notify({ value: 'Unfollowed!!' })
  done()

}

/**
 * Add user to favorites
 * @param {Number} user User to add to favorites
 */
export const addToFavourites = async user => {
  let { data: { mssg } } = await post('/api/add-to-favourites', { user })
  insta_notify({
    to: user,
    type: 'favourites'
  })
  Notify({ value: mssg })
}

/**
 * Block user
 * @param {Number} user User to block
 */
export const block = async user => {
  let { data: { mssg } } = await post('/api/block', { user })
  Notify({ value: mssg })
}

/**
 * Join group
 *
 * user, group, when & done properties must be provided
 * @param {Object} options Options for joining group
 * @param {Number} options.user
 * @param {Number} options.added_by
 * @param {Number} options.group
 * @param {String} options.when
 * @param {Function} options.done
 */
export const joinGroup = async options => {
  let
    defaults = {
      user: null,
      added_by: null,
      group: null,
      when: '',
      done: () => { return }
    },
    obj = { ...defaults, ...options },
    { user, added_by, group, when, done } = obj,
    { data: { mssg, success } } = await post('/api/join-group', { user, added_by, group, when })

  if (success) {
    if (when == 'add_grp_member') {
      insta_notify({
        to: user,
        type: 'add_grp_member',
        group_id: group
      })
    }

    done()
  }

  Notify({ value: mssg })
}

/**
 * Leave group
 *
 * user, group & done properties must be provided
 * @param {Object} options Options for leaving group
 * @param {Number} options.user
 * @param {Number} options.group
 * @param {Boolean} options.updateGroups
 * @param {Function} options.dispatch
 * @param {Function} options.done
 */
export const leaveGroup = async options => {
  let
    defaults = {
      user: null,
      group: null,
      updateGroups: false,
      dispatch: () => { return },
      done: () => { return }
    },
    obj = { ...defaults, ...options },
    { user, group, updateGroups, dispatch, done } = obj,
    { data: { mssg } } = await post('/api/leave-group', { user, group })

  updateGroups ? dispatch(leftGroup(group)) : null

  done()
  Notify({ value: mssg })

}
