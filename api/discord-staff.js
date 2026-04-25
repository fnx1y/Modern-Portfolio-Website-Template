export default async function handler(req, res) {
  try {
    const token = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;

    if (!token || !guildId) {
      return res.status(500).json({ error: "Missing Discord environment variables." });
    }

    const roleMap = [
      { id: "1407926176466337852", name: "Founder" },
      { id: "1474476569488658545", name: "Co-Founder" },
      { id: "1465196125752660232", name: "Assistant Founder" },
      { id: "1481101982340222987", name: "Advisor" },
      { id: "1471663787223417064", name: "Director" },
      { id: "1471663893091979379", name: "Deputy Director" },
      { id: "1471663815761592465", name: "Assistant Director" },
      { id: "1443041247756292217", name: "Staff Overseer" },
      { id: "1407929364993020096", name: "Executive" },
      { id: "1488198966343635115", name: "Trial Executive" },
      { id: "1472340877807714336", name: "Community Manager" },
      { id: "1407928098288304199", name: "Head Management" },
      { id: "1407928369995059240", name: "Senior Management" },
      { id: "1479319810939555931", name: "Management" },
      { id: "1407928300159897723", name: "Junior Management" },
      { id: "1470825402653085809", name: "Staff Supervisor" }
    ];

    const members = [];
    let after = "0";

    while (true) {
      const response = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000&after=${after}`,
        {
          headers: {
            Authorization: `Bot ${token}`
          }
        }
      );

      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({
          error: "Failed to fetch guild members.",
          details: text
        });
      }

      const batch = await response.json();

      if (!Array.isArray(batch) || batch.length === 0) {
        break;
      }

      members.push(...batch);
      after = batch[batch.length - 1].user.id;

      if (batch.length < 1000) {
        break;
      }
    }

    const grouped = roleMap.map((role) => {
      const matched = members
        .filter((member) => Array.isArray(member.roles) && member.roles.includes(role.id))
        .map((member) => ({
          id: member.user.id,
          username: member.user.global_name || member.user.username,
          tag: member.user.username,
          avatar: member.user.avatar
            ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=128`
            : null
        }))
        .sort((a, b) => a.username.localeCompare(b.username));

      return {
        roleId: role.id,
        roleName: role.name,
        members: matched
      };
    });

    return res.status(200).json({ roles: grouped });
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error."
    });
  }
}
