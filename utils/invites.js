// Simple in-memory invite cache: guildId -> Map(inviteCode -> uses)
const inviteCache = new Map();

async function cacheGuildInvites(guild) {
  try {
    const invites = await guild.invites.fetch();
    inviteCache.set(guild.id, new Map(invites.map((inv) => [inv.code, inv.uses || 0])));
  } catch (err) {
    // Bot এর "Manage Server" permission না থাকলে এখানে এরর আসবে
    inviteCache.set(guild.id, new Map());
  }
}

async function resolveUsedInvite(member) {
  const guild = member.guild;
  try {
    const newInvites = await guild.invites.fetch();
    const oldMap = inviteCache.get(guild.id) || new Map();

    let used = null;
    for (const invite of newInvites.values()) {
      const oldUses = oldMap.get(invite.code) || 0;
      if ((invite.uses || 0) > oldUses) {
        used = invite;
        break;
      }
    }

    inviteCache.set(guild.id, new Map(newInvites.map((inv) => [inv.code, inv.uses || 0])));
    return used;
  } catch (err) {
    return null;
  }
}

function setInviteCode(guildId, code, uses) {
  const map = inviteCache.get(guildId) || new Map();
  map.set(code, uses);
  inviteCache.set(guildId, map);
}

function removeInviteCode(guildId, code) {
  const map = inviteCache.get(guildId);
  if (map) map.delete(code);
}

module.exports = { cacheGuildInvites, resolveUsedInvite, setInviteCode, removeInviteCode };
