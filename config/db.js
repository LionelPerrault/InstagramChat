const
  db = require('./mysql'),
  bcrypt = require('bcrypt-nodejs'),
  { intersectionBy } = require('lodash'),
  { unlink, rmdir } = require('fs'),
  { promisify } = require('util'),
  root = process.cwd(),
  { DeleteAllOfFolder } = require('handy-image-processor')

// FUNCTION TO QUERY MYSQL AND RETURN IT AS A PROMISE
const query = (q, data) => {
  return new Promise((resolve, reject) => {
    db.query(q, data, (err, res) => {
      err ? reject(err) : resolve(res)
    })
  })
}

// COMMON VALIDATOR
const c_validator = (field, req) => {
  let i = field.charAt(0).toUpperCase() + field.substr(1)
  req.checkBody(field, `${i} is empty!!`).notEmpty()
  req.checkBody(field, `${i} must be greater than 4`).isLength({ min: 4 })
  req.checkBody(field, `${i} must be less than 32`).isLength({ max: 32 })
}

// CREATES A NEW USER
const create_user = user => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(user.password, null, null, (error, hash) => {
      user.password = hash
      query('INSERT INTO users SET ?', user)
        .then(s => resolve(s))
        .catch(e => reject(e))
    })
  })
}

// CHANGES PASSWORD
const change_password = async ({ password, id }) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, null, null, (error, hash) => {
      query('UPDATE users SET password=? WHERE id=?', [ hash, id ])
        .then(() => resolve(true))
        .catch(() => reject(false))
    })
  })
}

// COMPARES PASSWORD
const comparePassword = (password, hash) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, res) => {
      err ? reject(err) : resolve(res)
    })
  })
}

// FUNCTION TO GET ID FROM USERNAME
const getId = username => {
  return new Promise((resolve, reject) => {
    query('SELECT id FROM users WHERE username=? LIMIT 1', [username])
      .then(s => resolve(s[0].id))
      .catch(e => reject(e))
  })
}

// RETURNS [WHAT] OF ID
const getWhat = (what, id) => {
  return new Promise((resolve, reject) => {
    query(`SELECT ${what} FROM users WHERE id=? LIMIT 1`, [ id ])
      .then(s => resolve(s[0][what]))
      .catch(e => reject(e))
  })
}

// FUNCTION TO RETURN WHETHER I AM FOLLOWING USER
const isFollowing = (session, user) => {
  return new Promise((resolve, reject) => {
    query('SELECT COUNT(follow_id) AS is_following FROM follow_system WHERE follow_by=? AND follow_to=? LIMIT 1', [session, user])
      .then(is => resolve((is[0].is_following == 1) ? true : false))
      .catch(e => reject(e))
  })
}

// FUNCTION TO RETURN WHETHER I LIKED THE POST
const likedOrNot = (user, post) => {
  return new Promise((resolve, reject) => {
    query('SELECT COUNT(like_id) AS l FROM likes WHERE like_by=? AND post_id=?', [ user, post ])
      .then(s => resolve(s[0].l == 1 ? true : false) )
      .catch(e => reject(e))
  })
}

// FUNCTION TO RETURN WHETHER I LIKED THE POST
const bookmarkedOrNot = (user, post) => {
  return new Promise((resolve, reject) => {
    query('SELECT COUNT(bkmrk_id) AS b FROM bookmarks WHERE bkmrk_by=? AND post_id=?', [ user, post ])
      .then(s => resolve(s[0].b == 1 ? true : false) )
      .catch(e => reject(e))
  })
}

// FUNCTION TO RETURN WHETHER I'M THE OWNER OF A GIVEN POST
const isPostMine = (session, post) => {
  return new Promise((resolve, reject) => {
    query('SELECT user FROM posts WHERE post_id=?', [ post ])
      .then(s => resolve(s[0].user == session ? true : false))
      .catch(e => reject(e))
  })
}

// FUNCTION TO RETURN WHETHER I SHARED POST TO A USER
const didIShare = (post, session, user) => {
  return new Promise((resolve, reject) => {
    query(
      'SELECT COUNT(share_id) AS post_share FROM shares WHERE share_by=? AND share_to=? AND post_id=?',
      [ session, user, post ]
    )
      .then(s => resolve(s[0].post_share == 1 ? true : false))
      .catch(e => reject(e))
  })
}

// RETURNS WHEN USER IS MY FAVOURITE OR NOT
const favouriteOrNot = (fav_by, user) => {
  return new Promise((resolve, reject) => {
    query('SELECT COUNT(fav_id) AS fav_count FROM favourites WHERE fav_by=? AND user=?', [ fav_by, user ])
      .then(s => resolve(s[0].fav_count == 1 ? true : false))
      .catch(e => reject(e))
  })
}

// RETURNS WHEN USER IS BLOCKED OR NOT
const isBlocked = (block_by, user) => {
  return new Promise((resolve, reject) => {
    query('SELECT COUNT(block_id) AS block_count FROM blocks WHERE block_by=? AND user=?', [ block_by, user ])
      .then(s => resolve(s[0].block_count == 1 ? true : false))
      .catch(e => reject(e))
  })
}

// RETURNS TAGS COUNT, LIKES COUNT, ...
const getCounts = async (post_id, group_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let
        [{ tags_count }] = await query('SELECT COUNT(post_tag_id) AS tags_count FROM post_tags WHERE post_id=?', [post_id]),
        [{ likes_count }] = await query('SELECT COUNT(like_id) AS likes_count FROM likes WHERE post_id=?', [ post_id ]),
        [{ shares_count }] = await query('SELECT COUNT(share_id) AS shares_count FROM shares WHERE post_id=?', [ post_id ]),
        [{ comments_count }] = await query('SELECT COUNT(comment_id) AS comments_count FROM comments WHERE post_id=?', [ post_id ]),
        gn = await query('SELECT name FROM groups WHERE group_id=?', [group_id])

      resolve({
        tags_count,
        likes_count,
        shares_count,
        comments_count,
        group_name: group_id != 0 && group_id != null ? gn[0].name : ''
      })

    } catch (error) {
      reject(error)
    }

  })
}

// DELETES POST
const deletePost = async ({post, when}) => {
  await query('DELETE FROM likes WHERE post_id=?', [ post ])
  await query('DELETE FROM post_tags WHERE post_id=?', [ post ])
  await query('DELETE FROM shares WHERE post_id=?', [ post ])
  await query('DELETE FROM bookmarks WHERE post_id=?', [ post ])
  await query('DELETE FROM notifications WHERE post_id=?', [ post ])
  await query('DELETE FROM hashtags WHERE post_id=?', [ post ])

  let
    [{ imgSrc }] = await query('SELECT imgSrc FROM posts WHERE post_id=?', [ post ]),
    comments = await query('SELECT commentSrc, type FROM comments WHERE post_id=?', [ post ]),
    deleteFile = promisify(unlink)

  await deleteFile(`${root}/public/posts/${imgSrc}`)

  comments.map(async c => {
    if (c.type != 'text') {
      await deleteFile(`${root}/public/comments/${c.commentSrc}`)
    }
  })
  await query('DELETE FROM comments WHERE post_id=?', [ post ])

  if (when == 'user') {
    await query('DELETE FROM posts WHERE post_id=?', [ post ])
  } else {
    await query('DELETE FROM posts WHERE post_id=?', [ post ])
  }

}

// DELETES GROUP
const deleteGroup = async group => {
  let
    posts = await query('SELECT post_id FROM posts WHERE group_id=?', [ group ]),
    dltDir = promisify(rmdir)

  for (let p of posts) {
    await deletePost({ post: p.post_id, when: 'group' })
  }

  await query('DELETE FROM notifications WHERE group_id=?', [ group ])
  await query('DELETE FROM group_members WHERE group_id=?', [ group ])
  await query('DELETE FROM groups WHERE group_id=?', [ group ])

  await DeleteAllOfFolder(`${root}/public/groups/${group}/`)
  await dltDir(`${root}/public/groups/${group}`)
}

// DELETES CONVERSATION
const deleteCon = async con_id => {
  let
    messages = await query('SELECT message, type FROM messages WHERE con_id=?', [ con_id ]),
    deleteMessageFile = promisify(unlink)

  for (let m of messages) {
    if (m.type != 'text') {
      await deleteMessageFile(`${root}/public/messages/${m.message}`)
    }
  }

  await query('DELETE FROM messages WHERE con_id=?', [ con_id ])
  await query('DELETE FROM conversations WHERE con_id=?', [ con_id ])
}

// DEACTIVATES USER
const deactivate = async (user, req, res) => {
  let
    posts = await query('SELECT post_id FROM posts WHERE user=?', [ user ]),
    groups = await query('SELECT group_id FROM groups WHERE admin=?', [ user ]),
    cons = await query('SELECT con_id FROM conversations WHERE user_one=? OR user_two=?', [ user, user ]),
    dltDir = promisify(rmdir),
    QLusers = JSON.parse(req.cookies.users),
    filtered = QLusers.filter(u => u.id != user )

  // DELETE ALL POSTS
  posts.map(async p => {
    await deletePost({
      post: p.post_id,
      user,
      when: 'user'
    })
  })

  // DELETE ALL GROUPS
  groups.map(async g => {
    await deleteGroup(g.group_id)
  })
  await query('DELETE FROM group_members WHERE member=? OR added_by=?', [ user, user ])

  // DELETE ALL CONVERSATIONS
  cons.map(async c => {
    await deleteCon(c.con_id)
  })

  await query('DELETE FROM tags WHERE user=?', [ user ])
  await query('DELETE FROM favourites WHERE fav_by=? OR user=?', [ user, user ])
  await query('DELETE FROM follow_system WHERE follow_by=? OR follow_to=?', [ user, user ])
  await query('DELETE FROM notifications WHERE notify_by=? OR notify_to=? OR user=?', [ user, user, user ])
  await query('DELETE FROM profile_views WHERE view_by=? OR view_to=?', [ user, user ])
  await query(
    'DELETE FROM recommendations WHERE recommend_by=? OR recommend_to=? OR recommend_of=?',
    [ user, user, user ]
  )
  await query('DELETE FROM hashtags WHERE user=?', [ user ])

  await DeleteAllOfFolder(`${root}/public/users/${user}/`)
  await dltDir(`${root}/public/users/${user}`)

  await query('DELETE FROM users WHERE id=?', [ user ])

  res.cookie('users', `${JSON.stringify(filtered)}`)
  req.session.reset()
}

// RETURNS MUTUAL USERS
const mutualUsers = async (session, user) => {
  return new Promise(async (resolve, reject) => {
    try {
      let
        myFollowings = await query(
          'SELECT follow_system.follow_id, follow_system.follow_to AS user, follow_system.follow_to_username AS username, users.firstname, users.surname FROM follow_system, users WHERE follow_system.follow_by=? AND follow_system.follow_to = users.id',
          [ session ]
        ),
        userFollowers = await query(
          'SELECT follow_system.follow_id, follow_system.follow_by AS user, follow_system.follow_by_username AS username, users.firstname, users.surname FROM follow_system, users WHERE follow_system.follow_to=? AND follow_system.follow_by = users.id',
          [ user ]
        ),
        mutuals = intersectionBy(myFollowings, userFollowers, 'user')

      resolve(mutuals)

    } catch (error) {
      reject(error)
    }

  })
}

// FUNCTION TO RETURN WHETHER I AM FOLLOWING USER
const joinedGroup = (user, group) => {
  return new Promise((resolve, reject) => {
    query('SELECT COUNT(grp_member_id) AS joined FROM group_members WHERE member=? AND group_id=? LIMIT 1', [user, group])
      .then(is => resolve((is[0].joined == 1) ? true : false))
      .catch(e => reject(e))
  })
}

// RETURNS MUTUAL USERS
const mutualGroupMembers = async (user, group) => {
  return new Promise(async (resolve, reject) => {
    try {
      let
        myFollowings = await query(
          'SELECT follow_system.follow_to AS user, follow_system.follow_to_username AS username FROM follow_system WHERE follow_system.follow_by=?',
          [ user ]
        ),
        grpMembers = await query(
          'SELECT group_members.member AS user, users.username AS username FROM group_members, users WHERE group_id = ? AND group_members.member = users.id ORDER BY group_members.joined_group DESC',
          [ group ]
        ),
        mutuals = intersectionBy(myFollowings, grpMembers, 'user')

      resolve(mutuals)

    } catch (error) {
      reject(error)
    }

  })
}

// GET LAST MESSAGE TIME
const getLastMssgTime = con_id => {
  return new Promise((resolve, reject) => {
    query(
      'SELECT MAX(message_time) AS ti FROM messages WHERE con_id = ?',
      [ con_id ]
    )
      .then(s => resolve(s[0].ti))
      .catch(e => reject(e))
  })
}

// GET LAST MESSAGE
const getLastMssg = con_id => {
  return new Promise((resolve, reject) => {
    query(
      'SELECT MAX(message_id) AS last FROM messages WHERE con_id = ?',
      [ con_id ]
    )
      .then(s => {
        let [{ last }] = s

        query('SELECT message, type, mssg_by FROM messages WHERE message_id=?', [ last ])
          .then(l => resolve(l[0]))
          .catch(e => reject(e))

      })
      .catch(e => reject(e))

  })
}

// GET AND INSERT HASHTAGS
const toHashtag = async (str, user, post) => {
  let hashtags = str.match(/[^|\s]?#[\d\w]+/g)

  if (hashtags) {
    for (let h of hashtags) {
      let hash = h.slice(1)
      if (hash.substr(0, 1) !== '#') {
        let newHashtag = {
          hashtag: hash,
          post_id: post,
          user: user,
          hashtag_time: new Date().getTime()
        }
        await query('INSERT INTO hashtags SET ?', newHashtag)
      }
    }
  }

}

// MENTION USERS
const mentionUsers = async (str, session, post, when) => {
  let users = str.match(/[^|\s]?@[\d\w]+/g)

  if (users) {
    for (let h of users) {
      let hash = h.slice(1)
      if (hash.substr(0, 1) !== '@') {
        let [{ userCount }] = await query('SELECT COUNT(id) AS userCount FROM users WHERE username=?', [ hash ])

        if (userCount == 1) {
          let
            id = await getId(hash),
            notify = {
              notify_by: session,
              notify_to: id,
              post_id: post,
              type: when == 'post' ? 'mention_post' : 'mention_comment',
              notify_time: new Date().getTime(),
            }

          if (id != session) {
            await query('INSERT INTO notifications SET ?', notify)
          }
        }

      }
    }
  }

}

module.exports = {
  query,
  c_validator,
  create_user,
  change_password,
  comparePassword,
  getId,
  getWhat,
  isFollowing,
  likedOrNot,
  bookmarkedOrNot,
  isPostMine,
  didIShare,
  favouriteOrNot,
  isBlocked,
  getCounts,
  deletePost,
  deleteGroup,
  deleteCon,
  deactivate,
  mutualUsers,
  joinedGroup,
  mutualGroupMembers,
  getLastMssgTime,
  getLastMssg,
  toHashtag,
  mentionUsers,
}
