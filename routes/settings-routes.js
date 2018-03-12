// ALL SETTINGS-RELATED ROUTES ARE HANDLED BY THIS FILE

const
  app = require('express').Router(),
  db = require('../config/db')

// BLOCK USER
app.post('/block', async (req, res) => {
  let
    { user } = req.body,
    { id } = req.session,
    username = await db.getWhat('username', user),
    isBlocked = await db.isBlocked(id, user),
    blocked = {
      block_by: id,
      user,
      block_time: new Date().getTime()
    }

  if(!isBlocked) {
    await db.query('INSERT INTO blocks SET ?', blocked)
    await db.query('DELETE FROM follow_system WHERE follow_by=? AND follow_to=?', [ user, id ])
    await db.query('DELETE FROM follow_system WHERE follow_by=? AND follow_to=?', [ id, user ])
    res.json({ mssg: `Blocked ${username}!!` })
  } else {
    res.json({ mssg: `Already blocked ${username}!!` })
  }

})

// UNBLOCK USER
app.post('/unblock-user', async (req, res) => {
  let { block_id } = req.body
  await db.query('DELETE FROM blocks WHERE block_id=?', [ block_id ])
  res.json('Hello, World!!')
})

// GET BLOCKED USERS
app.post('/get-blocked-users', async (req, res) => {
  let
    { id } = req.session,
    _blockedUsers = await db.query(
      'SELECT blocks.block_id, blocks.user, users.username, users.firstname, users.surname, blocks.block_time FROM blocks, users WHERE blocks.block_by = ? AND blocks.user = users.id ORDER BY blocks.block_time DESC',
      [ id ]
    ),
    blockedUsers = []

  for (let b of _blockedUsers) {
    let mutualFollowers = await db.mutualUsers(id, b.user)
    blockedUsers.push({ ...b, mutualFollowersCount: mutualFollowers.length })
  }

  res.json(blockedUsers)
})

module.exports = app
