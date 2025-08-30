const mongoose = require('mongoose')

module.exports = [
  {
    _id: new mongoose.Types.ObjectId('67707eba29571f4e14a66acf'),
   
    fullName: 'Super admin',
    email: 'super@admin.com',
    password: '$2b$10$H4WvitrMsVbDQiSZStCMtOjXdJ6eeC3e.$2b$05$Ru853OuumyHkvztCVpCiUe3zjZQtqNT7aACSi1fRby5L522W6u93e',
    blockExpires: new Date('2024-10-16T00:00:00.000Z'),
    loginAttempts: 0,
    roleId: new mongoose.Types.ObjectId('670fbc619aedcfcb302862cc'),
    createdAt: new Date('2024-10-16T00:00:00.000Z'),
    updateAt: new Date('2024-10-16T00:00:00.000Z'),
  },
]
