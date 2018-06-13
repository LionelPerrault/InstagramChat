export default {
  onlineUsers: [
    {
      user: 16,
      username: 'zayn',
      firstname: 'Zayn',
      surname: 'Malik',
      mutualUsersCount: 0
    },
    {
      user: 7,
      username: 'ghalib',
      firstname: 'Mirza',
      surname: 'Ghalib',
      mutualUsersCount: 1
    }
  ],
  conversations: [
    {
      con_id: 24,
      con_with: 7,
      con_with_username: 'ghalib',
      con_with_firstname: 'Mirza',
      con_with_surname: 'Ghalib',
      unreadMssgs: 0,
      lastMssg: {
        lastMssgTime: '1480114098767',
        lastMessage: 'eo',
        lastMssgType: 'text',
        lastMssgBy: 7
      }
    },
    {
      con_id: 40,
      con_with: 10,
      con_with_username: 'noddy',
      con_with_firstname: 'your',
      con_with_surname: 'noddy',
      unreadMssgs: 0,
      lastMssg: {
        lastMssgTime: null,
        lastMessage: '',
        lastMssgType: '',
        lastMssgBy: ''
      }
    }
  ],
  conDetails: {
    con_id: 29,
    con_with: 28,
    con_with_username: 'selena',
    con_with_firstname: 'selena',
    con_with_surname: 'gomez',
    isOnline: false,
    lastOnline: '1480114098767'
  },
  conAbout: {
    mssgsCount: 6,
    media: [
      {
        imgSrc: 'instagram_message_1528278864884.jpg',
        mssg_by: 24,
        mssg_by_username: 'takkar'
      }
    ],
    con_time: '1480114098767',
    mutualFollowersCount: 1
  },
  messages: [
    {
      message_id: 93,
      con_id: 29,
      mssg_by: 28,
      mssg_to: 24,
      message: 'instagram_message_1525091176544.jpg',
      type: 'sticker',
      status: 'read',
      message_time: '1480114098767'
    },
    {
      message_id: 94,
      con_id: 29,
      mssg_by: 24,
      mssg_to: 28,
      message: 'kjkjk',
      type: 'text',
      status: 'unread',
      message_time: '1480114098767'
    },
    {
      message_id: 99,
      con_id: 29,
      mssg_by: 24,
      mssg_to: 28,
      message: 'instagram_message_1525809886884.jpg',
      type: 'sticker',
      status: 'unread',
      message_time: '1480114098767'
    },
    {
      message_id: 102,
      con_id: 29,
      mssg_by: 24,
      mssg_to: 28,
      message: 'instagram_message_1528278864884.jpg',
      type: 'image',
      status: 'unread',
      message_time: '1480114098767'
    }
  ],
  unreadMessages: 0
}
