const { setInviteCode } = require('../utils/invites');

module.exports = {
  name: 'inviteCreate',
  execute(invite) {
    if (!invite.guild) return;
    setInviteCode(invite.guild.id, invite.code, invite.uses || 0);
  },
};
