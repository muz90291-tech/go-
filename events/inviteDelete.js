const { removeInviteCode } = require('../utils/invites');

module.exports = {
  name: 'inviteDelete',
  execute(invite) {
    if (!invite.guild) return;
    removeInviteCode(invite.guild.id, invite.code);
  },
};
